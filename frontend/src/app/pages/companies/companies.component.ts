import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Company, CompanyPayload, CompanyService } from '../../services/company.service';
import { ToastService } from '../../services/toast.service';

type CompanyForm = {
  _id?: string;
  name: string;
  designation: string;
  legalForm: string;
  matricule: string;
  taxId: string;
  registrationNumber: string;
  vatNumber: string;
  email: string;
  phone1: string;
  phone2: string;
  fax: string;
  website: string;
  address: string;
  addressComplement: string;
  city: string;
  postalCode: string;
  country: string;
  logoWidth: number;
  logoHeight: number;
  currency: string;
  bankName: string;
  bankIban: string;
  bankBic: string;
  bankAccount: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultWarranty: string;
  defaultNotes: string;
  notes: string;
};

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.css'
})
export class CompaniesComponent implements OnInit {
  private companyService = inject(CompanyService);
  private toastService = inject(ToastService);

  company: Company | null = null;
  loading = false;
  saving = false;
  uploadingLogo = false;

  form: CompanyForm = this.getEmptyForm();
  currentLogoUrl = '';
  selectedLogoFile: File | null = null;
  logoPreviewUrl = '';

  displayName = CompanyService.displayName;
  logoUrl = CompanyService.logoUrl;

  ngOnInit(): void {
    this.loadCompany();
  }

  getEmptyForm(): CompanyForm {
    return {
      name: '',
      designation: '',
      legalForm: 'SARL',
      matricule: '',
      taxId: '',
      registrationNumber: '',
      vatNumber: '',
      email: '',
      phone1: '',
      phone2: '',
      fax: '',
      website: '',
      address: '',
      addressComplement: '',
      city: 'Sousse',
      postalCode: '',
      country: 'Tunisie',
      logoWidth: 110,
      logoHeight: 60,
      currency: 'DT',
      bankName: '',
      bankIban: '',
      bankBic: '',
      bankAccount: '',
      defaultPaymentTerms: '30 jours net',
      defaultDeliveryTerms: 'Selon disponibilité',
      defaultWarranty: 'Garantie fabricant',
      defaultNotes: 'Merci de confirmer la réception de ce bon de commande.',
      notes: ''
    };
  }

  private fillForm(company: Company): void {
    this.company = company;
    this.form = {
      _id: company._id,
      name: company.name || '',
      designation: company.designation || '',
      legalForm: company.legalForm || 'SARL',
      matricule: company.matricule || '',
      taxId: company.taxId || '',
      registrationNumber: company.registrationNumber || '',
      vatNumber: company.vatNumber || '',
      email: company.email || '',
      phone1: company.phone1 || '',
      phone2: company.phone2 || '',
      fax: company.fax || '',
      website: company.website || '',
      address: company.address || '',
      addressComplement: company.addressComplement || '',
      city: company.city || '',
      postalCode: company.postalCode || '',
      country: company.country || '',
      logoWidth: company.logoWidth ?? 110,
      logoHeight: company.logoHeight ?? 60,
      currency: company.currency || 'DT',
      bankName: company.bankName || '',
      bankIban: company.bankIban || '',
      bankBic: company.bankBic || '',
      bankAccount: company.bankAccount || '',
      defaultPaymentTerms: company.defaultPaymentTerms || '',
      defaultDeliveryTerms: company.defaultDeliveryTerms || '',
      defaultWarranty: company.defaultWarranty || '',
      defaultNotes: company.defaultNotes || '',
      notes: company.notes || ''
    };
    this.currentLogoUrl = CompanyService.logoUrl(company.logo);
  }

  loadCompany(): void {
    this.loading = true;
    this.companyService.getActiveCompany().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.fillForm(res.data);
        } else {
          this.toastService.error(res.message || 'Impossible de charger la société.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Erreur lors du chargement de la société.');
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
      this.toastService.error('Format logo invalide (PNG, JPG, GIF, WEBP).');
      input.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.toastService.error('Le logo ne doit pas dépasser 3 Mo.');
      input.value = '';
      return;
    }

    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }

    this.selectedLogoFile = file;
    this.logoPreviewUrl = URL.createObjectURL(file);
  }

  private buildPayload(): CompanyPayload {
    return {
      name: this.form.name,
      designation: this.form.designation,
      legalForm: this.form.legalForm,
      matricule: this.form.matricule,
      taxId: this.form.taxId,
      registrationNumber: this.form.registrationNumber,
      vatNumber: this.form.vatNumber,
      email: this.form.email,
      phone1: this.form.phone1,
      phone2: this.form.phone2,
      fax: this.form.fax,
      website: this.form.website,
      address: this.form.address,
      addressComplement: this.form.addressComplement,
      city: this.form.city,
      postalCode: this.form.postalCode,
      country: this.form.country,
      logoWidth: this.form.logoWidth,
      logoHeight: this.form.logoHeight,
      currency: this.form.currency,
      bankName: this.form.bankName,
      bankIban: this.form.bankIban,
      bankBic: this.form.bankBic,
      bankAccount: this.form.bankAccount,
      defaultPaymentTerms: this.form.defaultPaymentTerms,
      defaultDeliveryTerms: this.form.defaultDeliveryTerms,
      defaultWarranty: this.form.defaultWarranty,
      defaultNotes: this.form.defaultNotes,
      notes: this.form.notes,
      isDefault: true,
      isActive: true
    };
  }

  onSubmit(): void {
    if (!this.form.name?.trim()) {
      this.toastService.error('Le nom de la société est obligatoire.');
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();

    this.companyService.updateActiveCompany(payload).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.saving = false;
          this.toastService.error(res.message || 'Erreur lors de l’enregistrement.');
          return;
        }

        if (!this.selectedLogoFile) {
          this.saving = false;
          this.fillForm(res.data);
          this.toastService.success('Société mise à jour.');
          return;
        }

        this.uploadingLogo = true;
        this.companyService
          .uploadActiveLogo(this.selectedLogoFile, {
            logoWidth: this.form.logoWidth,
            logoHeight: this.form.logoHeight
          })
          .subscribe({
            next: (logoRes) => {
              this.uploadingLogo = false;
              this.saving = false;
              this.selectedLogoFile = null;
              if (this.logoPreviewUrl) {
                URL.revokeObjectURL(this.logoPreviewUrl);
                this.logoPreviewUrl = '';
              }
              if (logoRes.success && logoRes.data?.company) {
                this.fillForm(logoRes.data.company);
              } else {
                this.loadCompany();
              }
              this.toastService.success('Société et logo mis à jour.');
            },
            error: (err) => {
              this.uploadingLogo = false;
              this.saving = false;
              this.fillForm(res.data!);
              this.toastService.warning(
                err.error?.message || 'Société enregistrée, mais le logo n’a pas pu être mis à jour.'
              );
            }
          });
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Erreur serveur.');
      }
    });
  }

  resetForm(): void {
    if (this.company) {
      this.fillForm(this.company);
    }
    this.selectedLogoFile = null;
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.logoPreviewUrl = '';
    }
  }
}
