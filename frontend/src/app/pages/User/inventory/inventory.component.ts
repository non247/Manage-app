// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TableModule } from 'primeng/table';
// import { InventoryService } from '../../../core/services/Inventory.sevice';
// import Swal from 'sweetalert2';

// export interface Product {
//   id?: number;            // 👈 เพิ่ม id สำหรับ backend
//   code: string;
//   name: string;
//   category: string;
//   quantity: number;
//   price: number;
//   date: Date;
// }

// @Component({
//   selector: 'app-inventory',
//   standalone: true,
//   imports: [TableModule, MultiSelectModule, FormsModule, CommonModule],
//   templateUrl: './inventory.component.html',
//   styleUrl: './inventory.component.scss',
// })
// export class InventoryComponent {
//   // ===== TABLE / EDIT =====
//   editIndex: number | null = null;
//   editProduct: Product | null = null;

//   // ===== CREATE FORM =====
//   showCreateForm = false;
//   isClosing = false;

//   newProduct: Product = this.getEmptyProduct();

//   // ===== FILTER =====
//   selectedCategories: string[] = [];

//   // ===== DATA =====
//   products: Product[] = [
//     {
//       code: 'P001',
//       name: 'วนิลา',
//       category: 'ไอศครีม',
//       quantity: 15,
//       price: 35,
//       date: new Date('2025-12-01'),
//     },
//     {
//       code: 'P002',
//       name: 'ช็อคโกแลต',
//       category: 'ไอศครีม',
//       quantity: 20,
//       price: 35,
//       date: new Date('2025-12-01'),
//     },
//     {
//       code: 'P003',
//       name: 'สตรอเบอร์รี่',
//       category: 'ไอศครีม',
//       quantity: 5,
//       price: 40,
//       date: new Date('2025-12-01'),
//     },
//   ];

//   filteredProducts: Product[] = [...this.products];

//   categoryOptions = [
//     { label: 'ไอศครีม', value: 'ไอศครีม' },
//     { label: 'กล่อง', value: 'กล่อง' },
//   ];

//   // ================= FILTER =================
//   filterProducts() {
//     if (this.selectedCategories.length === 0) {
//       this.filteredProducts = [...this.products];
//       return;
//     }

//     this.filteredProducts = this.products.filter((p) =>
//       this.selectedCategories.includes(p.category)
//     );
//   }

//   // ================= CREATE =================
//   onCreate() {
//     if (this.editIndex !== null) return;
//     this.showCreateForm = true;
//   }

//   onCreateSave() {
//       if (!this.isValidProduct(this.newProduct)) {
//     Swal.fire({
//       title: 'ผิดพลาด',
//       text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
//       icon: 'error',
//       confirmButtonText: 'ตกลง'
//     });
//     return;
//   }

//     const product: Product = {
//       ...this.newProduct,
//       code: 'P' + Date.now(),
//     };

//     this.products.unshift(product);
//     this.filteredProducts = [...this.products];

//     this.onCreateCancel(); // ✅ ใช้ animation ปิด

//     Swal.fire({title:'เสร็จสิ้น',text:'สร้างรายการสำเร็จแล้ว', icon:'success',confirmButtonText: 'ตกลง'});
//   }

//   onCreateCancel() {
//     this.isClosing = true;

//     setTimeout(() => {
//       this.showCreateForm = false;
//       this.isClosing = false;
//       this.newProduct = this.getEmptyProduct();
//     }, 250); // ต้องตรงกับเวลา animation ใน CSS
//   }

//   private resetCreateForm() {
//     this.newProduct = this.getEmptyProduct();
//   }

//   // ================= EDIT =================
//   onEdit(index: number) {
//     if (this.showCreateForm) return;

//     this.editIndex = index;
//     this.editProduct = { ...this.filteredProducts[index] };
//   }

//   onSave(index: number) {
//     if (!this.editProduct) return;

