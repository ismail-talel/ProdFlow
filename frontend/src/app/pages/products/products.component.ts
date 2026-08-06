import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CompositionType,
  OriginType,
  Product,
  ProductFilters,
  ProductService
} from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

/** Formulaire aligné sur backand/models/Product.js */
type ProductForm = {
  _id?: string;
  // Identification
  reference: string;
  barcode: string;
  designation: string;
  description: string;
  // Fournisseur
  supplier: string;
  supplierReference: string;
  // Prix & taxes
  unitOfMeasure: string;
  priceHT: number;
  discount: number;
  tva: number;
  priceInCurrency: number;
  margin: number;
  // Image
  image: string;
  // Dimensions
  width: number | null;
  length: number | null;
  height: number | null;
  radius: number | null;
  diameter: number | null;
  weight: number | null;
  // Caractéristiques
  color: string;
  materials: string;
  compositionType: CompositionType;
  originType: OriginType;
  // Stock & catégorie
  category: string;
  quantity: number;
  minThreshold: number;
  isActive: boolean;
};

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  products: Product[] = [];
  categories: any[] = [];
  suppliers: any[] = [];

  loading = false;
  saving = false;
  savingStock = false;
  canManageProducts = false;

  searchQuery = '';
  filterCategory = '';
  filterSupplier = '';

  modalOpen = false;
  isEdit = false;
  currentProduct: ProductForm = this.getEmptyProduct();

  stockModalOpen = false;
  selectedProduct: Product | null = null;
  stockAdjustment = {
    quantity: 0,
    operation: 'set' as 'set' | 'increment' | 'decrement',
    reason: ''
  };

  displayName = ProductService.displayName;
  unitPriceOf = ProductService.unitPriceOf;
  categoryName = ProductService.categoryName;
  supplierName = ProductService.supplierName;

  /** Aperçu TTC calculé comme le virtual backend */
  get priceTTCPreview(): number {
    const ht = Number(this.currentProduct.priceHT) || 0;
    const discount = Number(this.currentProduct.discount) || 0;
    const tva = Number(this.currentProduct.tva) || 0;
    const afterDiscount = ht * (1 - discount / 100);
    return Math.round(afterDiscount * (1 + tva / 100) * 100) / 100;
  }

  ngOnInit(): void {
    this.canManageProducts = this.authService.hasRole([
      'admin_magasin',
      'super_admin',
      'responsable_reception',
      'expedition_magasin'
    ]);
    this.loadProducts();
    this.loadDropdowns();
  }

  getEmptyProduct(): ProductForm {
    return {
      reference: '',
      barcode: '',
      designation: '',
      description: '',
      supplier: '',
      supplierReference: '',
      unitOfMeasure: 'unité',
      priceHT: 0,
      discount: 0,
      tva: 19,
      priceInCurrency: 0,
      margin: 0,
      image: '',
      width: null,
      length: null,
      height: null,
      radius: null,
      diameter: null,
      weight: null,
      color: '',
      materials: '',
      compositionType: 'non_compose',
      originType: 'local',
      category: '',
      quantity: 0,
      minThreshold: 10,
      isActive: true
    };
  }

  private refId(value: string | { _id: string } | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || '';
  }

  loadProducts(): void {
    this.loading = true;
    const filters: ProductFilters = {
      category: this.filterCategory,
      supplier: this.filterSupplier
    };

    if (this.searchQuery.trim()) {
      filters.search = this.searchQuery.trim();
    }

    this.productService.getProducts(filters).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.data)) {
          this.products = res.data;
        } else {
          this.products = [];
          this.toastService.error(res.message || 'Erreur lors du chargement des produits.');
        }
      },
      error: () => {
        this.loading = false;
        this.products = [];
        this.toastService.error('Erreur lors du chargement des produits.');
      }
    });
  }

  loadDropdowns(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) this.categories = res.data;
      }
    });

    this.supplierService.getSuppliers().subscribe({
      next: (res) => {
        if (res.success && res.data) this.suppliers = res.data;
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  openModal(product?: Product): void {
    if (product) {
      this.isEdit = true;
      this.currentProduct = {
        _id: product._id,
        reference: product.reference || '',
        barcode: product.barcode || '',
        designation: ProductService.displayName(product),
        description: product.description || '',
        supplier: this.refId(product.supplier as any),
        supplierReference: product.supplierReference || '',
        unitOfMeasure: product.unitOfMeasure || 'unité',
        priceHT: ProductService.unitPriceOf(product),
        discount: product.discount ?? 0,
        tva: product.tva ?? 19,
        priceInCurrency: product.priceInCurrency ?? 0,
        margin: product.margin ?? 0,
        image: product.image || '',
        width: product.width ?? null,
        length: product.length ?? null,
        height: product.height ?? null,
        radius: product.radius ?? null,
        diameter: product.diameter ?? null,
        weight: product.weight ?? null,
        color: product.color || '',
        materials: product.materials || '',
        compositionType: product.compositionType || 'non_compose',
        originType: product.originType || 'local',
        category: this.refId(product.category as any),
        quantity: product.quantity ?? 0,
        minThreshold: product.minThreshold ?? 10,
        isActive: product.isActive !== false
      };
    } else {
      this.isEdit = false;
      this.currentProduct = this.getEmptyProduct();
    }
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.isEdit = false;
    this.currentProduct = this.getEmptyProduct();
  }

  onSubmit(): void {
    if (!this.currentProduct.supplier) {
      this.toastService.error('Le fournisseur est obligatoire pour pouvoir créer des bons de commande.');
      return;
    }

    this.saving = true;

    const payload = ProductService.toApiPayload({
      reference: this.currentProduct.reference,
      barcode: this.currentProduct.barcode,
      designation: this.currentProduct.designation,
      name: this.currentProduct.designation,
      description: this.currentProduct.description,
      supplier: this.currentProduct.supplier,
      supplierReference: this.currentProduct.supplierReference,
      unitOfMeasure: this.currentProduct.unitOfMeasure,
      priceHT: this.currentProduct.priceHT,
      unitPrice: this.currentProduct.priceHT,
      discount: this.currentProduct.discount,
      tva: this.currentProduct.tva,
      priceInCurrency: this.currentProduct.priceInCurrency,
      margin: this.currentProduct.margin,
      image: this.currentProduct.image,
      width: this.currentProduct.width,
      length: this.currentProduct.length,
      height: this.currentProduct.height,
      radius: this.currentProduct.radius,
      diameter: this.currentProduct.diameter,
      weight: this.currentProduct.weight,
      color: this.currentProduct.color,
      materials: this.currentProduct.materials,
      compositionType: this.currentProduct.compositionType,
      originType: this.currentProduct.originType,
      category: this.currentProduct.category,
      quantity: this.currentProduct.quantity,
      minThreshold: this.currentProduct.minThreshold,
      isActive: this.currentProduct.isActive
    });

    if (this.isEdit && this.currentProduct._id) {
      this.productService.updateProduct(this.currentProduct._id, payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Produit modifié avec succès.');
            this.closeModal();
            this.loadProducts();
          } else {
            this.toastService.error(res.message || 'Erreur lors de la modification.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Erreur serveur.');
        }
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Produit créé avec succès.');
            this.closeModal();
            this.loadProducts();
          } else {
            this.toastService.error(res.message || 'Erreur lors de la création.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(
            err.error?.message || 'Erreur serveur. Référence probablement déjà existante.'
          );
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir désactiver/supprimer ce produit ?')) {
      this.productService.deleteProduct(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Produit désactivé.');
            this.loadProducts();
          } else {
            this.toastService.error(res.message || 'Erreur de suppression.');
          }
        },
        error: () => {
          this.toastService.error('Erreur lors de la suppression.');
        }
      });
    }
  }

  openStockModal(product: Product): void {
    this.selectedProduct = product;
    this.stockAdjustment = {
      quantity: product.quantity,
      operation: 'set',
      reason: ''
    };
    this.stockModalOpen = true;
  }

  closeStockModal(): void {
    this.stockModalOpen = false;
    this.selectedProduct = null;
  }

  onAdjustStock(): void {
    if (!this.selectedProduct) return;

    this.savingStock = true;
    this.productService
      .updateStock(this.selectedProduct._id, {
        quantity: Number(this.stockAdjustment.quantity),
        operation: this.stockAdjustment.operation,
        reason: this.stockAdjustment.reason
      })
      .subscribe({
        next: (res) => {
          this.savingStock = false;
          if (res.success) {
            this.toastService.success('Ajustement de stock enregistré.');
            this.closeStockModal();
            this.loadProducts();
          } else {
            this.toastService.error(res.message || 'Erreur de mise à jour.');
          }
        },
        error: (err) => {
          this.savingStock = false;
          this.toastService.error(err.error?.message || 'Erreur serveur.');
        }
      });
  }
}
