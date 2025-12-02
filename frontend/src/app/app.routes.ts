import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/User/Dashboard/Dashboard.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },

  // หน้าเริ่มต้น
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ถ้าพิมพ์ path ที่ไม่มีจริง ให้กลับไปหน้า login
  { path: '**', redirectTo: 'login' }
];
// export const routes: Routes = [
//   { path: 'register', component: RegisterComponent },
//   { path: '', redirectTo: 'register', pathMatch: 'full' },
//   { path: '**', redirectTo: 'register' }

// ];
// //   { path: 'home', component: HomeComponent },

// //   { path: 'home', component: HomeComponent },
// //   { path: '', redirectTo: 'home', pathMatch: 'full' },
// //   { path: '**', redirectTo: 'home' }
// // ];
// //   { path: 'login', component: LoginComponent },
// //   { path: '', redirectTo: 'login', pathMatch: 'full' },
// //   { path: '**', redirectTo: 'login' }
// // ];
