import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import {
  InventoryService,
  ProductMaster,
} from '../../../core/services/Inventory.service';

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

// ✅ type สำหรับ option ของ dropdown/multiselect
type Option = { label: string; value: string };

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

  // ✅ เปลี่ยนจาก hardcode เป็นดึงจาก database
  names: Option[] = [];

  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  constructor(private readonly inventoryService: InventoryService) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadProducts();
    this.loadProductNames(); // ✅ เพิ่ม: โหลดรายชื่อสินค้าจากหน้า product
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

  // ✅ เพิ่ม: โหลดชื่อสินค้าจากฐานข้อมูลหน้า product
  loadProductNames() {
    this.inventoryService.getProductMaster().subscribe({
      next: (list: ProductMaster[]) => {
        // กันชื่อซ้ำ + เรียง
        const uniqueNames = Array.from(new Set(list.map((x) => x.name))).sort();

        // map ให้เข้ารูปแบบ primeng options
        this.names = uniqueNames.map((name) => ({
          label: name,
          value: name,
        }));
      },
      error: () => {
        Swal.fire('ผิดพลาด', 'โหลดชื่อสินค้าจากหน้า product ไม่สำเร็จ', 'error');
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
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'กรุณากรอกข้อมูลให้ครบ',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      });
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
        Swal.fire({
          title: 'สำเร็จ',
          text: 'สร้างรายการสำเร็จ', // ✅ แก้ข้อความให้ตรง (เดิมเป็น "รายการถูกลบแล้ว")
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
      },
      error: () => {
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถสร้างรายการได้',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        });
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

    const p = this.filteredProducts[index];
    this.editIndex = index;
    this.editProduct = {
      ...p,
      date: this.formatDate(p.date),
    };
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSave(index: number) {
    if (!this.editProduct?.id) return;

    const payload = {
      ...this.editProduct,
      date: this.editProduct.date,
    };

    this.inventoryService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        this.filteredProducts[index] = { ...payload };
        const originalIndex = this.products.findIndex(
          (p) => p.id === this.editProduct!.id
        );
        if (originalIndex !== -1) this.products[originalIndex] = { ...payload };

        this.editIndex = null;
        this.editProduct = null;
        Swal.fire({
          title: 'สำเร็จ',
          text: 'บันทึกข้อมูลเรียบร้อย',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
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
      html: '<span style="color:red; font-weight:bold;">ข้อมูลจะไม่สามารถกู้คืนได้</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.delete(product.id!).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire({
              title: 'สำเร็จ',
              text: 'ลบรายการสำเร็จ',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
          },
          error: () => {
            Swal.fire({
              title: 'ผิดพลาด',
              text: 'ลบรายการไม่สำเร็จ',
              icon: 'error',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
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
    return new Date().toISOString().split('T')[0];
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