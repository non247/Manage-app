import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Product {
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date?: Date;
  isNew?: boolean;
}

@Component({
  selector: 'app-history',
  imports: [SidebarUserComponent,TableModule,FormsModule,CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  editIndex: number | null = null;
  editProduct: any = {};
  selectedCategories: string[] = [];

 products: Product[] = [
    { code: 'P001', name: 'Vanilla', category: 'Ice Cream', quantity: 50, price: 10, date: new Date('2025-12-01')},
    { code: 'P002', name: 'chocolate', category: 'Ice Cream', quantity: 120, price: 30, date: new Date('2025-12-01')},
    { code: 'P003', name: 'Box A', category: 'Box', quantity: 5, price: 20, date: new Date('2025-12-01')}
  ];

  filteredProducts = [...this.products];

  categoryOptions = [
    { label: 'Ice Cream', value: 'Ice Cream' },
    { label: 'Box', value: 'Box' }
  ];

  filterProducts() {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      this.selectedCategories.includes(p.category)
    );
  }

  onCreate() {
    if (this.editIndex !== null) return;

    const newProduct = {
      code: 'NEW-' + Date.now(),
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      date: new Date(new Date().toISOString().split('T')[0]), 
      isNew: true
    };

    this.filteredProducts.unshift(newProduct);
    this.editIndex = 0;
    this.editProduct = { ...newProduct };
  }

  onEdit(index: number) {
    this.editIndex = index;
    this.editProduct = { ...this.filteredProducts[index] };
  }

  onSave(index: number) {
    const updated = { ...this.editProduct };
    delete updated.isNew;

    this.filteredProducts[index] = updated;

 
    const originalIndex = this.products.findIndex(
      p => p.code === updated.code
    );

    if (originalIndex !== -1) {
      this.products[originalIndex] = updated;
    } else {

      this.products.unshift(updated);
    }

    this.editIndex = null;
    this.editProduct = {};
  }

  onCancel() {
    if (this.editIndex !== null &&
        this.filteredProducts[this.editIndex]?.isNew) {
      this.filteredProducts.splice(this.editIndex, 1);
    }

    this.editIndex = null;
    this.editProduct = {};
  }
}
