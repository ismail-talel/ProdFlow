import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);

  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${API_URL}/suppliers`);
  }

  getSupplierById(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/suppliers/${id}`);
  }

  createSupplier(supplierData: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/suppliers`, supplierData);
  }

  updateSupplier(id: string, supplierData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/suppliers/${id}`, supplierData);
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/suppliers/${id}`);
  }
}
