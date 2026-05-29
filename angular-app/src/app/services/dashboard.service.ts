import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, TrendData, ActivityLog, AppNotification } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(delay?: number): Observable<DashboardStats> {
    let params = new HttpParams();
    if (delay) params = params.set('delay', delay.toString());
    return this.http.get<DashboardStats>('/api/dashboard/stats', { params });
  }

  getTrends(delay?: number): Observable<TrendData[]> {
    let params = new HttpParams();
    if (delay) params = params.set('delay', delay.toString());
    return this.http.get<TrendData[]>('/api/dashboard/trends', { params });
  }

  getActivity(delay?: number, limit: number = 8): Observable<ActivityLog[]> {
    let params = new HttpParams();
    if (delay) params = params.set('delay', delay.toString());
    params = params.set('limit', limit.toString());
    return this.http.get<ActivityLog[]>('/api/activity', { params });
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>('/api/notifications');
  }
}
