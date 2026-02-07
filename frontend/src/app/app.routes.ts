// import { Routes } from '@angular/router';
// import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
// import { HistoryComponent } from './pages/User/history/history.component';
// import { InventoryComponent } from './pages/User/inventory/inventory.component';
// import { ModelComponent } from './pages/model/model.component';
// import { ProductComponent } from './pages/Admin/product/product.component';
// import { LoginComponent } from './pages/login/login.component';

// export const routes: Routes = [
//   {
//     path: '',
//     redirectTo: 'login',
//     pathMatch: 'full',
//   },
//   {
//     path: 'login',
//     component: LoginComponent,
//   },
//   {
//     path: 'dashboard',
//     component: DashboardComponent,
//   },
//   {
//     path: 'inventory',
//     component: InventoryComponent,
//   },
//   {
//     path: 'history',
//     component: HistoryComponent,
//   },
//   {
//     path: 'predict',
//     component: ModelComponent,
//   },

//   {
//     path: 'product',
//     component: ProductComponent,
//   },

//   // ถ้าพิมพ์ path ที่ไม่มีจริง ให้กลับไปหน้า dashboard
//   {
//     path: '**',
//     redirectTo: 'login',
//   },
// ];
import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { HistoryComponent } from './pages/User/history/history.component';
import { InventoryComponent } from './pages/User/inventory/inventory.component';
import { ModelComponent } from './pages/model/model.component';
import { ProductComponent } from './pages/Admin/product/product.component';
import { LoginComponent } from './pages/login/login.component';

import { AuthGuard } from './core/Auth/auth.guard'; 
import { RoleGuard } from './core/Auth/auth.role'; 

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    component: LoginComponent,
    data: { hideSidebar: true }
  },

  // ===== USER =====
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' },
  },
  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' },
  },

  // ===== ADMIN =====
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
  },

  // ===== AI / Predict (ให้ทั้งคู่เข้าได้) =====
  {
    path: 'predict',
    component: ModelComponent,
    canActivate: [AuthGuard],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];
