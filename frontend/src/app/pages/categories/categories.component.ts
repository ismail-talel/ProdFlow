import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

type CategoryForm = {
  _id?: string;
  name: string;
  description: string;
};

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  categories: any[] = [];
  loading = false;
  saving = false;

  modalOpen = false;
  isEdit = false;
  currentCategory: CategoryForm = this.getEmptyCategory();

  ngOnInit(): void {
    this.loadCategories();
  }

  getEmptyCategory(): CategoryForm {
    return {
      name: '',
      description: ''
    };
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.data)) {
          this.categories = res.data.filter((c: any) => c.isActive !== false);
        } else {
          this.categories = [];
          this.toastService.error(res.message || 'Erreur de chargement des catégories.');
        }
      },
      error: () => {
        this.loading = false;
        this.categories = [];
        this.toastService.error('Erreur de chargement des catégories.');
      }
    });
  }

  openModal(category?: any): void {
    if (category) {
      this.isEdit = true;
      this.currentCategory = {
        _id: category._id,
        name: category.name,
        description: category.description || ''
      };
    } else {
      this.isEdit = false;
      this.currentCategory = this.getEmptyCategory();
    }
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.isEdit = false;
    this.currentCategory = this.getEmptyCategory();
  }

  onSubmit(): void {
    this.saving = true;

    const payload: CategoryForm = {
      ...this.currentCategory,
      name: this.currentCategory.name?.trim(),
      description: this.currentCategory.description?.trim()
    };

    if (this.isEdit) {
      this.categoryService.updateCategory(this.currentCategory._id || '', payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Catégorie mise à jour.');
            this.closeModal();
            this.loadCategories();
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

      this.categoryService.createCategory(createPayload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Catégorie créée.');
            this.closeModal();
            this.loadCategories();
          } else {
            this.toastService.error(res.message || 'Nom de catégorie déjà existant.');
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Nom de catégorie déjà existant.');
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Catégorie supprimée.');
            this.loadCategories();
          }
        },
        error: (err) => {
          this.toastService.error('Erreur lors de la suppression.');
        }
      });
    }
  }
}
