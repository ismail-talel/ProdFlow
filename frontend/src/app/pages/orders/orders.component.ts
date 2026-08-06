import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrderService } from '../../services/order.service';
import { SupplierService } from '../../services/supplier.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  orders: any[] = [];
  suppliers: any[] = [];
  supplierProducts: any[] = [];

  loading = false;
  savingOrder = false;
  submittingAction = false;

  isAdmin = false;
  isReception = false;
  isExpedition = false;
  canCreate = false;
  canConfirmModify = false;

  filterStatus = '';
  filterSupplier = '';

  createModalOpen = false;
  newOrderTotal = 0;
  newOrder: any = this.getEmptyOrder();

  detailModalOpen = false;
  selectedOrder: any = null;

  pdfPreviewOpen = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfDownloadUrl = '';
  pdfFileName = '';
  pdfLoading = false;

  actionComment = '';
  receptionProducts: any[] = [];

  // Formulaire de modification BC
  editForm: {
    deliveryDate: string;
    notes: string;
    products: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>;
  } = { deliveryDate: '', notes: '', products: [] };

  // Édition historique
  editingHistoryId: string | null = null;
  historyEditComment = '';
  historyEditDescription = '';
  detailFocus: 'modify' | 'confirm' | 'view' = 'view';

  ngOnInit(): void {
    this.refreshPermissions();
    this.authService.currentUser$.subscribe(() => this.refreshPermissions());

    this.loadOrders();
    this.loadSuppliers();
  }

  private refreshPermissions(): void {
    this.isAdmin = this.authService.hasRole(['admin_magasin', 'super_admin']);
    this.isReception = this.authService.hasRole(['responsable_reception', 'super_admin']);
    this.isExpedition = this.authService.hasRole(['expedition_magasin', 'super_admin']);
    this.canCreate = this.authService.hasRole(['admin_magasin', 'super_admin', 'responsable_reception']);
    this.canConfirmModify = this.authService.hasRole([
      'admin_magasin',
      'super_admin',
      'responsable_reception',
      'expedition_magasin'
    ]);
  }

  getEmptyOrder() {
    return {
      supplierId: '',
      deliveryDate: '',
      notes: '',
      products: []
    };
  }

  canModifyOrder(order: any): boolean {
    if (!order || !this.canConfirmModify) return false;
    return (order.status || '').toString().trim() === 'en_attente_verification';
  }

  canConfirmOrder(order: any): boolean {
    if (!order || !this.canConfirmModify) return false;
    return (order.status || '').toString().trim() === 'en_attente_verification';
  }

  canDeleteOrder(order: any): boolean {
    if (!order || !this.isAdmin) return false;
    return true;
  }

  onDeleteOrder(order: any): void {
    if (!order?._id || !this.canDeleteOrder(order)) return;

    const ok = confirm(
      `Supprimer le bon de commande ${order.orderNumber} ?\n\nCette action est définitive.`
    );
    if (!ok) return;

    const commentaire = prompt('Motif de suppression (optionnel) :') || '';

    this.submittingAction = true;
    this.orderService.deleteOrder(order._id, commentaire).subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success(res.message || 'Bon de commande supprimé.');
          if (this.detailModalOpen) this.closeDetailModal();
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Suppression impossible.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur lors de la suppression.');
      }
    });
  }

  loadOrders(): void {
    this.loading = true;
    const filters = {
      status: this.filterStatus,
      supplierId: this.filterSupplier
    };

    this.orderService.getOrders(filters).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.orders = res.data;
        }
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des commandes.');
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (res) => {
        if (res.success && res.data) this.suppliers = res.data;
      }
    });
  }

  onSupplierChange(): void {
    this.newOrder.products = [];
    this.newOrderTotal = 0;
    this.supplierProducts = [];

    if (!this.newOrder.supplierId) return;

    this.productService.getProducts({ supplier: this.newOrder.supplierId }).subscribe({
      next: (res) => {
        const linked = res.success && Array.isArray(res.data) ? res.data : [];
        if (linked.length > 0) {
          this.supplierProducts = linked;
          return;
        }

        // Fallback : produits non liés / tous les actifs, pour ne pas bloquer la création
        this.productService.getProducts().subscribe({
          next: (allRes) => {
            this.supplierProducts = allRes.success && Array.isArray(allRes.data) ? allRes.data : [];
            if (this.supplierProducts.length === 0) {
              this.toastService.warning(
                'Aucun produit disponible. Créez d’abord un produit et associez-le à un fournisseur.'
              );
            } else {
              this.toastService.warning(
                'Aucun produit lié à ce fournisseur : tous les produits actifs sont proposés. Associez-les dans Produits pour filtrer correctement.'
              );
            }
          },
          error: () => {
            this.toastService.error('Impossible de charger les produits.');
          }
        });
      },
      error: () => {
        this.toastService.error('Impossible de charger les produits du fournisseur.');
      }
    });
  }

  openCreateModal(): void {
    this.newOrder = this.getEmptyOrder();
    this.newOrderTotal = 0;
    this.supplierProducts = [];
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  addProductRow(): void {
    this.newOrder.products.push({
      productId: '',
      quantity: 1,
      unitPrice: 0
    });
  }

  removeProductRow(index: number): void {
    this.newOrder.products.splice(index, 1);
    this.calculateOrderTotal();
  }

  onProductSelect(index: number): void {
    const selectedProdId = this.newOrder.products[index].productId;
    const matchedProduct = this.supplierProducts.find(p => p._id === selectedProdId);
    if (matchedProduct) {
      this.newOrder.products[index].unitPrice = matchedProduct.unitPrice ?? matchedProduct.priceHT ?? 0;
    } else {
      this.newOrder.products[index].unitPrice = 0;
    }
    this.calculateOrderTotal();
  }

  calculateOrderTotal(): void {
    this.newOrderTotal = this.newOrder.products.reduce((acc: number, curr: any) => {
      return acc + (curr.quantity * curr.unitPrice);
    }, 0);
  }

  onCreateOrder(): void {
    if (!this.newOrder.supplierId) {
      this.toastService.error('Veuillez sélectionner un fournisseur.');
      return;
    }

    const products = (this.newOrder.products || [])
      .filter((p: any) => p.productId && Number(p.quantity) > 0)
      .map((p: any) => ({
        productId: p.productId,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice) || 0
      }));

    if (products.length === 0) {
      this.toastService.error('Ajoutez au moins un produit avec une quantité valide.');
      return;
    }

    this.savingOrder = true;
    const payload = {
      supplierId: this.newOrder.supplierId,
      deliveryDate: this.newOrder.deliveryDate || undefined,
      notes: this.newOrder.notes || '',
      products
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        this.savingOrder = false;
        if (res.success) {
          this.toastService.success('Bon de commande créé avec succès !');
          this.closeCreateModal();
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Erreur lors de la création.');
        }
      },
      error: (err) => {
        this.savingOrder = false;
        const msg =
          err.error?.message ||
          (Array.isArray(err.error?.errors) ? err.error.errors.join(', ') : null) ||
          'Erreur serveur lors de la création du bon de commande.';
        this.toastService.error(msg);
      }
    });
  }

  openDetailModal(orderOrId: any, focus: 'modify' | 'confirm' | 'view' = 'view'): void {
    const id = typeof orderOrId === 'string' ? orderOrId : orderOrId?._id;
    if (!id) {
      this.toastService.error('Identifiant de commande invalide.');
      return;
    }

    this.detailFocus = focus;
    this.loading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.selectedOrder = res.data;
          this.actionComment = '';
          this.cancelHistoryEdit();
          this.initEditForm(this.selectedOrder);

          this.receptionProducts = (this.selectedOrder.products || []).map((p: any) => ({
            productId: p.product?._id || p.product,
            name: p.product?.name || p.product?.designation || 'Produit',
            remainingQuantity: p.remainingQuantity,
            receivedQty: p.remainingQuantity
          }));

          this.detailModalOpen = true;

          if (focus === 'modify' || focus === 'confirm') {
            setTimeout(() => this.scrollToActions(focus), 120);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Impossible de charger les détails de la commande.');
      }
    });
  }

  scrollToActions(focus: 'modify' | 'confirm' | 'view' = 'modify'): void {
    this.detailFocus = focus;
    const id = focus === 'confirm' ? 'panel-confirm' : 'panel-modify';
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private initEditForm(order: any): void {
    this.editForm = {
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().substring(0, 10)
        : '',
      notes: order.notes || '',
      products: (order.products || []).map((p: any) => ({
        productId: p.product?._id || p.product,
        name: p.product?.name || p.product?.designation || 'Produit',
        quantity: p.quantity,
        unitPrice: p.unitPrice
      }))
    };
  }

  closeDetailModal(): void {
    this.detailModalOpen = false;
    this.selectedOrder = null;
    this.cancelHistoryEdit();
  }

  calculateEditTotal(): number {
    return this.editForm.products.reduce(
      (acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
      0
    );
  }

  // MODIFICATION du bon de commande
  onModifyOrder(): void {
    if (!this.selectedOrder) return;

    const payload = {
      deliveryDate: this.editForm.deliveryDate || null,
      notes: this.editForm.notes,
      products: this.editForm.products.map(p => ({
        productId: p.productId,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice)
      })),
      commentaire: this.actionComment || 'Modification du bon de commande'
    };

    this.submittingAction = true;
    this.orderService.modifyOrder(this.selectedOrder._id, payload).subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success('Bon de commande modifié. Historique mis à jour.');
          this.openDetailModal(this.selectedOrder._id);
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Erreur lors de la modification.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur lors de la modification.');
      }
    });
  }

  // CONFIRM
  onConfirmOrder(orderId: string): void {
    if (!orderId) return;
    if (!confirm('Confirmer définitivement ce bon de commande ?')) {
      return;
    }

    this.submittingAction = true;
    this.orderService.confirmOrder(orderId, this.actionComment || 'Confirmation du bon de commande').subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success('Commande confirmée. Historique mis à jour.');
          this.openDetailModal(orderId);
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Erreur de confirmation.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur de confirmation.');
      }
    });
  }

  onReceiveOrder(orderId: string): void {
    const receivedItems = this.receptionProducts
      .filter(item => item.receivedQty > 0)
      .map(item => ({
        productId: item.productId,
        quantity: item.receivedQty
      }));

    if (receivedItems.length === 0) {
      this.toastService.warning('Veuillez saisir au moins une quantité supérieure à 0.');
      return;
    }

    this.submittingAction = true;
    const payload = {
      products: receivedItems,
      commentaire: this.actionComment || 'Réception marchandises'
    };

    this.orderService.receiveOrder(orderId, payload).subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success('Entrée en stock enregistrée.');
          this.openDetailModal(orderId);
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Erreur lors de la réception.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur lors de la réception.');
      }
    });
  }

  onExpediteOrder(orderId: string): void {
    this.submittingAction = true;
    this.orderService.expediteOrder(orderId, this.actionComment || 'Expédition validée').subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success('Commande expédiée.');
          this.openDetailModal(orderId);
          this.loadOrders();
        } else {
          this.toastService.error(res.message || 'Erreur d\'expédition.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur d\'expédition.');
      }
    });
  }

  // HISTORIQUE — édition
  startHistoryEdit(entry: any): void {
    if (!this.canConfirmModify) return;
    this.editingHistoryId = entry.historyId || entry._id;
    this.historyEditComment = entry.commentaire || '';
    this.historyEditDescription = entry.description || '';
  }

  cancelHistoryEdit(): void {
    this.editingHistoryId = null;
    this.historyEditComment = '';
    this.historyEditDescription = '';
  }

  saveHistoryEdit(): void {
    if (!this.selectedOrder || !this.editingHistoryId) return;

    this.submittingAction = true;
    this.orderService.updateHistoryEntry(this.selectedOrder._id, this.editingHistoryId, {
      commentaire: this.historyEditComment,
      description: this.historyEditDescription,
      editReason: 'Correction manuelle de l\'historique'
    }).subscribe({
      next: (res) => {
        this.submittingAction = false;
        if (res.success) {
          this.toastService.success('Historique modifié.');
          this.cancelHistoryEdit();
          this.openDetailModal(this.selectedOrder._id);
        } else {
          this.toastService.error(res.message || 'Erreur de mise à jour de l\'historique.');
        }
      },
      error: (err) => {
        this.submittingAction = false;
        this.toastService.error(err.error?.message || 'Erreur de mise à jour de l\'historique.');
      }
    });
  }

  getSortedHistory(): any[] {
    if (!this.selectedOrder?.history) return [];
    return [...this.selectedOrder.history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  onPrintOrder(orderId: string): void {
    this.pdfLoading = true;
    this.orderService.printOrder(orderId).subscribe({
      next: (res) => {
        this.pdfLoading = false;
        const pdfUrl = res?.data?.pdfUrl;

        if (!res?.success || !pdfUrl) {
          this.toastService.error(res?.message || 'Aucun PDF n\'a été généré pour cette commande.');
          return;
        }

        const fileURL = this.orderService.getPrintFileUrl(pdfUrl);
        const cacheBusted = `${fileURL}${fileURL.includes('?') ? '&' : '?'}t=${Date.now()}`;
        this.pdfDownloadUrl = cacheBusted;
        this.pdfFileName = res?.data?.fileName || 'bon-commande.pdf';
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cacheBusted);
        this.pdfPreviewOpen = true;
        this.toastService.success('Bon de commande généré.');
      },
      error: () => {
        this.pdfLoading = false;
        this.toastService.error('Erreur lors de l\'exportation PDF.');
      }
    });
  }

  closePdfPreview(): void {
    this.pdfPreviewOpen = false;
    this.pdfPreviewUrl = null;
    this.pdfDownloadUrl = '';
    this.pdfFileName = '';
  }

  printPdfPreview(): void {
    if (!this.pdfDownloadUrl) return;
    const win = window.open(this.pdfDownloadUrl, '_blank', 'noopener,noreferrer');
    if (win) {
      win.focus();
    }
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

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      CREATION: 'Création',
      MODIFICATION: 'Modification',
      CORRECTION: 'Correction',
      VERIFICATION: 'Vérification',
      CONFIRMATION: 'Confirmation',
      RECEPTION: 'Réception',
      RECEPTION_PARTIELLE: 'Réception partielle',
      EXPEDITION: 'Expédition',
      IMPRESSION: 'Impression',
      ANNULATION: 'Annulation',
      MAJ_HISTORIQUE: 'Màj historique'
    };
    return labels[action] || action;
  }

  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      super_admin: 'Super Admin',
      admin_magasin: 'Administrateur',
      responsable_reception: 'Réception',
      expedition_magasin: 'Expédition'
    };
    return roles[role] || role;
  }
}
