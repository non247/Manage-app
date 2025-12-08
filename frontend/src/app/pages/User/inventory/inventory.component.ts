import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory',
  imports: [SidebarUserComponent,TableModule, MultiSelectModule,FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {

    products = [
    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50, price: 10},
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120, price: 30 },
    { code: 'P003', name: 'Book', category: 'Box', quantity: 5 ,price: 20}

  ];

    categoryOptions = [
    { label: 'Stationery', value: 'Stationery' },
    { label: 'Box', value: 'Box' }
  ];

  selectedCategories: string[] = [];

  filteredProducts = [...this.products];

  filterProducts() {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      this.selectedCategories.includes(p.category)
    );
  }
}