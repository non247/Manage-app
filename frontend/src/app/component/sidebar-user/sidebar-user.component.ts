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
  hasInteracted = false;       // เคย hover หรือคลิกหรือยัง
  disableAnimation = true;     // เริ่มต้น → ปิด animation
  isMobile = false;

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  onMouseEnter() {
    if (!this.isMobile && !this.hasInteracted) {
      this.disableAnimation = false;
      this.hasInteracted = true;
    }
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;

    if (this.isMobile) {
      this.isCollapsed = true;
      this.disableAnimation = true;
    } else {
      this.disableAnimation = true; // เริ่มแบบไม่ animate
    }
  }

  // Hamburger toggle
  toggleSidebar() {
    this.hasInteracted = true;
    this.disableAnimation = false;
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(path: string) {
    if (!this.hasInteracted) {
      this.disableAnimation = true;
    } else {
      this.disableAnimation = false;
    }

    if (this.isMobile) {
      this.isCollapsed = true;
    }

    this.router.navigate([path]);
  }

  logout() {
    localStorage.removeItem('token');

    if (this.isMobile) {
      this.isCollapsed = true;
    }

    this.router.navigate(['/login']);
  }
}
