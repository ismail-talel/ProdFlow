import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, BACKEND_BASE_URL } from './api.config';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
}

/** Aligné sur backand/models/Company.js */
export interface Company {
  _id: string;
  name: string;
  designation?: string;
  legalForm?: string;

  matricule?: string;
  taxId?: string;
  registrationNumber?: string;
  vatNumber?: string;

  email?: string;
  phone1?: string;
  phone2?: string;
  fax?: string;
  website?: string;

  address?: string;
  addressComplement?: string;
  city?: string;
  postalCode?: string;
  country?: string;

  logo?: string;
  logoWidth?: number;
  logoHeight?: number;

  currency?: string;
  bankName?: string;
  bankIban?: string;
  bankBic?: string;
  bankAccount?: string;

  defaultPaymentTerms?: string;
  defaultDeliveryTerms?: string;
  defaultWarranty?: string;
  defaultNotes?: string;

  isActive?: boolean;
  isDefault?: boolean;
  notes?: string;

  fullAddress?: string;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CompanyPayload = Omit<Partial<Company>, '_id' | 'fullAddress' | 'displayName' | 'createdAt' | 'updatedAt'>;

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);

  static displayName(company: Partial<Company> | null | undefined): string {
    if (!company) return '';
    return (company.displayName || company.designation || company.name || '').trim();
  }

  static logoUrl(logo?: string | null): string {
    if (!logo) return '';
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    return `${BACKEND_BASE_URL}${logo.startsWith('/') ? logo : `/${logo}`}`;
  }

  /** Nettoie les champs vides qui cassent la validation Mongo (ex: email) */
  static toApiPayload(data: CompanyPayload): CompanyPayload {
    const payload: CompanyPayload = { ...data };

    const trimKeys: (keyof CompanyPayload)[] = [
      'name', 'designation', 'legalForm',
      'matricule', 'taxId', 'registrationNumber', 'vatNumber',
      'email', 'phone1', 'phone2', 'fax', 'website',
      'address', 'addressComplement', 'city', 'postalCode', 'country',
      'logo', 'currency', 'bankName', 'bankIban', 'bankBic', 'bankAccount',
      'defaultPaymentTerms', 'defaultDeliveryTerms', 'defaultWarranty', 'defaultNotes',
      'notes'
    ];

    for (const key of trimKeys) {
      const value = payload[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          delete (payload as unknown as Record<string, unknown>)[key as string];
        } else {
          (payload as unknown as Record<string, unknown>)[key as string] = trimmed;
        }
      }
    }

    return payload;
  }

  getActiveCompany(): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(`${API_URL}/company`);
  }

  getCompanies(): Observable<ApiResponse<Company[]>> {
    return this.http.get<ApiResponse<Company[]>>(`${API_URL}/companies`);
  }

  getCompanyById(id: string): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(`${API_URL}/companies/${id}`);
  }

  createCompany(data: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.post<ApiResponse<Company>>(
      `${API_URL}/companies`,
      CompanyService.toApiPayload(data)
    );
  }

  updateCompany(id: string, data: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.put<ApiResponse<Company>>(
      `${API_URL}/companies/${id}`,
      CompanyService.toApiPayload(data)
    );
  }

  updateActiveCompany(data: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.put<ApiResponse<Company>>(
      `${API_URL}/company`,
      CompanyService.toApiPayload(data)
    );
  }

  uploadCompanyLogo(
    id: string,
    file: File,
    dimensions?: { logoWidth?: number; logoHeight?: number }
  ): Observable<ApiResponse<{ logo: string; company: Company }>> {
    const formData = new FormData();
    formData.append('logo', file);
    if (dimensions?.logoWidth != null) formData.append('logoWidth', String(dimensions.logoWidth));
    if (dimensions?.logoHeight != null) formData.append('logoHeight', String(dimensions.logoHeight));
    return this.http.post<ApiResponse<{ logo: string; company: Company }>>(
      `${API_URL}/companies/${id}/logo`,
      formData
    );
  }

  uploadActiveLogo(
    file: File,
    dimensions?: { logoWidth?: number; logoHeight?: number }
  ): Observable<ApiResponse<{ logo: string; logoUrl: string; company: Company }>> {
    const formData = new FormData();
    formData.append('logo', file);
    if (dimensions?.logoWidth != null) formData.append('logoWidth', String(dimensions.logoWidth));
    if (dimensions?.logoHeight != null) formData.append('logoHeight', String(dimensions.logoHeight));
    return this.http.post<ApiResponse<{ logo: string; logoUrl: string; company: Company }>>(
      `${API_URL}/company/logo`,
      formData
    );
  }

  deleteCompany(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API_URL}/companies/${id}`);
  }
}