//     const updated = { ...this.editProduct };

//     this.filteredProducts[index] = updated;

//     const originalIndex = this.products.findIndex(
//       (p) => p.code === updated.code
//     );

//     if (originalIndex !== -1) {
//       this.products[originalIndex] = updated;
//     }

//     this.editIndex = null;
//     this.editProduct = null;
//   }

//   onCancel() {
//     this.editIndex = null;
//     this.editProduct = null;
//   }

//   // ================= DELETE =================
//   onDelete(index: number) {
//     Swal.fire({
//       title: 'ยืนยันที่จะลบ?',
//       text: "รายการนี้จะไม่สามารถย้อนกลับการเปลี่ยนแปลงนี้ได้เมื่อถูกลบ",
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'ตกลง',
//       cancelButtonText: 'ยกเลิก',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         const deleted = this.filteredProducts[index];

//         this.filteredProducts.splice(index, 1);

//         const originalIndex = this.products.findIndex(
//           (p) => p.code === deleted.code
//         );

//         if (originalIndex !== -1) {
//           this.products.splice(originalIndex, 1);
//         }

// Swal.fire({title:'ลบรายการสำเร็จ!', text:'รายการลบเสร็จสิ้น', icon:'success',confirmButtonText: 'ตกลง',});      }
//     });
//   }

//   // ================= UTILS =================
//   private getEmptyProduct(): Product {
//     return {
//       code: '',
//       name: '',
//       category: '',
//       quantity: 0,
//       price: 0,
//       date: new Date(),
//     };
//   }

//   private isValidProduct(p: Product): boolean {
//     return !!(
//       p.name &&
//       p.category &&
//       p.quantity >= 0 &&
//       p.price >= 0 &&
//       p.date
//     );
//   }
// }

// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TableModule } from 'primeng/table';
// import { InventoryService } from '../../../core/services/Inventory.sevice';
// import Swal from 'sweetalert2';

// export interface Product {
//   id?: number;            // 👈 เพิ่ม id สำหรับ backend
//   code: string;
//   name: string;
//   category: string;
//   quantity: number;
//   price: number;
//   date: Date;
// }

// @Component({
//   selector: 'app-inventory',
//   standalone: true,
//   imports: [TableModule, MultiSelectModule, FormsModule, CommonModule],
//   templateUrl: './inventory.component.html',
//   styleUrl: './inventory.component.scss',
// })
// export class InventoryComponent implements OnInit {
//   // ===== TABLE / EDIT =====
//   editIndex: number | null = null;
//   editProduct: Product | null = null;

//   // ===== CREATE FORM =====
//   showCreateForm = false;
//   isClosing = false;
//   newProduct: Product = this.getEmptyProduct();

//   // ===== FILTER =====
//   selectedCategories: string[] = [];

//   // ===== DATA =====
//   products: Product[] = [];
//   filteredProducts: Product[] = [];

//   categoryOptions = [
//     { label: 'ไอศครีม', value: 'ไอศครีม' },
//     { label: 'กล่อง', value: 'กล่อง' },
//   ];

//   constructor(private inventoryService: InventoryService) {}

//   ngOnInit(): void {
//     this.loadProducts();
//   }

//   // ================= LOAD =================
//   loadProducts() {
//   this.inventoryService.getAll().subscribe({
//     next: (res) => {
//       this.products = res;
//       this.filteredProducts = [...res];
//     },
//     error: () => {
//       Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error');
//     }
//   });
// }

//     // this.inventoryService.getAll().subscribe({
//     //   next: (res) => {
//     //     this.products = res;
//     //     this.filteredProducts = [...res];
//     //   },
//     //   error: () => {
//     //     Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error');
//     //   },
//     // });
  

//   // ================= FILTER =================
//   filterProducts() {
//     if (this.selectedCategories.length === 0) {
//       this.filteredProducts = [...this.products];
//       return;
//     }

