import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/User/home/home.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: '**', redirectTo: 'register' }

];
  // { path: 'home', component: HomeComponent },

//   { path: 'home', component: HomeComponent },
//   { path: '', redirectTo: 'home', pathMatch: 'full' },
//   { path: '**', redirectTo: 'home' }
// ];
//   { path: 'login', component: LoginComponent },
//   { path: '', redirectTo: 'login', pathMatch: 'full' },
//   { path: '**', redirectTo: 'login' }
// ];
