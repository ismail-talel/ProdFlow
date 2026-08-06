import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUsers(): Observable<any> {
    return this.http.get<any>(`${API_URL}/users`);
  }

  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/users/${id}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/users`, userData);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/users/${id}`);
  }
}
