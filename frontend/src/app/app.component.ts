import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarUserComponent } from './component/sidebar-user/sidebar-user.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarUserComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';
}
