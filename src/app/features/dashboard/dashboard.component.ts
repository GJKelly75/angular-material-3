import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsConfiguration, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

import {
  DashboardService,
  DashboardStats,
  RecentActivity,
  ProjectMetrics,
  UserPerformance
} from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  recentActivities: RecentActivity[] = [];
  projectMetrics: ProjectMetrics[] = [];
  userPerformance: UserPerformance | null = null;
  isLoading = true;
  error: string | null = null;
  isMobileView = false;

  // Chart configuration
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        min: 0
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.checkMobileView();
    window.addEventListener('resize', this.checkMobileView.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkMobileView.bind(this));
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Load dashboard statistics
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load dashboard statistics';
        this.isLoading = false;
        console.error('Dashboard stats error:', error);
      }
    });

    // Load recent activities
    this.dashboardService.getRecentActivity().subscribe({
      next: (data) => {
        this.recentActivities = data;
      },
      error: (error) => {
        console.error('Recent activities error:', error);
      }
    });

    // Load project metrics
    this.dashboardService.getProjectMetrics().subscribe({
      next: (data) => {
        this.projectMetrics = data;
      },
      error: (error) => {
        console.error('Project metrics error:', error);
      }
    });

    // Load user performance data
    this.dashboardService.getUserPerformance().subscribe({
      next: (data) => {
        this.userPerformance = data;
      },
      error: (error) => {
        console.error('User performance error:', error);
      }
    });
  }

  checkMobileView() {
    this.isMobileView = window.innerWidth <= 960;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'on-track':
        return '#4CAF50';
      case 'at-risk':
        return '#FFC107';
      case 'behind':
        return '#F44336';
      default:
        return '#757575';
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
