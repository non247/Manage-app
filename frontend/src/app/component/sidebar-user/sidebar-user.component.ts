import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar-user',
  imports: [RouterModule],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss',
})
export class SidebarUserComponent {
  isCollapsed = true;
  hasInteracted = false;
  disableAnimation = true;
  isMobile = false;

  // ✅ เพิ่ม
  openedByHamburger = false;
  showSidebar = true; // ⭐ ใช้ซ่อน sidebar

  constructor(private readonly router: Router) {
    // ✅ เช็ค route
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.showSidebar = !event.url.includes('/login');

        // กัน edge case
        if (!this.showSidebar) {
          this.isCollapsed = true;
          this.openedByHamburger = false;
        }
      }
    });
  }

  // ✅ Hamburger toggle
  toggleSidebar() {
    this.hasInteracted = true;
    this.disableAnimation = false;

    this.isCollapsed = !this.isCollapsed;
    this.openedByHamburger = !this.isCollapsed;

    if (this.isCollapsed) {
      this.openedByHamburger = false;
    }
  }

  // ✅ คลิกเมนู
  navigateTo(path: string) {
    this.disableAnimation = false;

    if (!this.openedByHamburger) {
      this.isCollapsed = true;
    }

    setTimeout(() => {
      this.router.navigate([path]);
    }, 300);
  }

  // ✅ Logout
  logout() {
    Swal.fire({
      title: 'ยืนยันที่จะออกจากระบบ?',
      // text: 'You will be logged out.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#8F8F8F',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');

        if (this.isMobile) {
          this.isCollapsed = true;
          this.openedByHamburger = false;
        }

        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { logoutSuccess: 'true' },
          });
        }, 1200);
      }
    });
  }
}
