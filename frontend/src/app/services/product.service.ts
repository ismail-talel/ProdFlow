import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

/** Réponse API standard du backend */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
}

export type CompositionType = 'compose' | 'non_compose';
export type OriginType = 'importe' | 'local';
export type StockOperation = 'set' | 'increment' | 'decrement';

export interface ProductCategoryRef {
  _id: string;
  name?: string;
}

export interface ProductSupplierRef {
  _id: string;
  name?: string;
  designation?: string;
  reference?: string;
}

/**
 * Modèle produit aligné sur backand/models/Product.js
 * (name / unitPrice conservés pour compatibilité avec les anciennes données)
 */
export interface Product {
  _id: string;
  reference: string;
  barcode?: string;
  designation: string;
  name?: string;
  description?: string;

  supplier?: string | ProductSupplierRef | null;
  supplierReference?: string;

  unitOfMeasure?: string;
  priceHT: number;
  unitPrice?: number;
  discount?: number;
  tva?: number;
  priceInCurrency?: number;
  margin?: number;
  priceTTC?: number;

  image?: string;

  width?: number;
  length?: number;
  height?: number;
  radius?: number;
  diameter?: number;
  weight?: number;

  color?: string;
  materials?: string;
  compositionType?: CompositionType;
  originType?: OriginType;

  category?: string | ProductCategoryRef | null;
  quantity: number;
  minThreshold: number;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/** Filtres acceptés par ProductService.findAll (backend) */
export interface ProductFilters {
  search?: string;
  category?: string;
  supplier?: string;
  compositionType?: CompositionType | '';
  originType?: OriginType | '';
  isActive?: boolean | string;
}

/** Payload création / mise à jour (champs envoyés au backend) */
export interface ProductPayload {
  reference: string;
  designation: string;
  name?: string;
  description?: string;
  barcode?: string;
  supplier?: string;
  supplierReference?: string;
  unitOfMeasure?: string;
  priceHT: number;
  unitPrice?: number;
  discount?: number;
  tva?: number;
  priceInCurrency?: number;
  margin?: number;
  image?: string;
  width?: number;
  length?: number;
  height?: number;
  radius?: number;
  diameter?: number;
  weight?: number;
  color?: string;
  materials?: string;
  compositionType?: CompositionType;
  originType?: OriginType;
  category?: string;
  quantity?: number;
  minThreshold?: number;
  isActive?: boolean;
}

export interface StockUpdatePayload {
  quantity: number;
  operation?: StockOperation;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);

  /** Nom affiché (designation prioritaire, fallback name) */
  static displayName(product: Partial<Product> | null | undefined): string {
    if (!product) return '';
    return (product.designation || product.name || '').trim();
  }

  /** Prix unitaire HT (priceHT prioritaire, fallback unitPrice) */
  static unitPriceOf(product: Partial<Product> | null | undefined): number {
    if (!product) return 0;
    const value = product.priceHT ?? product.unitPrice ?? 0;
    return Number(value) || 0;
  }

  static categoryName(product: Partial<Product> | null | undefined): string {
    const category = product?.category;
    if (!category) return '';
    if (typeof category === 'string') return category;
    return category.name || '';
  }

  static supplierName(product: Partial<Product> | null | undefined): string {
    const supplier = product?.supplier;
    if (!supplier) return '';
    if (typeof supplier === 'string') return supplier;
    return (supplier.name || supplier.designation || '').trim();
  }

