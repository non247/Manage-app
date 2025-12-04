import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-inventory',
  imports: [SidebarUserComponent,TableModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {

    products = [
    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
  ];
}
