import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import { SidebarUserComponent } from '../../../component/sidebar-user/sidebar-user.component';

interface Product {
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: Date;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    SidebarUserComponent,
    TableModule,
    MultiSelectModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  // ===== TABLE / EDIT =====
  editIndex: number | null = null;
  editProduct: Product | null = null;

  // ===== CREATE FORM =====
  showCreateForm = false;
  isClosing = false;

  newProduct: Product = this.getEmptyProduct();

  // ===== FILTER =====
  selectedCategories: string[] = [];

  // ===== DATA =====
  products: Product[] = [
    {
      code: 'P001',
      name: 'Vanilla',
      category: 'Ice Cream',
      quantity: 50,
      price: 10,
      date: new Date('2025-12-01'),
    },
    {
      code: 'P002',
      name: 'Chocolate',
      category: 'Ice Cream',
      quantity: 120,
      price: 30,
      date: new Date('2025-12-01'),
    },
    {
      code: 'P003',
      name: 'Box A',
      category: 'Box',
      quantity: 5,
      price: 20,
      date: new Date('2025-12-01'),
    },
  ];

  filteredProducts: Product[] = [...this.products];

  categoryOptions = [
    { label: 'Ice Cream', value: 'Ice Cream' },
    { label: 'Box', value: 'Box' },
  ];

  // ================= FILTER =================
  filterProducts() {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter((p) =>
      this.selectedCategories.includes(p.category)
    );
  }

  // ================= CREATE =================
  onCreate() {
    if (this.editIndex !== null) return;
    this.showCreateForm = true;
  }

  onCreateSave() {
    if (!this.isValidProduct(this.newProduct)) {
      Swal.fire('Error', 'Please fill all fields', 'error');
      return;
    }

    const product: Product = {
      ...this.newProduct,
      code: 'P' + Date.now(),
    };

    this.products.unshift(product);
    this.filteredProducts = [...this.products];

    this.onCreateCancel(); // ✅ ใช้ animation ปิด

    Swal.fire('Success', 'Product created successfully', 'success');
  }

  onCreateCancel() {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.newProduct = this.getEmptyProduct();
    }, 250); // ต้องตรงกับเวลา animation ใน CSS
  }

  private resetCreateForm() {
    this.newProduct = this.getEmptyProduct();
  }

  // ================= EDIT =================
  onEdit(index: number) {
    if (this.showCreateForm) return;

    this.editIndex = index;
    this.editProduct = { ...this.filteredProducts[index] };
  }

  onSave(index: number) {
    if (!this.editProduct) return;

    const updated = { ...this.editProduct };

    this.filteredProducts[index] = updated;

    const originalIndex = this.products.findIndex(
      (p) => p.code === updated.code
    );

    if (originalIndex !== -1) {
      this.products[originalIndex] = updated;
    }

    this.editIndex = null;
    this.editProduct = null;
  }

  onCancel() {
    this.editIndex = null;
    this.editProduct = null;
  }

  // ================= DELETE =================
  onDelete(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = this.filteredProducts[index];

        this.filteredProducts.splice(index, 1);

        const originalIndex = this.products.findIndex(
          (p) => p.code === deleted.code
        );

        if (originalIndex !== -1) {
          this.products.splice(originalIndex, 1);
        }

        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      }
    });
  }

  // ================= UTILS =================
  private getEmptyProduct(): Product {
    return {
      code: '',
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      date: new Date(),
    };
  }

  private isValidProduct(p: Product): boolean {
    return !!(
      p.name &&
      p.category &&
      p.quantity >= 0 &&
      p.price >= 0 &&
      p.date
    );
  }
}
