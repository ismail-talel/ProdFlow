import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success'): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    const currentToasts = this.toastsSubject.value;
    
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'danger');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  remove(id: number): void {
    const filteredToasts = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filteredToasts);
  }
}
