import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  users: any[] = [];
  loading = false;
  saving = false;

  modalOpen = false;
  isEdit = false;
  currentUser: any = this.getEmptyUser();

  ngOnInit(): void {
    this.loadUsers();
  }

  getEmptyUser() {
    return {
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'expedition_magasin',
      password: '',
      isActive: true
    };
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.users = res.data;
        }
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des collaborateurs.');
      }
    });
  }

  openModal(user?: any): void {
    if (user) {
      this.isEdit = true;
      this.currentUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      };
    } else {
      this.isEdit = false;
      this.currentUser = this.getEmptyUser();
    }
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  onSubmit(): void {
    this.saving = true;
    if (this.isEdit) {
      this.userService.updateUser(this.currentUser._id, this.currentUser).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Collaborateur mis à jour.');
            this.closeModal();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Erreur lors de la modification.');
        }
      });
    } else {
      this.userService.createUser(this.currentUser).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.toastService.success('Collaborateur créé avec succès.');
            this.closeModal();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.saving = false;
          this.toastService.error(err.error?.message || 'Adresse email déjà utilisée.');
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      this.userService.deleteUser(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Collaborateur supprimé.');
            this.loadUsers();
          }
        },
        error: (err) => {
          this.toastService.error('Erreur lors de la suppression.');
        }
      });
    }
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

  getRoleClass(role: string): string {
    const classes: { [key: string]: string } = {
      super_admin: 'badge-danger',
      admin_magasin: 'badge-success',
      responsable_reception: 'badge-warning',
      expedition_magasin: 'badge-info'
    };
    return classes[role] || 'badge-secondary';
  }
}
