import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-history',
  imports: [SidebarUserComponent,TableModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
      products = [
    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
    { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
   { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
    { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
    { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
     { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
      { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
    { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
     { code: 'P003', name: 'Book', category: 'box', quantity: 5 }
  ];
}
