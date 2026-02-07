import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { HistoryService } from '../../../core/services/history.service';

export interface Product {
  id?: number; // 👈 เพิ่ม id สำหรับ backend
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [TableModule, FormsModule, CommonModule, CheckboxModule],
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

  // ===== SELECTION =====
  selectedProducts: Product[] = [];

  constructor(private historyService: HistoryService) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.historyService.getAll().subscribe((res: any[]) => {
      this.products = res.map((p) => ({
        ...p,
        date: new Date(p.date),
      }));
      this.filteredProducts = [...this.products];
    });
  }

  // ================= CHECKBOX =================
  onCheckboxChange(event: any, product: Product) {
    if (event.target.checked) {
      this.selectedProducts.push(product);
    } else {
      this.selectedProducts = this.selectedProducts.filter(
        (p) => p.code !== product.code
      );
    }
  }

  onSelectAll(event: any) {
    this.selectedProducts = event.target.checked
      ? [...this.filteredProducts]
      : [];
  }

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
        this.onCreateCancel(); // reset form
        Swal.fire({
          title: 'สำเร็จ',
          text: 'สร้างรายการเรียบร้อย',
          icon: 'success',
          timer: 1500, // เวลาแสดง (ms)
          showConfirmButton: false,
          timerProgressBar: true,
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
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

  // ================= EDIT =================
  onEdit(index: number) {
    if (this.showCreateForm) return;
    this.editIndex = index;
    this.editProduct = { ...this.filteredProducts[index] };
  }

  onSave(index: number) {
    if (!this.editProduct) return;

    const product = this.filteredProducts[index];
    const payload = {
      ...this.editProduct,
      date: String(this.editProduct.date),
    };

    this.historyService.update(product.id!, payload).subscribe(() => {
      this.loadProducts();
      this.editIndex = null;
      this.editProduct = null;
      Swal.fire({
        title: 'สำเร็จ',
        text: 'แก้ไขข้อมูลเรียบร้อย',
        icon: 'success',
        timer: 1500, // เวลาแสดง (ms)
        showConfirmButton: false,
        timerProgressBar: true,
      });
    });
  }

  onCancel() {
    this.editIndex = null;
    this.editProduct = null;
  }

  // ================= DELETE =================
  onDelete(index: number) {
    const product = this.filteredProducts[index];

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
        this.historyService.delete(product.id!).subscribe(() => {
          this.loadProducts();
          Swal.fire({
            title: 'สำเร็จ',
            text: 'รายการถูกลบแล้ว',
            icon: 'success',
            timer: 1500, // เวลาแสดง (ms)
            showConfirmButton: false,
            timerProgressBar: true,
          });
        });
      }
    });
  }

  // ================= EXPORT EXCEL =================
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

    const worksheetData = this.selectedProducts.map((p) => ({
      วันที่: new Date(p.date).toLocaleDateString('th-TH'),
      ชื่อสินค้า: p.name,
      หมวดหมู่: p.category,
      จำนวน: p.quantity,
      ราคา: p.price,
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'History');
    XLSX.writeFile(wb, 'History.xlsx');
  }

  // ================= UTILS =================
  private getEmptyProduct(): Product {
    return {
      code: '',
      name: '',
      category: '',
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
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
