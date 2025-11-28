import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-user',
  imports: [],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss',
})
export class SidebarUserComponent {

//   isSidebarOpen = false;

// toggleSidebar() {
//   this.isSidebarOpen = !this.isSidebarOpen;
// }

isCollapsed = true;

toggleSidebar() {
  this.isCollapsed = !this.isCollapsed;
}

}
