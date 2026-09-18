import { Component, OnDestroy, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { forkJoin } from 'rxjs';
import {
  AffiliationInfo,
  DashboardCounts,
  EtlStatusResponse,
  HeatmapResponse,
  LineChartInfo,
  NameValue,
  SystemHealth,
  Word,
  YearsResponse,
} from 'src/app/shared/interfaces/dashboard.interface';
import { DashboardAdminService } from 'src/app/search-engine/domain/services/dashboard-admin.service';

interface HeatmapUniversity {
  scopus_id: number;
  name: string;
  cells: Record<string, number | undefined>; // topic_name → total_articles (affiliation_topics_year)
  rowTotal: number;
}

interface SystemWarning {
  title: string;
  value: string;
  detail: string;
  level: 'ok' | 'warn' | 'error';
}

@Component({
  selector: 'app-strategic-analytics',
  templateUrl: './strategic-analytics.component.html',
  styleUrls: ['./strategic-analytics.component.css'],
})
export class StrategicAnalyticsComponent implements OnInit, OnDestroy {
  constructor(private dashboardAdminService: DashboardAdminService) {}

  // ── A: Salud del Sistema ───────────────────────────────────────────────────
  etlStatus: 'idle' | 'processing' | 'completed' | 'error' = 'idle';
  etlMessage = '';
  private etlPollInterval: ReturnType<typeof setInterval> | null = null;
  private etlPollFailures = 0;
  private readonly ETL_POLL_MAX_FAILURES = 4;

  get etlLoading(): boolean {
    return this.etlStatus === 'processing';
  }

  systemWarnings: SystemWarning[] = [];

  runEtl(): void {
    if (this.etlStatus === 'processing') return;

    this.dashboardAdminService.runEtl().subscribe({
      next: (res) => {
        // 202 Accepted: el backend inició el hilo ETL
        this.etlStatus = 'processing';
        this.etlMessage = res.message;
        this.startEtlPolling();
      },
      error: (err) => {
        if (err.status === 409) {
          // Ya estaba corriendo: sincronizamos estado y seguimos polingando
          this.etlStatus = 'processing';
          this.etlMessage = 'ETL ya en ejecución — monitoreando...';
          this.startEtlPolling();
        } else {
          this.etlStatus = 'error';
          this.etlMessage = 'Error al conectar con el servidor';
          setTimeout(() => {
            this.etlStatus = 'idle';
            this.etlMessage = '';
          }, 5000);
        }
      },
    });
  }

  private startEtlPolling(): void {
    this.stopEtlPolling();
    this.etlPollFailures = 0;
    this.etlPollInterval = setInterval(() => {
      this.dashboardAdminService.getEtlStatus().subscribe({
        next: (res) => {
          this.etlPollFailures = 0;
          if (res.status === 'idle') {
            this.etlStatus = 'completed';
            this.etlMessage = 'Base de datos actualizada exitosamente';
            this.stopEtlPolling();
            this.loadSystemWarnings();
            this.refreshAllData();
            setTimeout(() => {
              this.etlStatus = 'idle';
              this.etlMessage = '';
            }, 6000);
          }
          // Si sigue 'running', no hacemos nada: el interval sigue corriendo
        },
        error: () => {
          // Error de red: toleramos fallos transitorios, pero si el backend
          // queda caído de forma persistente dejamos de sondear indefinidamente.
          this.etlPollFailures++;
          if (this.etlPollFailures >= this.ETL_POLL_MAX_FAILURES) {
            this.stopEtlPolling();
            this.etlStatus = 'error';
            this.etlMessage = 'Se perdió la conexión con el servidor durante el ETL';
            setTimeout(() => {
              this.etlStatus = 'idle';
              this.etlMessage = '';
            }, 6000);
          }
        },
      });
    }, 15_000); // cada 15 segundos
  }

  private stopEtlPolling(): void {
    if (this.etlPollInterval !== null) {
      clearInterval(this.etlPollInterval);
      this.etlPollInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopEtlPolling();
  }

  private loadSystemWarnings(): void {
    forkJoin({
      health: this.dashboardAdminService.getSystemHealth(),
      etl: this.dashboardAdminService.getEtlStatus(),
    }).subscribe({
      next: ({ health, etl }) => {
        this.systemWarnings = this.buildSystemWarnings(health, etl);
      },
      error: (err) => console.error('Error cargando salud del sistema:', err),
    });
  }

  private buildSystemWarnings(health: SystemHealth, etl: EtlStatusResponse): SystemWarning[] {
    const lastRunValue = etl.last_run_at
      ? new Date(etl.last_run_at).toLocaleString('es-EC')
      : 'Sin ejecuciones';
    const lastRunLevel: 'ok' | 'warn' | 'error' =
      etl.last_run_status === 'error' ? 'error' : etl.last_run_status === 'success' ? 'ok' : 'warn';
    const lastRunDetail =
      etl.last_run_status === 'error'
        ? 'La última ejecución falló'
        : etl.last_run_status === 'success'
          ? 'Ejecución exitosa'
          : 'Aún no se ha ejecutado el ETL en este servidor';

    return [
      {
        title: 'Autores sin métricas',
        value: String(health.authors_no_updated),
        detail: `de ${health.total_authors} autores en Neo4j`,
        level: health.authors_no_updated > 0 ? 'warn' : 'ok',
      },
      {
        title: 'Última ejecución ETL',
        value: lastRunValue,
        detail: lastRunDetail,
        level: lastRunLevel,
      },
      {
        title: 'Colecciones desactualizadas',
        value: String(health.stale_collections),
        detail: health.stale_collection_names.length
          ? health.stale_collection_names.join(', ')
          : 'Todas sincronizadas',
        level: health.stale_collections > 0 ? 'warn' : 'ok',
      },
      {
        title: 'Artículos pendientes',
        value: String(health.articles_pending),
        detail: 'Sin procesar Neo4j → MongoDB',
        level: health.articles_pending > 0 ? 'warn' : 'ok',
      },
    ];
  }

  // ── Nivel 1: KPI Cards (country_acumulated) ────────────────────────────
  kpis = {
    total_authors: 0,
    total_articles: 0,
    total_affiliations: 0,
    total_topics: 0,
  };

  private loadKpis(year: number): void {
    this.dashboardAdminService.getNoSqlDbCounts(year).subscribe({
      next: (counts: DashboardCounts) => {
        this.kpis = {
          total_authors: counts.author,
          total_articles: counts.article,
          total_affiliations: counts.affiliation,
          total_topics: counts.topic,
        };
      },
      error: (err) => console.error('Error cargando KPIs:', err),
    });
  }

  // ── B: Gráfico Histórico (country_year) ────────────────────────────────
  articlesEvolution: LineChartInfo[] = [];

  lineColorScheme: Color = {
    name: 'centinela-line',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1E3C8B', '#60a5fa'],
  };

  private buildArticlesEvolution(years: YearsResponse[]): void {
    let acumulado = 0;
    const perYear: NameValue[] = [];
    const acumuladoSeries: NameValue[] = [];
    for (const y of years) {
      perYear.push({ name: String(y.year), value: y.article });
      acumulado += y.article;
      acumuladoSeries.push({ name: String(y.year), value: acumulado });
    }
    this.articlesEvolution = [
      { name: 'Artículos por año', series: perYear },
      { name: 'Acumulado', series: acumuladoSeries },
    ];
  }

  // ── Nivel 2: Top 10 Instituciones (affiliation_year) ───────────────────
  availableYears: number[] = [];
  selectedYear = 0;

  top10Affiliations: AffiliationInfo[] = [];
  maxAffiliationArticles = 0;

  private loadAvailableYears(): void {
    this.dashboardAdminService.getNoSqlDbYears().subscribe({
      next: (years: YearsResponse[]) => {
        const sorted = [...years].sort((a, b) => a.year - b.year);
        this.availableYears = sorted.map((y) => y.year);
        this.buildArticlesEvolution(sorted);

        const latestYear = this.availableYears[this.availableYears.length - 1];
        if (latestYear) {
          this.selectedYear = latestYear;
          this.heatmapYear = latestYear;
          this.loadKpis(latestYear);
          this.loadTop10Affiliations(latestYear);
          this.loadHeatmap(latestYear);
        }
      },
      error: (err) => console.error('Error cargando años disponibles:', err),
    });
  }

  onYearChange(year: number): void {
    this.selectedYear = Number(year);
    this.loadKpis(this.selectedYear);
    this.loadTop10Affiliations(this.selectedYear);
  }

  private loadTop10Affiliations(year: number): void {
    this.dashboardAdminService.getTopAffiliationsYear(year).subscribe({
      next: (words: Word[]) => {
        const mapped: AffiliationInfo[] = words
          .map((w) => ({ scopus_id: 0, name: w.text, total_articles: w.size }))
          .sort((a, b) => b.total_articles - a.total_articles)
          .slice(0, 10);
        this.top10Affiliations = mapped;
        this.maxAffiliationArticles = mapped[0]?.total_articles ?? 1;
      },
      error: (err) => console.error('Error cargando top instituciones:', err),
    });
  }

  // ── C: Heatmap Tópicos × Universidades (affiliation_topics_year) ──────
  heatmapYear = 0;
  sortedTopics: string[] = [];
  sortedUniversities: HeatmapUniversity[] = [];
  heatmapMaxValue = 0;

  onHeatmapYearChange(year: number): void {
    this.heatmapYear = Number(year);
    this.loadHeatmap(this.heatmapYear);
  }

  private loadHeatmap(year: number): void {
    this.dashboardAdminService.getTopicsHeatmap(year).subscribe({
      next: (res: HeatmapResponse) => {
        const cellLookup = new Map<string, number>();
        res.cells.forEach((c) =>
          cellLookup.set(`${c.scopus_id}|${c.topic_name}`, c.total_articles),
        );

        const universities: HeatmapUniversity[] = res.affiliations.map((a) => {
          const cells: Record<string, number> = {};
          let rowTotal = 0;
          res.topics.forEach((topic) => {
            const v = cellLookup.get(`${a.scopus_id}|${topic}`) ?? 0;
            cells[topic] = v;
            rowTotal += v;
          });
          return { scopus_id: a.scopus_id, name: a.name, cells, rowTotal };
        });

        this.sortedUniversities = [...universities].sort((a, b) => b.rowTotal - a.rowTotal);

        const colTotals: Record<string, number> = {};
        res.topics.forEach((t) => {
          colTotals[t] = universities.reduce((sum, u) => sum + (u.cells[t] ?? 0), 0);
        });
        this.sortedTopics = [...res.topics].sort((a, b) => colTotals[b] - colTotals[a]);

        this.heatmapMaxValue = Math.max(
          0,
          ...universities.flatMap((u) => Object.values(u.cells).map((v) => v ?? 0)),
        );
      },
      error: (err) => console.error('Error cargando heatmap:', err),
    });
  }

  getCellColor(value: number | undefined): string {
    if (!value || this.heatmapMaxValue === 0) return 'rgb(243,244,246)';
    const t = value / this.heatmapMaxValue;
    const r = Math.round(219 - (219 - 30) * t);
    const g = Math.round(234 - (234 - 60) * t);
    const b = Math.round(254 - (254 - 139) * t);
    return `rgb(${r},${g},${b})`;
  }

  getCellTextColor(value: number | undefined): string {
    if (!this.heatmapMaxValue || !value) return '#374151';
    return value / this.heatmapMaxValue > 0.55 ? '#ffffff' : '#1e3c8b';
  }

  // ── D: Drill-down Modal ────────────────────────────────────────────────
  showDrilldownModal = false;
  selectedTopic = '';
  drilldownUniversities: { name: string; total_articles: number }[] = [];
  drilldownMax = 0;

  openTopicDrilldown(topic: string): void {
    this.selectedTopic = topic;
    this.drilldownUniversities = this.sortedUniversities
      .map((u) => ({ name: u.name, total_articles: u.cells[topic] ?? 0 }))
      .sort((a, b) => b.total_articles - a.total_articles);
    this.drilldownMax = this.drilldownUniversities[0]?.total_articles ?? 1;
    this.showDrilldownModal = true;
  }

  closeDrilldown(): void {
    this.showDrilldownModal = false;
    this.selectedTopic = '';
  }

  // ── Nivel 3: Mapa de Árbol (country_topics) ─────────────────────────────
  topicsChartData: NameValue[] = [];
  topicsColorScheme: Color = {
    name: 'centinela-topics',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [],
  };
  topicsColorsCharged = false;

  private buildTopicsTreemap(): void {
    this.dashboardAdminService.getCountryTopics(12).subscribe({
      next: (words: Word[]) => {
        this.topicsChartData = words.map((w) => ({ name: w.text, value: w.size }));
        const n = this.topicsChartData.length;
        this.topicsColorScheme = {
          ...this.topicsColorScheme,
          domain: Array.from({ length: n }, (_, i) =>
            this.lerpColor('#1E3C8B', '#60a5fa', i / Math.max(n - 1, 1)),
          ),
        };
        this.topicsColorsCharged = true;
      },
      error: (err) => console.error('Error cargando tópicos:', err),
    });
  }

  private lerpColor(a: string, b: string, t: number): string {
    const ah = parseInt(a.slice(1), 16);
    const bh = parseInt(b.slice(1), 16);
    const ar = (ah >> 16) & 0xff,
      ag = (ah >> 8) & 0xff,
      ab = ah & 0xff;
    const br = (bh >> 16) & 0xff,
      bg = (bh >> 8) & 0xff,
      bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`;
  }

  get chartWidth(): number {
    const sidebar = window.innerWidth >= 1280 ? 320 : 0;
    return Math.max(400, window.innerWidth - sidebar - 80);
  }

  ngOnInit(): void {
    this.refreshAllData();
    this.loadSystemWarnings();
  }

  private refreshAllData(): void {
    this.loadAvailableYears();
    this.buildTopicsTreemap();
  }

  protected readonly window = window;
  protected readonly Math = Math;
}
