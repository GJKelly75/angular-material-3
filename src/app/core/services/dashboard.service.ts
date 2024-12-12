import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  completedProjects: number;
}

export interface RecentActivity {
  id: string;
  type: 'login' | 'project' | 'task';
  description: string;
  timestamp: Date;
  user: string;
}

export interface ProjectMetrics {
  name: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
  dueDate: Date;
}

export interface UserPerformance {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    // Mock data for testing
    return of({
      totalUsers: 1250,
      activeUsers: 847,
      totalProjects: 56,
      completedProjects: 32
    });
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    // Mock data for testing
    return of([
      {
        id: '1',
        type: 'login',
        description: 'New user login detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        user: 'John Doe'
      },
      {
        id: '2',
        type: 'project',
        description: 'Project "Dashboard UI" updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        user: 'Jane Smith'
      },
      {
        id: '3',
        type: 'task',
        description: 'Task "Implement Charts" completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        user: 'Mike Johnson'
      }
    ]);
  }

  getUserPerformance(): Observable<UserPerformance> {
    // Mock data for testing
    return of({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [65, 59, 80, 81, 56, 55],
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        },
        {
          label: 'Projects Delivered',
          data: [28, 48, 40, 19, 86, 27],
          backgroundColor: 'rgba(153, 102, 255, 0.2)'
        }
      ]
    });
  }

  getProjectMetrics(): Observable<ProjectMetrics[]> {
    // Mock data for testing
    return of([
      {
        name: 'Dashboard UI',
        progress: 75,
        status: 'on-track',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
      },
      {
        name: 'API Integration',
        progress: 45,
        status: 'at-risk',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
      },
      {
        name: 'Database Migration',
        progress: 30,
        status: 'behind',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1)
      },
      {
        name: 'User Authentication',
        progress: 90,
        status: 'on-track',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    ]);
  }
}
