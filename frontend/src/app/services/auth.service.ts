import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin_magasin' | 'responsable_reception' | 'expedition_magasin' | string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${API_URL}/profile`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/profile`, profileData).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/profile/password`, passwordData);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Normalisation des rôles : on convertit les deux en minuscules sans underscores pour la comparaison
    const normalize = (r: string) => r.toLowerCase().replace(/_/g, '');
    const userRoleNorm = normalize(user.role);
    return roles.some(r => normalize(r) === userRoleNorm);
  }
}
