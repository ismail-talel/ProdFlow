import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { ToastService, Toast } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  public authService = inject(AuthService);
  public toastService = inject(ToastService);
  private router = inject(Router);

  currentUser: User | null = null;
  toasts: Toast[] = [];
  menuOpen = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });

    document.body.classList.remove('theme-night', 'dark-theme', 'light-theme');
    localStorage.removeItem('sm_ui_theme');
    localStorage.removeItem('theme');
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.toastService.success('Vous avez été déconnecté.');
    this.router.navigate(['/login']);
    this.closeMenu();
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
}
