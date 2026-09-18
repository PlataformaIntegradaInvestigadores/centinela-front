import { Component, Input, OnInit } from '@angular/core';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';

@Component({
  selector: 'app-posture-dashboard',
  templateUrl: './posture-dashboard.component.html',
  styleUrls: ['./posture-dashboard.component.css'],
})
export class PostureDashboardComponent implements OnInit {
  @Input() debateId!: number; // Recibe el ID del debate
  postureCounts = { total_agree: 0, total_disagree: 0, total_neutral: 0, total_active_users: 0 }; // Inicialización
  isLoading = true;

  constructor(private dashboardService: DebateStatisticsService) {}

  ngOnInit(): void {
    this.fetchPostureCounts();
  }

  private fetchPostureCounts(): void {
    this.dashboardService.getStatistics(this.debateId!).subscribe({
      next: (data) => {
        this.postureCounts = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar las estadísticas:', err);
        this.isLoading = false;
      },
    });
  }

  getTotalPostures(): number {
    return (
      this.postureCounts.total_agree +
      this.postureCounts.total_disagree +
      this.postureCounts.total_neutral +
      this.postureCounts.total_active_users
    );
  }
}
