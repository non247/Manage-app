// import { Component } from '@angular/core';
// import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
// import { TableModule } from 'primeng/table';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import Swal from 'sweetalert2';


// @Component({
//   selector: 'app-inventory',
//   imports: [SidebarUserComponent,TableModule, MultiSelectModule,FormsModule,CommonModule],
//   templateUrl: './inventory.component.html',
//   styleUrl: './inventory.component.scss',
// })
// export class InventoryComponent {

// editIndex: number | null = null;
// editProduct: any = {};
// selectedCategories: string[] = [];


//     products = [
//     { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50, price: 10},
//     { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120, price: 30 },
//     { code: 'P003', name: 'Book', category: 'Box', quantity: 5 ,price: 20}

//   ];
//   filteredProducts = [...this.products];

//     categoryOptions = [
//     { label: 'Stationery', value: 'Stationery' },
//     { label: 'Box', value: 'Box' }
//   ];



//   filterProducts() {
//     if (this.selectedCategories.length === 0) {
//       this.filteredProducts = [...this.products];
//       return;
//     }

//     this.filteredProducts = this.products.filter(p =>
//       this.selectedCategories.includes(p.category)
//     );
//   }


// onEdit(index: number) {
//   this.editIndex = index;
//   this.editProduct = { ...this.products[index] }; // clone data
// }

// onSave(index: number) {
//   const updated = { ...this.editProduct };

//   // อัปเดตใน filteredProducts
//   this.filteredProducts[index] = updated;

//   // หาใน products โดยใช้ code (unique)
//   const originalIndex = this.products.findIndex(
//     (p) => p.code === updated.code
//   );

//   if (originalIndex !== -1) {
//     this.products[originalIndex] = updated;
//   }

//   this.editIndex = null;
// }

// onCancel() {
//   this.editIndex = -1;
//   this.editProduct = null;
// }

// onDelete(index: number) {
//   // แสดงการยืนยันการลบ
//   Swal.fire({
//     title: "Are you sure?",
//     text: "You won't be able to revert this!",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#3085d6",
//     cancelButtonColor: "#d33",
//     confirmButtonText: "Yes, delete it!"
//   }).then((result) => {
//     if (result.isConfirmed) {
//       // ลบจาก filteredProducts
//       this.filteredProducts.splice(index, 1);

//       // ลบจาก products
//       const deletedProduct = this.products[index];
//       const originalIndex = this.products.findIndex(p => p.code === deletedProduct.code);
//       if (originalIndex !== -1) {
//         this.products.splice(originalIndex, 1);
//       }

//       // แสดงข้อความแจ้งเตือนว่าได้ลบแล้ว
//       Swal.fire({
//         title: "Deleted!",
//         text: "Your product has been deleted.",
//         icon: "success"
//       });
//     }
//   });
// }
// }

import { Component } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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
  selector: 'app-inventory',
  imports: [
    SidebarUserComponent,
    TableModule,
    MultiSelectModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {

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


  onDelete(index: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = this.filteredProducts[index];

        this.filteredProducts.splice(index, 1);

        const originalIndex = this.products.findIndex(
          p => p.code === deleted.code
        );

        if (originalIndex !== -1) {
          this.products.splice(originalIndex, 1);
        }

        Swal.fire("Deleted!", "Product has been deleted.", "success");
      }
    });
  }
}
