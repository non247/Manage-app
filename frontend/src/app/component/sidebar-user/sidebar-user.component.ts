import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar-user',
  imports: [RouterModule],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss',
})
export class SidebarUserComponent {

isCollapsed = true;

constructor(private router: Router) {}

toggleSidebar() {
  this.isCollapsed = !this.isCollapsed;
}

logout() {
  // ตัวอย่าง: ลบ token หรือ session
  localStorage.removeItem('token');
  // เปลี่ยนเส้นทางไปหน้า login
  this.router.navigate(['/login']);
}
}
