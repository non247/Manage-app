import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar-user',
  imports: [RouterModule],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss',
})
export class SidebarUserComponent {
  isCollapsed = true;
  hasInteracted = false; // เคย hover หรือคลิกหรือยัง
  disableAnimation = true; // เริ่มต้น → ปิด animation
  isMobile = false;

  constructor(private readonly router: Router) {}

  // onMouseEnter() {
  //   if (!this.isMobile && !this.hasInteracted) {
  //     this.disableAnimation = false;
  //     this.hasInteracted = true;
  //   }
  // }

  // Hamburger toggle
  toggleSidebar() {
    this.hasInteracted = true;
    this.disableAnimation = false;
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(path: string) {
    this.disableAnimation = false; // เปิด animation
    this.isCollapsed = true; // ปิด sidebar พร้อม animate

    // รอให้ animation จบก่อน navigate
    setTimeout(() => {
      this.router.navigate([path]);
    }, 300); // ต้องตรงกับ transition 0.3s ใน CSS
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
    }).then((result) => {
      if (result.isConfirmed) {
        // ลบ token
        localStorage.removeItem('token');

        // ปิด sidebar ถ้าเป็น mobile
        if (this.isMobile) {
          this.isCollapsed = true;
        }

        // แจ้งว่า logout สำเร็จ
        // Swal.fire({
        //   title: "Logged out!",
        //   text: "You have been logged out successfully.",
        //   icon: "success",
        //   timer: 1500,
        //   showConfirmButton: false
        // });

        // redirect ไปหน้า login หลังจากแสดง alert แป๊บหนึ่ง
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { logoutSuccess: 'true' },
          });
        }, 1200);
      }
    });
  }
}
