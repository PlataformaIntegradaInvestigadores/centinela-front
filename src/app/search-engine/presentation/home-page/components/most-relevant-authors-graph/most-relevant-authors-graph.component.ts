import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Link, Node } from '../../../../../shared/d3';
import { AuthorNode, Coauthors } from '../../../../../shared/interfaces/author.interface';
import { faDownload, faVectorSquare, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { DOCUMENT } from '@angular/common';
import { AuthorService } from '../../../../domain/services/author.service';
import { catchError, EMPTY, tap } from 'rxjs';
import * as htmlToImage from 'html-to-image';
import * as d3 from 'd3';

@Component({
  selector: 'app-most-relevant-authors-graph',
  templateUrl: './most-relevant-authors-graph.component.html',
  styleUrls: ['./most-relevant-authors-graph.component.css'],
})
export class MostRelevantAuthorsGraphComponent implements OnInit, OnChanges {
  @Input() query!: string;
  @Output() loading: EventEmitter<boolean> = new EventEmitter<boolean>();

  d3Nodes!: Node[];
  d3Links!: Link[];

  apiNodes!: AuthorNode[];

  forces: { manyBody: number; collide: number } = { manyBody: 1, collide: 50 };

  showGraph: boolean = false;

  authorsNumber: number = 50;
  affiliations!: { scopus_id: string; name: string }[];
  selectedAffiliations: string[] = [];
  affiliationSearch: string = '';
  noResults = false;
  isLoadingResults = false;
  isFirstLoad = true;
  isFiltering = false;

  @ViewChild('downloadEl') downloadEl!: ElementRef;
  faDownload = faDownload;
  faVectorSquare = faVectorSquare;
  faMagnifyingGlass = faMagnifyingGlass;

  // Seleccion de zona para exportar solo una parte del grafo
  selectingRegion = false;
  regionStart: { x: number; y: number } | null = null;
  regionRect: { x: number; y: number; w: number; h: number } | null = null;

  constructor(
    private authorService: AuthorService,
    @Inject(DOCUMENT) private coreDoc: Document,
  ) {}

  ngOnInit() {
    this.refreshGraph();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['query'] && !changes['query'].firstChange) {
      this.isFirstLoad = true;
      this.noResults = false;
      this.selectedAffiliations = [];
      this.affiliationSearch = '';
      if (this.authorsNumber === 0) {
        this.authorsNumber = 50;
      }
      this.refreshGraph();
    }
  }

  refreshGraph() {
    this.showGraph = false;
    this.loading.emit(true);
    this.authorService
      .getMostRelevantAuthors(this.query, this.authorsNumber)
      .pipe(
        catchError((error) => {
          console.error('Error fetching most relevant authors graph:', error);
          this.noResults = true;
          this.showGraph = true;
          this.isFirstLoad = false;
          this.isFiltering = false;
          this.d3Nodes = [];
          this.d3Links = [];
          this.loading.emit(false);
          return EMPTY;
        }),
        tap((coauthors) => {
          this.affiliations = [];
          coauthors.nodes.length === 0 ? (this.noResults = true) : (this.noResults = false);
          this.affiliations = coauthors.affiliations;
          this.sortAffiliations();
          this.setupGraph(coauthors);
          this.showGraph = true;
          this.isFirstLoad = false;
          this.isFiltering = false;
          this.loading.emit(false);
        }),
      )
      .subscribe();
  }

  setupGraph(coauthors: Coauthors) {
    this.apiNodes = coauthors.nodes;
    this.d3Nodes = this.getD3Nodes();
    this.d3Links = this.getD3Links(coauthors.links);

    // Zoom out initially — only if there are actual nodes to display
    if (coauthors.nodes.length > 0) {
      setTimeout(() => {
        this.resetZoom();
      }, 100);
    }
  }

  onAuthorsNumberChange() {
    console.log(this.authorsNumber);
    this.isFiltering = true;
    this.refreshGraph();
  }

  setAuthorsNumber(num: number) {
    this.authorsNumber = num;
    this.onAuthorsNumberChange();
  }

  onClickCheckbox(event: any) {
    const item = String(event.target.id);
    if (event.target.checked) {
      if (!this.selectedAffiliations.includes(item)) {
        this.selectedAffiliations.push(item);
      }
    } else {
      this.selectedAffiliations = this.selectedAffiliations.filter((id) => id !== item);
    }

    this.sortAffiliations();

    // console.log(this.selectedAffiliations)
    this.onClickAffiliationsFilter('include');
  }

  sortAffiliations() {
    if (this.affiliations) {
      this.affiliations.sort((a, b) => {
        const aSelected = this.selectedAffiliations.includes(a.scopus_id);
        const bSelected = this.selectedAffiliations.includes(b.scopus_id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return this.normalize(a.name).localeCompare(this.normalize(b.name));
      });
    }
  }

  /** Normaliza texto para buscar/ordenar sin importar mayusculas ni acentos. */
  private normalize(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /** Afiliaciones visibles segun el texto del buscador (coincidencia parcial, sin acentos/mayusculas). */
  get filteredAffiliations(): { scopus_id: string; name: string }[] {
    if (!this.affiliations) return [];
    const term = this.normalize(this.affiliationSearch);
    if (!term) return this.affiliations;
    return this.affiliations.filter((aff) => this.normalize(aff.name).includes(term));
  }

  onClickAffiliationsFilter(type: string) {
    this.showGraph = false;
    this.isFiltering = true;
    if (this.selectedAffiliations.length > 0) {
      this.loading.emit(true);
      this.authorService
        .getMostRelevantAuthors(this.query, this.authorsNumber, type, this.selectedAffiliations)
        .pipe(
          catchError((error) => {
            console.error('Error fetching filtered most relevant authors graph:', error);
            this.noResults = true;
            this.showGraph = true;
            this.isFirstLoad = false;
            this.isFiltering = false;
            this.d3Nodes = [];
            this.d3Links = [];
            this.loading.emit(false);
            return EMPTY;
          }),
          tap((coauthors) => {
            console.log(coauthors);
            // console.log('dentro2: '+ this.authorsNumber)
            this.setupGraph(coauthors);
            this.showGraph = true;
            this.isFirstLoad = false;
            this.isFiltering = false;
            this.loading.emit(false);
          }),
        )
        .subscribe();
    } else {
      this.loading.emit(true);
      console.log(this.query);
      this.authorService
        .getMostRelevantAuthors(this.query, this.authorsNumber)
        .pipe(
          catchError((error) => {
            console.error('Error fetching most relevant authors graph:', error);
            this.noResults = true;
            this.showGraph = true;
            this.isFirstLoad = false;
            this.isFiltering = false;
            this.d3Nodes = [];
            this.d3Links = [];
            this.loading.emit(false);
            return EMPTY;
          }),
          tap((coauthors) => {
            coauthors.nodes.length === 0 ? (this.noResults = true) : (this.noResults = false);
            // console.log('dentro2: xd'+ this.authorsNumber)
            this.affiliations = coauthors.affiliations;
            this.sortAffiliations();
            this.setupGraph(coauthors);
            this.showGraph = true;
            this.isFirstLoad = false;
            this.isFiltering = false;
            this.loading.emit(false);
          }),
        )
        .subscribe();
    }
  }

  getD3Nodes() {
    return this.apiNodes.map((node, index) => {
      return new Node(
        node.scopus_id,
        this.apiNodes.length,
        this.truncateString(node.first_name) + ' \n' + this.truncateString(node.last_name),
        {
          enablePopover: true,
          title: 'Author',
          content: node.first_name + ' ' + node.last_name,
          link: 'profile/' + node.scopus_id,
        },
        this.apiNodes.length - index,
      );
    });
  }

  truncateString(text: string): string {
    const spaceIndex = text.indexOf(' ');
    const dashIndex = text.indexOf('-');
    if (spaceIndex !== -1 && dashIndex !== -1) {
      return text.substring(0, Math.min(spaceIndex, dashIndex));
    } else if (spaceIndex !== -1) {
      return text.substring(0, spaceIndex);
    } else if (dashIndex !== -1) {
      return text.substring(0, dashIndex);
    } else {
      return text;
    }
  }

  getD3Links(
    links: { source: string | number; target: string | number; collabStrength: number }[],
  ) {
    return links.map((link) => {
      this.d3Nodes[this.getIndexByScopusId(link.source)].degree++;
      this.d3Nodes[this.getIndexByScopusId(link.target)].degree++;
      return new Link(link.source, link.target, link.collabStrength * (4 + 1));
    });
  }

  getIndexByScopusId(scopusId: any) {
    return this.apiNodes.map((node) => String(node.scopus_id)).indexOf(String(scopusId));
  }

  downloadDataUrl(dataUrl: string, filename: string): void {
    const a = this.coreDoc.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    this.coreDoc.body.appendChild(a);
    a.click();
    this.coreDoc.body.removeChild(a);
  }

  onDownloadGraph(): void {
    // Encajar el grafo COMPLETO en el viewport (fit-to-content) antes de capturar,
    // para que la imagen muestre todo el grafo centrado y no un zoom recortado.
    this.fitGraphToView(350);
    setTimeout(() => {
      // Capturar el <svg> del grafo (no el contenedor) evita el espacio en blanco
      // sobrante (svg 600px dentro de un contenedor de 800px) y los botones de zoom.
      // pixelRatio alto => etiquetas nitidas y legibles al ampliar la imagen.
      const svgEl = this.downloadEl.nativeElement.querySelector('graph svg') as HTMLElement | null;
      const target = svgEl ?? this.downloadEl.nativeElement;
      htmlToImage.toPng(target, { pixelRatio: 3, backgroundColor: '#ffffff' }).then((dataUrl) => {
        this.downloadDataUrl(dataUrl, `most-relevant-authors-graph-${this.query}`);
      });
    }, 450); // espera a que termine la transicion del fit (350ms)
  }

  /** Calcula el bounding box real del grafo y ajusta zoom+pan para que entre
   *  completo y centrado en el viewport (a diferencia de resetZoom, que aplica
   *  un escalado fijo que puede recortar grafos dispersos). */
  private fitGraphToView(durationMs: number): void {
    const data = this.getSvgAndZoom();
    if (!data || !data.zoom) return;
    const container = data.svgEl.querySelector('g.my-border') as SVGGraphicsElement | null;
    if (!container) return;
    const bbox = container.getBBox(); // bbox del contenido en coords de la simulacion
    if (!bbox.width || !bbox.height) return;
    const vw = data.svgEl.clientWidth || 800;
    const vh = data.svgEl.clientHeight || 600;
    const scale = Math.min(Math.min(vw / bbox.width, vh / bbox.height) * 0.9, 1.5); // 0.9 = margen, tope 1.5x
    const tx = vw / 2 - scale * (bbox.x + bbox.width / 2);
    const ty = vh / 2 - scale * (bbox.y + bbox.height / 2);
    data.svg
      .transition()
      .duration(durationMs)
      .call(data.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // --- Seleccion de zona: arrastrar un rectangulo sobre el grafo y exportar solo ese recorte ---
  toggleRegionSelect(): void {
    this.selectingRegion = !this.selectingRegion;
    this.regionStart = null;
    this.regionRect = null;
  }

  private regionCoords(e: MouseEvent): { x: number; y: number } {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  onRegionMouseDown(e: MouseEvent): void {
    const p = this.regionCoords(e);
    this.regionStart = p;
    this.regionRect = { x: p.x, y: p.y, w: 0, h: 0 };
  }

  onRegionMouseMove(e: MouseEvent): void {
    if (!this.regionStart) return;
    const p = this.regionCoords(e);
    this.regionRect = {
      x: Math.min(this.regionStart.x, p.x),
      y: Math.min(this.regionStart.y, p.y),
      w: Math.abs(p.x - this.regionStart.x),
      h: Math.abs(p.y - this.regionStart.y),
    };
  }

  onRegionMouseUp(): void {
    if (this.regionRect && this.regionRect.w > 5 && this.regionRect.h > 5) {
      this.exportRegion(this.regionRect);
      this.selectingRegion = false;
    }
    this.regionStart = null;
    this.regionRect = null;
  }

  /** Exporta solo el rectangulo seleccionado (en coords del viewport del grafo) en alta resolucion. */
  private exportRegion(rect: { x: number; y: number; w: number; h: number }): void {
    const svgEl = this.downloadEl.nativeElement.querySelector('graph svg') as HTMLElement | null;
    if (!svgEl) return;
    const PR = 3; // pixelRatio: alta resolucion para que las etiquetas se lean
    htmlToImage.toPng(svgEl, { pixelRatio: PR, backgroundColor: '#ffffff' }).then((dataUrl) => {
      const img = new Image();
      img.onload = () => {
        const canvas = this.coreDoc.createElement('canvas');
        canvas.width = Math.max(1, Math.round(rect.w * PR));
        canvas.height = Math.max(1, Math.round(rect.h * PR));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // recorta del PNG completo (svg) la region seleccionada (rect * pixelRatio)
        ctx.drawImage(
          img,
          rect.x * PR,
          rect.y * PR,
          rect.w * PR,
          rect.h * PR,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        this.downloadDataUrl(canvas.toDataURL('image/png'), `grafo-zona-${this.query}`);
      };
      img.src = dataUrl;
    });
  }

  // Zoom Controls
  private getSvgAndZoom() {
    if (!this.downloadEl) return null;
    // Note: using 'graph svg' to avoid selecting the icon's svg
    const svgEl = this.downloadEl.nativeElement.querySelector('graph svg');
    if (!svgEl) return null;
    const svg = d3.select(svgEl);
    const zoom = (svgEl as any).__zoomBehavior;
    return { svg, zoom, svgEl };
  }

  zoomIn() {
    const data = this.getSvgAndZoom();
    if (data && data.zoom) {
      data.svg.transition().duration(300).call(data.zoom.scaleBy, 1.3);
    }
  }

  zoomOut() {
    const data = this.getSvgAndZoom();
    if (data && data.zoom) {
      data.svg.transition().duration(300).call(data.zoom.scaleBy, 0.7);
    }
  }

  resetZoom() {
    const data = this.getSvgAndZoom();
    if (data && data.zoom) {
      const width = data.svgEl.clientWidth || 800;
      const height = data.svgEl.clientHeight || 600;
      data.svg
        .transition()
        .duration(750)
        .call(
          data.zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(0.3)
            .translate(-width / 2, -height / 2),
        );
    }
  }

  /** Ajusta zoom y paneo para que TODO el grafo entre en la vista, igual que la
   *  descarga. Usado por el boton "Ver todo" (antes "Centrar", que solo escalaba a 0.3). */
  fitAll(): void {
    this.fitGraphToView(600);
  }
}
