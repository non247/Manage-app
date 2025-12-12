import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-inventory',
  imports: [SidebarUserComponent,TableModule, MultiSelectModule,FormsModule,CommonModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {

editIndex: number | null = null;
editProduct: any = {};
selectedCategories: string[] = [];


    products = [
    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50, price: 10},
    { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120, price: 30 },
    { code: 'P003', name: 'Book', category: 'Box', quantity: 5 ,price: 20}

  ];
  filteredProducts = [...this.products];

    categoryOptions = [
    { label: 'Stationery', value: 'Stationery' },
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


onEdit(index: number) {
  this.editIndex = index;
  this.editProduct = { ...this.products[index] }; // clone data
}

onSave(index: number) {
  const updated = { ...this.editProduct };

  // อัปเดตใน filteredProducts
  this.filteredProducts[index] = updated;

  // หาใน products โดยใช้ code (unique)
  const originalIndex = this.products.findIndex(
    (p) => p.code === updated.code
  );

  if (originalIndex !== -1) {
    this.products[originalIndex] = updated;
  }

  this.editIndex = null;
}

onCancel() {
  this.editIndex = -1;
  this.editProduct = null;
}

onDelete(index: number) {
  // แสดงการยืนยันการลบ
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {
    if (result.isConfirmed) {
      // ลบจาก filteredProducts
      this.filteredProducts.splice(index, 1);

      // ลบจาก products
      const deletedProduct = this.products[index];
      const originalIndex = this.products.findIndex(p => p.code === deletedProduct.code);
      if (originalIndex !== -1) {
        this.products.splice(originalIndex, 1);
      }

      // แสดงข้อความแจ้งเตือนว่าได้ลบแล้ว
      Swal.fire({
        title: "Deleted!",
        text: "Your product has been deleted.",
        icon: "success"
      });
    }
  });
}
}