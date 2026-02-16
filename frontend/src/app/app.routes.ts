import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { HistoryComponent } from './pages/User/history/history.component';
import { InventoryComponent } from './pages/User/inventory/inventory.component';
import { ModelComponent } from './pages/model/model.component';
import { ProductComponent } from './pages/Admin/product/product.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UsermanagementComponent } from './pages/Admin/usermanagement/usermanagement.component';

import { AuthGuard } from './core/Auth/auth.guard'; 
import { RoleGuard } from './core/Auth/auth.role'; 

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ===== AUTH =====
  { path: 'login', component: LoginComponent, data: { hideSidebar: true } },
  { path: 'register', component: RegisterComponent, data: { hideSidebar: true } },

  // ===== USER =====
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'user' } },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'user' } },
  { path: 'inventory', component: InventoryComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'user' } },

  // ===== ADMIN =====
  { path: 'product', component: ProductComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },
  { path: 'usermanagement', component: UsermanagementComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },

  // ===== SHARED =====
  { path: 'forecast', component: ModelComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' },
];
