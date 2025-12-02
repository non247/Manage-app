import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar-user',
  imports: [RouterModule],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss',
})
// export class SidebarUserComponent {

// isCollapsed = true;
// hasInteracted = false;
// disableAnimation = true; // ปิด animation ชั่วคราว

// constructor(private router: Router) {}


// toggleSidebar() {
//   this.isCollapsed = !this.isCollapsed;
//   this.hasInteracted = true;   // <-- user กดแล้ว เริ่มเปิด animation ได้
//   this.disableAnimation = false; // เปิด animation
// }

//   navigateTo(path: string) {
//     this.disableAnimation = true; // ปิด animation ชั่วคราว
//     this.router.navigate([path]).then(() => {
//       // หลัง navigate สามารถเปิด animation ได้ถ้าต้องการ
//       if (this.hasInteracted) {
//         this.disableAnimation = false;
//       }
//     });
//   }

// logout() {
//   // ตัวอย่าง: ลบ token หรือ session
//   localStorage.removeItem('token');
//   // เปลี่ยนเส้นทางไปหน้า login
//   this.router.navigate(['/login']);
// }
// }
export class SidebarUserComponent {
  isCollapsed = true;
  hasInteracted = false;    // เคยกด hamburger หรือยัง
  disableAnimation = true;  // ปิด animation ชั่วคราว

  constructor(private router: Router) {}

  // เปิด/ปิด sidebar ด้วย hamburger
  toggleSidebar() {
    this.hasInteracted = true;    // เริ่มเปิด animation หลังจากกด hamburger
    this.disableAnimation = false; // เปิด animation
    this.isCollapsed = !this.isCollapsed;
  }

  // เปลี่ยนหน้าเมื่อคลิก icon
  navigateTo(path: string) {
    if (!this.hasInteracted) {
      // ถ้ายังไม่เคยกด hamburger → ปิด animation
      this.disableAnimation = true;
    } else {
      // เคยกด hamburgerแล้ว → เปิด animation
      this.disableAnimation = false;
    }
    this.router.navigate([path]);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
