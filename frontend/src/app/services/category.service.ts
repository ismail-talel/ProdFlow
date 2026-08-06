import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  getCategories(): Observable<any> {
    return this.http.get<any>(`${API_URL}/categories`);
  }

  getCategoryById(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/categories/${id}`);
  }

  createCategory(categoryData: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/categories`, categoryData);
  }

  updateCategory(id: string, categoryData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/categories/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/categories/${id}`);
  }
}
