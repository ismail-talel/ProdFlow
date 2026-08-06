import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  role = 'expedition_magasin';
  password = '';
  loading = false;

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  onSubmit(): void {
    const userData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      role: this.role,
      password: this.password
    };

    this.loading = true;
    this.authService.register(userData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Compte créé avec succès ! Connectez-vous.');
          this.router.navigate(['/login']);
        } else {
          this.toastService.error(res.message || 'Erreur lors de la création du compte');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    });
  }
}