  /**
   * Normalise un payload front → format attendu par backand/services/productService.mapProductPayload
   * - name ↔ designation
   * - unitPrice ↔ priceHT
   * - ObjectId vides retirés
   * - champs UI / Mongo purgés
   */
  static toApiPayload(data: Record<string, unknown> | Partial<ProductPayload>): ProductPayload {
    const raw = { ...(data as Record<string, unknown>) };

    const designation = String(raw['designation'] || raw['name'] || '').trim();
    const name = String(raw['name'] || raw['designation'] || designation).trim();

    const priceHT = Number(raw['priceHT'] ?? raw['unitPrice'] ?? 0) || 0;
    const unitPrice = Number(raw['unitPrice'] ?? raw['priceHT'] ?? priceHT) || 0;

    const payload: ProductPayload = {
      reference: String(raw['reference'] || '').trim().toUpperCase(),
      designation,
      name,
      description: String(raw['description'] ?? '').trim(),
      priceHT,
      unitPrice
    };

    const optionalString = (key: keyof ProductPayload) => {
      const value = raw[key as string];
      if (value === undefined || value === null) return;
      const text = String(value).trim();
      if (text) (payload as unknown as Record<string, unknown>)[key] = text;
    };

    const optionalNumber = (key: keyof ProductPayload) => {
      const value = raw[key as string];
      if (value === undefined || value === null || value === '') return;
      const num = Number(value);
      if (!Number.isNaN(num)) (payload as unknown as Record<string, unknown>)[key] = num;
    };

    optionalString('barcode');
    optionalString('supplierReference');
    optionalString('unitOfMeasure');
    optionalString('image');
    optionalString('color');
    optionalString('materials');

    optionalNumber('discount');
    optionalNumber('tva');
    optionalNumber('priceInCurrency');
    optionalNumber('margin');
    optionalNumber('width');
    optionalNumber('length');
    optionalNumber('height');
    optionalNumber('radius');
    optionalNumber('diameter');
    optionalNumber('weight');
    optionalNumber('quantity');
    optionalNumber('minThreshold');

    if (raw['compositionType'] === 'compose' || raw['compositionType'] === 'non_compose') {
      payload.compositionType = raw['compositionType'];
    }
    if (raw['originType'] === 'importe' || raw['originType'] === 'local') {
      payload.originType = raw['originType'];
    }
    if (typeof raw['isActive'] === 'boolean') {
      payload.isActive = raw['isActive'];
    }

    // ObjectId : ne pas envoyer de chaîne vide (évite CastError côté Mongo)
    const category = raw['category'];
    if (typeof category === 'string' && category.trim()) {
      payload.category = category.trim();
    } else if (category && typeof category === 'object' && '_id' in (category as object)) {
      const id = String((category as { _id: string })._id || '').trim();
      if (id) payload.category = id;
    }

    const supplier = raw['supplier'];
    if (typeof supplier === 'string' && supplier.trim()) {
      payload.supplier = supplier.trim();
    } else if (supplier && typeof supplier === 'object' && '_id' in (supplier as object)) {
      const id = String((supplier as { _id: string })._id || '').trim();
      if (id) payload.supplier = id;
    }

    return payload;
  }

  getProducts(filters?: ProductFilters): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (filters) {
      (Object.keys(filters) as (keyof ProductFilters)[]).forEach(key => {
        const value = filters[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<Product[]>>(`${API_URL}/products`, { params });
  }

  searchProducts(query: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API_URL}/products/search`, {
      params: new HttpParams().set('q', query.trim())
    });
  }

  getLowStockProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${API_URL}/products/low-stock`);
  }

  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${API_URL}/products/${id}`);
  }

  createProduct(productData: Partial<ProductPayload> | Record<string, unknown>): Observable<ApiResponse<Product>> {
    const payload = ProductService.toApiPayload(productData);
    return this.http.post<ApiResponse<Product>>(`${API_URL}/products`, payload);
  }

  updateProduct(id: string, productData: Partial<ProductPayload> | Record<string, unknown>): Observable<ApiResponse<Product>> {
    const payload = ProductService.toApiPayload(productData);
    return this.http.put<ApiResponse<Product>>(`${API_URL}/products/${id}`, payload);
  }

  updateStock(id: string, stockData: StockUpdatePayload): Observable<ApiResponse<Product>> {
    const operation: StockOperation = stockData.operation || 'set';
    return this.http.patch<ApiResponse<Product>>(`${API_URL}/products/${id}/stock`, {
      quantity: Number(stockData.quantity),
      operation,
      reason: stockData.reason || undefined
    });
  }

  deleteProduct(id: string): Observable<ApiResponse<Product | null>> {
    return this.http.delete<ApiResponse<Product | null>>(`${API_URL}/products/${id}`);
  }
}
