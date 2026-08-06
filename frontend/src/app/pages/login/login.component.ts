import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  onSubmit(): void {
    if (this.email && this.password) {
      this.loading = true;
      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toastService.success('Connexion réussie !');
            this.router.navigate(['/dashboard']);
          } else {
            this.toastService.error(res.message || 'Erreur de connexion');
          }
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.message || err.message || 'Identifiants invalides ou serveur hors ligne.';
          this.toastService.error(msg);
        }
      });
    }
  }
}
