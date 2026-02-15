// import { Component } from '@angular/core';
// import { Router, RouterModule } from '@angular/router';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-sidebar-user',
//   imports: [RouterModule],
//   templateUrl: './sidebar-user.component.html',
//   styleUrl: './sidebar-user.component.scss',
// })
// export class SidebarUserComponent {
//   isCollapsed = true;
//   hasInteracted = false;
//   disableAnimation = true;
//   isMobile = false;

//   // ✅ เพิ่ม state เช็คว่าเปิดด้วย hamburger หรือไม่
//   openedByHamburger = false;

//   constructor(private readonly router: Router) {}

//   // ✅ Hamburger toggle
//   toggleSidebar() {
//     this.hasInteracted = true;
//     this.disableAnimation = false;

//     this.isCollapsed = !this.isCollapsed;

//     // ถ้า sidebar เปิด = เปิดโดย hamburger
//     this.openedByHamburger = !this.isCollapsed;

//     // ถ้าปิดเอง → reset
//     if (this.isCollapsed) {
//       this.openedByHamburger = false;
//     }
//   }

//   // ✅ คลิกเมนู
//   navigateTo(path: string) {
//     this.disableAnimation = false;

//     // ❗ ถ้าไม่ได้เปิดด้วย hamburger → ปิด sidebar
//     if (!this.openedByHamburger) {
//       this.isCollapsed = true;
//     }

//     setTimeout(() => {
//       this.router.navigate([path]);
//     }, 300); // ต้องตรงกับ transition CSS
//   }

//   // ✅ Logout
//   logout() {
//     Swal.fire({
//       title: 'Are you sure?',
//       text: 'You will be logged out.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#3085d6',
//       cancelButtonColor: '#d33',
//       confirmButtonText: 'Yes, logout',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         localStorage.removeItem('token');

//         // ถ้า mobile ให้ปิด sidebar
//         if (this.isMobile) {
//           this.isCollapsed = true;
//           this.openedByHamburger = false;
//         }

//         setTimeout(() => {
//           this.router.navigate(['/login'], {
//             queryParams: { logoutSuccess: 'true' },
//           });
//         }, 1200);
//       }
//     });
//   }
// }

import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar-admin',
  imports: [RouterModule],
  templateUrl: './sidebar-admin.component.html',
  styleUrl: './sidebar-user.component.scss',
})
export class SidebarAdminComponent {
  isCollapsed = true;
  hasInteracted = false;
  disableAnimation = true;
  isMobile = false;

  // ✅ เพิ่ม
  openedByHamburger = false;
  showSidebar = true; // ⭐ ใช้ซ่อน sidebar

  constructor(private readonly router: Router) {
    // ✅ เช็ค route
    this.router.events.subscribe(event => {
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
