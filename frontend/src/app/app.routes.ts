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

  // ===== DEFAULT =====
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ===== LOGIN =====
  {
    path: 'login',
    component: LoginComponent,
    data: { hideSidebar: true }
  },

  // ================= USER =================
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' } // 👈 เพิ่ม
  },

  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' },
  },

  // ================= ADMIN =================
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
  },

    {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [AuthGuard,RoleGuard],
    data: { role: 'admin' },
    
    // หรือ 'admin' หรือทำ dynamic จาก token ก็ได้
  },
  // ============== BOTH (ใช้ร่วม) ==============


  {
    path: 'forecast ',
    component: ModelComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' } 
  },

  // ===== NOT FOUND =====
  {
    path: '**',
    redirectTo: 'login',
  },
];