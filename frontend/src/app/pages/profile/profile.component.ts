import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  profile: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loadingProfile = false;
  loadingPassword = false;

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      // Charger les infos actuelles locales
      this.profile = { ...user };
    }

    // Charger les infos fraîches depuis le serveur
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile = { ...res.data };
        }
      },
      error: () => {
        this.toastService.error('Impossible de charger les données du profil depuis le serveur.');
      }
    });
  }

  onUpdateProfile(): void {
    this.loadingProfile = true;
    const updatePayload = {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      phone: this.profile.phone
    };

    this.authService.updateProfile(updatePayload).subscribe({
      next: (res) => {
        this.loadingProfile = false;
        if (res.success) {
          this.toastService.success('Profil mis à jour avec succès !');
        } else {
          this.toastService.error(res.message || 'Erreur lors de la mise à jour.');
        }
      },
      error: (err) => {
        this.loadingProfile = false;
        this.toastService.error(err.error?.message || 'Erreur de connexion.');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.error('Le nouveau mot de passe et sa confirmation diffèrent.');
      return;
    }

    this.loadingPassword = true;
    this.authService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: (res) => {
        this.loadingPassword = false;
        if (res.success) {
          this.toastService.success('Mot de passe changé avec succès !');
          this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        } else {
          this.toastService.error(res.message || 'Erreur lors du changement de mot de passe.');
        }
      },
      error: (err) => {
        this.loadingPassword = false;
        this.toastService.error(err.error?.message || 'Mot de passe actuel incorrect ou erreur serveur.');
      }
    });
  }

  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      super_admin: 'Super Administrateur',
      admin_magasin: 'Administrateur Magasin',
      responsable_reception: 'Responsable Réception',
      expedition_magasin: 'Expédition Magasin'
    };
    return roles[role] || role;
  }
}
