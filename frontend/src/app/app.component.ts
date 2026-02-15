import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SidebarUserComponent } from './component/sidebar-user/sidebar-user.component';
import { SidebarAdminComponent } from './component/sidebar-user/sidebar-admin.component'; 
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';

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
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {

        // หา route ปัจจุบันลึกสุด
        let currentRoute = this.route.root;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        // ===== ซ่อน sidebar =====
        this.hideSidebar =
          currentRoute.snapshot.data['hideSidebar'] === true;

        // ===== อ่าน role =====
        this.role =
          currentRoute.snapshot.data['role'] || '';

        // debug (ลบออกทีหลังได้)
        console.log('role:', this.role);
        console.log('hideSidebar:', this.hideSidebar);
      });
  }
}