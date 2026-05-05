import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarAdminComponent } from './component/sidebar-user/sidebar-admin.component';
import { SidebarUserComponent } from './component/sidebar-user/sidebar-user.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarUserComponent,
    SidebarAdminComponent,
    NgIf, // 👈 สำคัญมาก
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // ===== เพิ่ม =====
  hideSidebar = false;
  role: string = ''; // 👈 เพิ่มตัวนี้

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // หา route ปัจจุบันลึกสุด
        let currentRoute = this.route.root;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        // ===== ซ่อน sidebar =====
        this.hideSidebar = currentRoute.snapshot.data['hideSidebar'] === true;

        // ===== อ่าน role =====
        this.role = currentRoute.snapshot.data['role'] || '';
      });
  }
}
