import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ToastService } from '../../services/toast.service';

type SupplierForm = {
  _id?: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  description: string;
};

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})

export class SuppliersComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private toastService = inject(ToastService);

  suppliers: any[] = [];
  loading = false;
  saving = false;

  modalOpen = false;
  isEdit = false;
  currentSupplier: SupplierForm = this.getEmptySupplier();

  ngOnInit(): void {
    this.loadSuppliers();
  }

  getEmptySupplier(): SupplierForm {
    return {
      code: '',
      name: '',
      email: '',
      phone: '',
      mobile: '',
      description: ''
    };
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.data)) {
          this.suppliers = res.data.filter((s: any) => s.isActive !== false);
        } else {
          this.suppliers = [];
          this.toastService.error(res.message || 'Erreur lors du chargement des fournisseurs.');
        }
      },
      error: () => {
        this.loading = false;
        this.suppliers = [];
        this.toastService.error('Erreur lors du chargement des fournisseurs.');
      }
    });
  }

  openModal(supplier?: any): void {
    if (supplier) {
      this.isEdit = true;
      this.currentSupplier = {
        _id: supplier._id,
        code: supplier.code || supplier.reference || '',
        name: supplier.name || supplier.designation || '',
        email: supplier.email || '',
        phone: supplier.phone || supplier.phone1 || '',
        mobile: supplier.mobile || supplier.phone2 || '',
        description: supplier.description || supplier.notes || ''
      };
    } else {
      this.isEdit = false;
      this.currentSupplier = this.getEmptySupplier();
    }
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.isEdit = false;
    this.currentSupplier = this.getEmptySupplier();
  }

  onSubmit(): void {
    this.saving = true;

    const payload: any = {
      code: this.currentSupplier.code?.trim().toUpperCase(),
      reference: this.currentSupplier.code?.trim().toUpperCase(),
      name: this.currentSupplier.name?.trim(),
      designation: this.currentSupplier.name?.trim(),
      email: this.currentSupplier.email?.trim(),
      phone: this.currentSupplier.phone?.trim(),
      phone1: this.currentSupplier.phone?.trim(),
      mobile: this.currentSupplier.mobile?.trim(),
      phone2: this.currentSupplier.mobile?.trim(),
      description: this.currentSupplier.description?.trim(),
      notes: this.currentSupplier.description?.trim()
    };

    if (this.isEdit) {
      this.supplierService.updateSupplier(this.currentSupplier._id || '', payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Fournisseur modifié.');
            this.closeModal();
            this.loadSuppliers();
          } else {
            this.toastService.error(res.message || 'Erreur lors de la modification.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Erreur lors de la modification.');
        }
      });
    } else {
      const { _id, ...createPayload } = payload;

      this.supplierService.createSupplier(createPayload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Fournisseur créé.');
            this.closeModal();
            this.loadSuppliers();
          } else {
            this.toastService.error(res.message || 'Code ou nom déjà existant.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Code ou nom déjà existant.');
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      this.supplierService.deleteSupplier(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Fournisseur supprimé.');
            this.loadSuppliers();
          }
        },
        error: (err) => {
          this.toastService.error('Erreur de suppression.');
        }
      });
    }
  }
}
