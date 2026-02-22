import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  imports: [TableModule, MultiSelectModule, FormsModule, CommonModule, CheckboxModule],
  templateUrl: './adminhistory.component.html',
  styleUrl: './adminhistory.component.scss',
})
export class AdminhistoryComponent  implements OnInit {
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
    private readonly router: Router
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    const items = history.state?.items as Product[] | undefined;

    if (Array.isArray(items) && items.length > 0) {
      // ✅ ใช้ข้อมูลที่ส่งมา (แสดงทันที) + normalize date
      this.products = items.map((x) => ({
        ...x,
        quantity: Number((x as any).quantity ?? 0),
        price: Number((x as any).price ?? 0),
        date: this.normalizeYmd((x as any).date), // ✅ กันวันที่เพี้ยน
      }));
      this.filteredProducts = [...this.products];
    } else {
      this.loadProducts();
    }
  }

  /* ================= LOAD ================= */
  loadProducts() {
    this.historyService.getAll().subscribe({
      next: (res) => {
        // ✅ normalize date ทุกแถว กัน timezone เลื่อนวัน
        this.products = (res || []).map((x) => ({
          ...x,
          quantity: Number((x as any).quantity ?? 0),
          price: Number((x as any).price ?? 0),
          date: this.normalizeYmd((x as any).date),
        }));

        this.filteredProducts = [...this.products];

        // ✅ กัน selected ค้างผิด (เช่น ลบจาก DB แล้ว)
        this.selectedProducts = this.selectedProducts.filter((s) =>
          this.filteredProducts.some((p) => this.sameRow(p, s))
        );
      },
      error: () => Swal.fire({
        title: 'ผิดพลาด',
        text: 'โหลดข้อมูลไม่สำเร็จ',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      }),
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

    // ✅ เวลาฟิลเตอร์เปลี่ยน ให้คง selected เฉพาะตัวที่ยังอยู่ใน filtered
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
    // ✅ normalize date ก่อนส่ง
    this.newProduct.date = this.normalizeYmd(this.newProduct.date);

    if (!this.isValidProduct(this.newProduct)) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, หมวดหมู่, จำนวน, ราคา)',
        icon: 'warning',
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
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถสร้างรายการได้',
          icon: 'error',
        }),
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
      // ✅ ให้ input type="date" ได้ค่า YYYY-MM-DD แบบไม่เพี้ยน
      date: this.normalizeYmd(p.date),
    };
  }

  onSave(index: number) {
    if (!this.editProduct?.id) return;

    const payload: Product = {
      ...this.editProduct,
      date: this.normalizeYmd(this.editProduct.date), // ✅ normalize ก่อนส่ง
    };

    this.historyService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        // ✅ update local arrays
        this.filteredProducts[index] = { ...payload };

        const originalIndex = this.products.findIndex((p) =>
          this.sameRow(p, this.editProduct!)
        );
        if (originalIndex !== -1) this.products[originalIndex] = { ...payload };

        // ✅ sync selected ถ้าถูกเลือกอยู่
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
      error: () => Swal.fire({
        title: 'ผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      }),
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
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'ไม่พบ ID ของสินค้า',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      });
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
      if (!result.isConfirmed) return;

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
        error: () => Swal.fire({
          title: 'ผิดพลาด',
          text: 'ลบรายการไม่สำเร็จ',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        }),
      });
    });
  }

  /* ================= CHECKBOX ================= */

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
    this.selectedProducts = checked ? [...this.filteredProducts] : [];
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
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    const data = this.selectedProducts.map((p) => ({
      วันที่: this.formatThDate(p.date), // ✅ ใช้ตัวนี้กันเลื่อนวัน
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

  /* ================= DATE HELPERS (FIX TIMEZONE) ================= */

  /**
   * คืนค่า YYYY-MM-DD แบบ "ไม่เลื่อนวัน" (ยึด Asia/Bangkok)
   * - ถ้าเป็น YYYY-MM-DD อยู่แล้วจะคืนเดิม
   * - ถ้าเป็น 20/02/2026 หรือ Date จะ normalize ให้ถูก
   */
  private normalizeYmd(date: string | Date): string {
    if (!date) return this.todayString();

    if (typeof date === 'string') {
      // already ymd
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

      // dd/mm/yyyy -> ymd
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    const d = new Date(date);
    // en-CA = YYYY-MM-DD
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  }

  /** แสดงวันที่ไทยแบบไม่เลื่อนวัน */
  private formatThDate(date: string | Date): string {
    const ymd = this.normalizeYmd(date);
    // ทำให้เป็น Date ที่ไม่โดน timezone shift: ใส่ T00:00:00
    const d = new Date(`${ymd}T00:00:00`);
    return d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
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
    // ✅ ให้เป็น YYYY-MM-DD แบบไทยด้วย (กันเลื่อนวัน)
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  }

  private isValidProduct(p: Product): boolean {
    return !!(p.name && p.category && p.quantity >= 0 && p.price >= 0 && p.date);
  }
}