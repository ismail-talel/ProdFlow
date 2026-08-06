import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, BACKEND_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);

  getOrders(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(`${API_URL}/orders`, { params });
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/orders/${id}`);
  }

  getOrderHistory(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/orders/${id}/history`);
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/orders`, orderData);
  }

  verifyOrder(id: string, verificationData: { corrections: any[]; commentaire?: string }): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${id}/verify`, verificationData);
  }

  modifyOrder(id: string, orderData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${id}`, orderData);
  }

  confirmOrder(id: string, commentaire?: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${id}/confirm`, { commentaire: commentaire || '' });
  }

  receiveOrder(id: string, receptionData: { products: any[]; commentaire?: string }): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${id}/receive`, receptionData);
  }

  expediteOrder(id: string, commentaire?: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${id}/expedite`, { commentaire: commentaire || '' });
  }

  updateHistoryEntry(orderId: string, historyId: string, data: { commentaire?: string; description?: string; editReason?: string }): Observable<any> {
    return this.http.put<any>(`${API_URL}/orders/${orderId}/history/${historyId}`, data);
  }

  deleteOrder(id: string, commentaire?: string): Observable<any> {
    return this.http.request<any>('DELETE', `${API_URL}/orders/${id}`, {
      body: { commentaire: commentaire || '' }
    });
  }

  printOrder(id: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/orders/${id}/print`);
  }

  getPrintFileUrl(pdfUrl: string): string {
    return pdfUrl.startsWith('http') ? pdfUrl : `${BACKEND_BASE_URL}${pdfUrl}`;
  }

  getPrintSettings(): Observable<any> {
    return this.http.get<any>(`${API_URL}/print-settings`);
  }

  updatePrintSettings(settingsData: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/print-settings`, settingsData);
  }
}
