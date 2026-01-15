import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { HistoryComponent } from './pages/User/history/history.component';
import { InventoryComponent } from './pages/User/inventory/inventory.component';
import { ModelComponent } from './pages/model/model.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
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
    path: 'predict',
    component: ModelComponent,
  },

  // ถ้าพิมพ์ path ที่ไม่มีจริง ให้กลับไปหน้า dashboard
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