//     this.filteredProducts = this.products.filter((p) =>
//       this.selectedCategories.includes(p.category)
//     );
//   }

//   // ================= CREATE =================
//   onCreate() {
//     if (this.editIndex !== null) return;
//     this.showCreateForm = true;
//   }

//   onCreateSave() {
//     if (!this.isValidProduct(this.newProduct)) {
//       Swal.fire('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ', 'error');
//       return;
//     }

//     const payload: Product = {
//       ...this.newProduct,
//       code: 'P' + Date.now(),
//     };

//     this.inventoryService.create(payload).subscribe({
//       next: () => {
//         this.loadProducts();
//         this.onCreateCancel();

//         Swal.fire('สำเร็จ', 'สร้างรายการเรียบร้อย', 'success');
//       },
//       error: () => {
//         Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างรายการได้', 'error');
//       },
//     });
//   }

//   onCreateCancel() {
//     this.isClosing = true;

//     setTimeout(() => {
//       this.showCreateForm = false;
//       this.isClosing = false;
//       this.newProduct = this.getEmptyProduct();
//     }, 250);
//   }

//   // ================= EDIT =================
//   onEdit(index: number) {
//     if (this.showCreateForm) return;
//     this.editIndex = index;
//     this.editProduct = { ...this.filteredProducts[index] };
//   }

// onSave(index: number) {
//   if (!this.editProduct || !this.editProduct.id) return;

//   this.inventoryService
//     .update(this.editProduct.id, this.editProduct)
//     .subscribe({
//       next: () => {
//         this.loadProducts();
//         this.editIndex = null;
//         this.editProduct = null;
//       },
//       error: () => {
//         Swal.fire('ผิดพลาด', 'อัปเดตข้อมูลไม่สำเร็จ', 'error');
//       },
//     });
// }

//   onCancel() {
//     this.editIndex = null;
//     this.editProduct = null;
//   }

//   // ================= DELETE =================
// onDelete(index: number) {
//   const product = this.filteredProducts[index];

//   if (!product.id) {
//     Swal.fire('ผิดพลาด', 'ไม่พบ ID ของสินค้า', 'error');
//     return;
//   }

//   Swal.fire({
//     title: 'ยืนยันที่จะลบ?',
//     icon: 'warning',
//     showCancelButton: true,
//     confirmButtonText: 'ตกลง',
//     cancelButtonText: 'ยกเลิก',
//   }).then((result) => {
//     if (result.isConfirmed) {
//       this.inventoryService.delete(product.id!).subscribe({
//         next: () => {
//           this.loadProducts();
//           Swal.fire('สำเร็จ', 'ลบรายการเรียบร้อย', 'success');
//         },
//         error: () => {
//           Swal.fire('ผิดพลาด', 'ลบรายการไม่สำเร็จ', 'error');
//         },
//       });
//     }
//   });
// }

//   // ================= UTILS =================
//   private getEmptyProduct(): Product {
//     return {
//       code: '',
//       name: '',
//       category: '',
//       quantity: 0,
//       price: 0,
//       date: new Date(),
//     };
//   }

//   private isValidProduct(p: Product): boolean {
//     return !!(p.name && p.category && p.quantity >= 0 && p.price >= 0 && p.date);
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InventoryService } from '../../../core/services/Inventory.sevice';
import Swal from 'sweetalert2';

