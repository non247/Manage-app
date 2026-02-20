import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ✅ เพิ่ม
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HistoryService } from '../../../core/services/history.service';

/* ================= INTERFACE ================= */
export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string; // ✅ string กัน timezone
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    TableModule,
    MultiSelectModule,
    FormsModule,
    CommonModule,
    CheckboxModule,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
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

  // ===== CHECKBOX =====
  selectedProducts: Product[] = [];

  // ===== CATEGORY OPTIONS =====
  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  constructor(
    private readonly historyService: HistoryService,
    private readonly router: Router // ✅ เพิ่ม
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    // ✅ รับค่าที่ส่งมาจากหน้าอื่นด้วย Router state
    // ตัวอย่างฝั่งส่ง: this.router.navigate(['/history'], { state: { items: list }})
    const items = history.state?.items as Product[] | undefined;

    if (Array.isArray(items) && items.length > 0) {
      // ✅ ใช้ข้อมูลที่ส่งมา (แสดงทันที)
      this.products = items.map((x) => ({
        ...x,
        quantity: Number((x as any).quantity ?? 0),
        price: Number((x as any).price ?? 0),
      }));
      this.filteredProducts = [...this.products];
    } else {
      // ✅ ถ้าไม่ได้ส่งมาก็โหลดจาก DB เหมือนเดิม
      this.loadProducts();
    }
  }

  /* ================= LOAD ================= */
  loadProducts() {
    this.historyService.getAll().subscribe({
      next: (res) => {
        this.products = res;
        this.filteredProducts = [...res];

        // ✅ กัน selected ค้างผิด (เช่น ลบจาก DB แล้ว)
        this.selectedProducts = this.selectedProducts.filter((s) =>
          this.filteredProducts.some((p) => this.sameRow(p, s))
        );
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
    } else {
      this.filteredProducts = this.products.filter((p) =>
        this.selectedCategories.includes(p.category)
      );
    }

    // ✅ สำคัญ: เวลาฟิลเตอร์เปลี่ยน ให้คง selected เฉพาะตัวที่ยังอยู่ใน filtered
    this.selectedProducts = this.selectedProducts.filter((s) =>
      this.filteredProducts.some((p) => this.sameRow(p, s))
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

    this.historyService.create(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.onCreateCancel();
        Swal.fire({
          title: 'สำเร็จ',
          text: 'สร้างรายการเรียบร้อย',
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

    const payload: Product = {
      ...this.editProduct,
      date: this.editProduct.date,
    };

    this.historyService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        // ✅ update local array เหมือน inventory
        this.filteredProducts[index] = { ...payload };

        const originalIndex = this.products.findIndex((p) =>
          this.sameRow(p, this.editProduct!)
        );
        if (originalIndex !== -1) this.products[originalIndex] = { ...payload };

        // ✅ ถ้า item นี้ถูกเลือกอยู่ ให้ sync ด้วย
        const selIndex = this.selectedProducts.findIndex((p) =>
          this.sameRow(p, payload)
        );
        if (selIndex !== -1) this.selectedProducts[selIndex] = { ...payload };

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
        this.historyService.delete(product.id!).subscribe({
          next: () => {
            // ✅ ถ้าถูกเลือกอยู่ ให้เอาออกด้วย
            this.selectedProducts = this.selectedProducts.filter(
              (p) => !this.sameRow(p, product)
            );

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
            Swal.fire('ผิดพลาด', 'ลบรายการไม่สำเร็จ', 'error');
          },
        });
      }
    });
  }

  /* ================= CHECKBOX (ปรับใหม่ทั้งหมด) ================= */

  /** เทียบว่าเป็นแถวเดียวกัน (ใช้ id ก่อน ถ้าไม่มีค่อย fallback code) */
  private sameRow(a: Product, b: Product): boolean {
    if (a?.id != null && b?.id != null) return a.id === b.id;
    return a.code === b.code;
  }

  /** เช็คว่าแถวนี้ถูกเลือกอยู่ไหม */
  isSelected(p: Product): boolean {
    return this.selectedProducts.some((x) => this.sameRow(x, p));
  }

  /** กด checkbox รายแถว */
  toggleRow(p: Product, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.isSelected(p)) this.selectedProducts = [...this.selectedProducts, p];
    } else {
      this.selectedProducts = this.selectedProducts.filter((x) => !this.sameRow(x, p));
    }
  }

  /** กด checkbox เลือกทั้งหมด (แค่ใน filteredProducts) */
  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedProducts = [...this.filteredProducts];
    } else {
      this.selectedProducts = [];
    }
  }

  /** ใช้ bind กับ [checked] ของ checkbox หัวตาราง */
  isAllSelected(): boolean {
    return (
      this.filteredProducts.length > 0 &&
      this.selectedProducts.length === this.filteredProducts.length
    );
  }

  /** ใช้ bind กับ [indeterminate] ของ checkbox หัวตาราง */
  isIndeterminate(): boolean {
    return (
      this.selectedProducts.length > 0 &&
      this.selectedProducts.length < this.filteredProducts.length
    );
  }

  /* ================= EXPORT ================= */
  exportToExcel() {
    if (this.selectedProducts.length === 0) {
      Swal.fire('ผิดพลาด', 'กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ', 'error');
      return;
    }

    const data = this.selectedProducts.map((p) => ({
      วันที่: new Date(p.date).toLocaleDateString('th-TH'),
      ชื่อสินค้า: p.name,
      หมวดหมู่: p.category,
      จำนวน: p.quantity,
      ราคา: p.price,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'History');
    XLSX.writeFile(wb, 'History.xlsx');
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
    return !!(p.name && p.category && p.quantity >= 0 && p.price >= 0 && p.date);
  }
}