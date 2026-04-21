import { Routes } from '@angular/router';
import { AuthGuard } from './core/Auth/auth.guard';
import { RoleGuard } from './core/Auth/auth.role';
import { AdminhistoryComponent } from './pages/Admin/adminhistory/adminhistory.component';
import { AdminInventoryComponent } from './pages/Admin/admininventory/admininventory.component';
import { ProductComponent } from './pages/Admin/product/product.component';
import { UsermanagementComponent } from './pages/Admin/usermanagement/usermanagement.component';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { HistoryComponent } from './pages/User/history/history.component';
import { InventoryComponent } from './pages/User/inventory/inventory.component';
import { LoginComponent } from './pages/login/login.component';
import { ModelComponent } from './pages/model/model.component';
import { PurchaseComponent } from './pages/User/purchase/purchase.component';
import { AdminpurchaseComponent } from './pages/Admin/adminpurchase/adminpurchase.component';
import { AdminhistorypurchaseComponent } from './pages/Admin/adminhistorypurchase/adminhistorypurchase.component';
import { HistorypurchaseComponent } from './pages/User/historypurchase/historypurchase.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgetComponent } from './pages/forget/forget.component';
import { ResetpasswordComponent } from './pages/resetpassword/resetpassword.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ===== AUTH =====
  {
    path: 'login',
    component: LoginComponent,
    data: {
      hideSidebar: true,
    },
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: {
      hideSidebar: true,
    },
  },
  {
    path: 'forgot-password',
    component: ForgetComponent,
    data: {
      hideSidebar: true,
    },
  },

{
  path: 'reset-password',
  component: ResetpasswordComponent,
  data: {
    hideSidebar: true,
  },
},

  // ===== USER =====
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'user',
    },
  },
  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'user',
    },
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'user',
    },
  },
  {
    path: 'purchase',
    component: PurchaseComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'user',
    },
  },
  {
    path: 'historypurchase',
    component: HistorypurchaseComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'user',
    },
  },

  // ===== ADMIN =====
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },
  {
    path: 'admininventory',
    component: AdminInventoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },
  {
    path: 'adminhistory',
    component: AdminhistoryComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },
  {
    path: 'usermanagement',
    component: UsermanagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },
  {
    path: 'adminpurchase',
    component: AdminpurchaseComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },
  {
    path: 'adminhistorypurchase',
    component: AdminhistorypurchaseComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },

  // ===== SHARED =====
  {
    path: 'forecast',
    component: ModelComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      role: 'admin',
    },
  },

  { path: '**', redirectTo: 'login' },
];