/* ================= INTERFACE ================= */
export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string; // ✅ ใช้ string ป้องกัน timezone
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [TableModule, MultiSelectModule, FormsModule, CommonModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
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
  products: Product[] = [];
  filteredProducts: Product[] = [];

  categoryOptions = [
    { label: 'ไอศครีม', value: 'ไอศครีม' },
    { label: 'กล่อง', value: 'กล่อง' },
  ];

  constructor(private inventoryService: InventoryService) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadProducts();
  }

  /* ================= LOAD ================= */
  loadProducts() {
    this.inventoryService.getAll().subscribe({
      next: (res) => {
        this.products = res;
        this.filteredProducts = [...res];
      },
      error: () => {
        Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error');
      },
    });
  }

  /* ================= FILTER ================= */
  filterProducts() {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter((p) =>
      this.selectedCategories.includes(p.category)
    );
  }

  /* ================= CREATE ================= */
  onCreate() {
    if (this.editIndex !== null) return;
    this.showCreateForm = true;
  }

  onCreateSave() {
    if (!this.isValidProduct(this.newProduct)) {
      Swal.fire('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ', 'error');
      return;
    }

    const payload: Product = {
      ...this.newProduct,
      code: 'P' + Date.now(),
    };

    this.inventoryService.create(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.onCreateCancel();
        Swal.fire('สำเร็จ', 'สร้างรายการเรียบร้อย', 'success');
      },
      error: () => {
        Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างรายการได้', 'error');
      },
    });
  }

  onCreateCancel() {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.newProduct = this.getEmptyProduct();
    }, 250);
  }

  /* ================= EDIT ================= */
  onEdit(index: number) {
    if (this.showCreateForm) return;

    this.editIndex = index;
    this.editProduct = { ...this.filteredProducts[index] }; // date ไม่โดนแปลง
  }

// onSave(index: number) {
//   if (!this.editProduct || !this.editProduct.id) return;

//   // สร้าง payload ให้แน่ใจว่า date เป็น string 'yyyy-MM-dd'
//   const payload = {
//     ...this.editProduct,
//     date: this.editProduct.date  // เก็บเป็น string ตรง ๆ
//   };

//   this.inventoryService.update(this.editProduct.id, payload).subscribe({
//     next: () => {
//       // โหลดข้อมูลใหม่ แต่ไม่แปลงวันที่
//       this.loadProducts(); // ตรวจสอบว่า loadProducts() ไม่แปลง date เป็น Date object
//       this.editIndex = null;
//       this.editProduct = null;
//       Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
//     },
//     error: () => {
//       Swal.fire('ผิดพลาด', 'อัปเดตข้อมูลไม่สำเร็จ', 'error');
//     },
//   });
// }
onSave(index: number) {
  if (!this.editProduct || !this.editProduct.id) return;

  const original = this.filteredProducts[index];
  const payload = {
    ...this.editProduct,
    date: this.editProduct.date
  };

  this.inventoryService.update(this.editProduct.id, payload).subscribe({
    next: () => {
      // อัปเดต local array เลยโดยไม่ต้องโหลดซ้ำทั้งหมด
      this.filteredProducts[index] = { ...payload };
      const originalIndex = this.products.findIndex(p => p.id === this.editProduct!.id);
      if (originalIndex !== -1) this.products[originalIndex] = { ...payload };

      this.editIndex = null;
      this.editProduct = null;
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
    },
    error: () => {
      Swal.fire('ผิดพลาด', 'อัปเดตข้อมูลไม่สำเร็จ', 'error');
    },
  });
}


  onCancel() {
    this.editIndex = null;
    this.editProduct = null;
  }

  /* ================= DELETE ================= */
  onDelete(index: number) {
    const product = this.filteredProducts[index];

    if (!product.id) {
      Swal.fire('ผิดพลาด', 'ไม่พบ ID ของสินค้า', 'error');
      return;
    }

    Swal.fire({
      title: 'ยืนยันที่จะลบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.delete(product.id!).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire('สำเร็จ', 'ลบรายการเรียบร้อย', 'success');
          },
          error: () => {
            Swal.fire('ผิดพลาด', 'ลบรายการไม่สำเร็จ', 'error');
          },
        });
      }
    });
  }

  /* ================= UTILS ================= */
  private getEmptyProduct(): Product {
    return {
      code: '',
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      date: this.todayString(),
    };
  }

  private todayString(): string {
    return new Date().toISOString().split('T')[0]; // yyyy-MM-dd
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