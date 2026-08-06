import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${API_URL}/dashboard`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${API_URL}/dashboard/stats`);
  }
}
