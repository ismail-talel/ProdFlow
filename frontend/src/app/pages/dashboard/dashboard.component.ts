import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);

  summary = {
    ordersCount: 0,
    productsCount: 0,
    suppliersCount: 0,
    usersCount: 0
  };
  lowStock: any[] = [];
  recentOrders: any[] = [];
  statusBreakdown: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Charger le résumé, le stock faible et les commandes récentes
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary = res.data.summary;
          this.lowStock = res.data.lowStock || [];
          this.recentOrders = res.data.recentOrders || [];
        }
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des données du tableau de bord.');
      }
    });

    // Charger les statistiques d'états de commandes
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.ordersByStatus) {
          this.computeStatusBreakdown(res.data.ordersByStatus);
        }
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des statistiques.');
      }
    });
  }

  computeStatusBreakdown(ordersByStatus: any[]): void {
    const totalOrders = ordersByStatus.reduce((acc, curr) => acc + curr.count, 0);

    const statusConfig: { [key: string]: { label: string; color: string } } = {
      en_attente_verification: { label: 'Attente Vérification', color: 'warning' },
      confirme: { label: 'Confirmé', color: 'success' }
    };

    this.statusBreakdown = ordersByStatus
      .filter((item) => statusConfig[item._id])
      .map((item) => {
        const config = statusConfig[item._id];
        const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
        return {
          label: config.label,
          count: item.count,
          percentage,
          colorClass: config.color
        };
      });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      en_attente_verification: 'badge-warning',
      confirme: 'badge-success'
    };
    return classes[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      en_attente_verification: 'Attente Vérification',
      confirme: 'Confirmé'
    };
    return labels[status] || status;
  }
}
