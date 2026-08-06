import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { UsersComponent } from './pages/users/users.component';
import { CompaniesComponent } from './pages/companies/companies.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    component: CategoriesComponent,
    canActivate: [authGuard],
    data: { roles: ['admin_magasin', 'super_admin'] }
  },
  {
    path: 'suppliers',
    component: SuppliersComponent,
    canActivate: [authGuard],
    data: { roles: ['admin_magasin', 'super_admin'] }
  },
  {
    path: 'companies',
    component: CompaniesComponent,
    canActivate: [authGuard],
    data: { roles: ['super_admin'] }
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard],
    data: { roles: ['super_admin'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
