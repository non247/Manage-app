import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { HistoryComponent } from './pages/User/history/history.component';
import { InventoryComponent } from './pages/User/inventory/inventory.component';
import { SettingComponent } from './pages/User/setting/setting.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'inventory',
    component: InventoryComponent,
  },
  {
    path: 'history',
    component: HistoryComponent,
  },
  {
    path: 'setting',
    component: SettingComponent,
  },

  // หน้าเริ่มต้น
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ถ้าพิมพ์ path ที่ไม่มีจริง ให้กลับไปหน้า login
  {
    path: '**',
    redirectTo: 'login',
  },
];
