import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface Product {
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: Date;
}

@Component({
  selector: 'app-history',
  imports: [TableModule, FormsModule, CommonModule, CheckboxModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
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
      name: 'วนิลลา',
      category: 'ไอศครีม',
      quantity: 50,
      price: 10,
      date: new Date('2025-12-01'),
    },
    {
      code: 'P002',
      name: 'ช็อคโกแลต',
      category: 'ไอศครีม',
      quantity: 120,
      price: 30,
      date: new Date('2025-12-01'),
    },
    {
      code: 'P003',
      name: 'สตรอเบอร์รี่',
      category: 'ไอศครีม',
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

  // ===== SELECTION (แทน checkbox ของ PrimeNG) =====
  selectedProducts: Product[] = [];

  onCheckboxChange(event: any, product: Product) {
    if (event.target.checked) {
      this.selectedProducts.push(product);
    } else {
      const index = this.selectedProducts.indexOf(product);
      if (index > -1) this.selectedProducts.splice(index, 1);
    }
  }

  onSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedProducts = [...this.filteredProducts];
    } else {
      this.selectedProducts = [];
    }
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
      text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

    const product: Product = {
      ...this.newProduct,
      code: 'P' + Date.now(),
    };

    this.products.unshift(product);
    this.filteredProducts = [...this.products];
    this.onCreateCancel();
    Swal.fire('เสร็จสิ้น', 'สร้างรายการสำเร็จแล้ว', 'success');
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
    const updated = { ...this.editProduct };
    this.filteredProducts[index] = updated;

    const originalIndex = this.products.findIndex(
      (p) => p.code === updated.code
    );
    if (originalIndex !== -1) this.products[originalIndex] = updated;

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
      title: 'ยืนยันที่จะลบ?',
      text: "รายการนี้จะไม่สามารถย้อนกลับการเปลี่ยนแปลงนี้ได้เมื่อถูกลบ",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        const deleted = this.filteredProducts[index];
        this.filteredProducts.splice(index, 1);
        const originalIndex = this.products.findIndex(
          (p) => p.code === deleted.code
        );
        if (originalIndex !== -1) this.products.splice(originalIndex, 1);
        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      }
    });
  }

  //   // selectedProducts คือ array ของ products ที่เลือกจาก checkbox
  // exportToExcel() {
  //   if (!this.selectedProducts || this.selectedProducts.length === 0) {
  //     alert('Please select at least one product to export!');
  //     return;
  //   }

  //   // map ข้อมูลให้เป็นรูปแบบ table
  //   const worksheetData = this.selectedProducts.map(p => ({
  //     Name: p.name,
  //     Category: p.category,
  //     Quantity: p.quantity,
  //     Price: p.price,
  //     Date: p.date ? new Date(p.date).toLocaleDateString() : ''
  //   }));

  //   const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);
  //   const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  //   // สร้างไฟล์ Excel และดาวน์โหลด
  //   const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  //   const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  // }

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

  fileName = 'ExcelSheet.xlsx';

  exportToExcel() {
    if (!this.selectedProducts || this.selectedProducts.length === 0) {
    Swal.fire({
      title: 'ผิดพลาด',
      text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

    const worksheetData = this.selectedProducts.map((p) => ({
    'ชื่อสินค้า': p.name,
    'หมวดหมู่': p.category,
    'จำนวน': p.quantity,
    'ราคา': p.price,
    'วันที่': p.date ? new Date(p.date).toLocaleDateString('th-TH') : '',
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    XLSX.writeFile(wb, 'SelectedProducts.xlsx');
  }
}
