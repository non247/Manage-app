import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

import {
  PurchasehistoryService,
  PurchaseHistoryProduct,
  ProductMaster,
} from '../../../core/services/purchasehistory.service';

export interface Product {
  id?: number;
  code?: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  total?: number;
  image?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-historypurchase',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule],
  templateUrl: './historypurchase.component.html',
  styleUrls: ['./historypurchase.component.scss'],
})
export class HistorypurchaseComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productMasters: ProductMaster[] = [];

  showCreateForm = false;
  isClosing = false;

  showImagePreview = false;
  previewImageUrl = '';

  editIndex: number | null = null;
  editProduct: Product | null = null;

  newProduct: Product = this.createEmptyProduct();

  categories: SelectOption[] = [
    { label: 'เครื่องดื่ม', value: 'เครื่องดื่ม' },
    { label: 'ขนม', value: 'ขนม' },
    { label: 'อาหาร', value: 'อาหาร' },
    { label: 'ของใช้', value: 'ของใช้' },
    { label: 'อื่น ๆ', value: 'อื่น ๆ' },
  ];

  constructor(
    private readonly purchaseHistoryService: PurchasehistoryService
  ) {}

  ngOnInit(): void {
    this.loadProductMasters();
    this.loadProducts();
  }

  /* ================= CREATE EMPTY ================= */
  createEmptyProduct(): Product {
    return {
      code: '',
      name: '',
      category: '',
      quantity: 1,
      price: 0,
      date: this.todayString(),
      total: 0,
      image: '',
    };
  }

  /* ================= DATE / NUMBER HELPERS ================= */
  toInt(value: any, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.floor(n) : fallback;
  }

  todayString(): string {
    return new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Bangkok',
    });
  }

  normalizeYmd(value: any): string {
    if (!value) return this.todayString();

    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return this.todayString();

    return d.toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Bangkok',
    });
  }

  /* ================= IMAGE HELPERS ================= */
  private getMasterByName(name: string): ProductMaster | undefined {
    return this.productMasters.find((x) => x.name === name);
  }

  getImageUrl(image?: string): string {
    if (!image) return '';

    const cleaned = image.trim().replace(/\\/g, '/');

    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }

    if (cleaned.startsWith('/uploads/')) {
      return `http://localhost:3000${cleaned}`;
    }

    if (cleaned.startsWith('uploads/')) {
      return `http://localhost:3000/${cleaned}`;
    }

    return `http://localhost:3000/uploads/${cleaned}`;
  }

  private applyMasterImage(product: Product): Product {
    const master = this.getMasterByName(product.name);
    return {
      ...product,
      image: this.getImageUrl(master?.image || product.image),
    };
  }

  private mapProductsWithMasterImage(list: Product[]): Product[] {
    return (list || []).map((p) => this.applyMasterImage(this.withTotal(p)));
  }

  /* ================= TOTAL / NORMALIZE ================= */
  withTotal(product: Product): Product {
    const quantity = this.toInt(product.quantity, 0);
    const price = this.toInt(product.price, 0);

    return {
      ...product,
      quantity,
      price,
      date: this.normalizeYmd(product.date),
      total: quantity * price,
    };
  }

  normalizeProduct(item: Partial<Product>): Product {
    const quantity = this.toInt(item.quantity, 0);
    const price = this.toInt(item.price, 0);

    return {
      id: item.id,
      code: item.code ?? '',
      name: item.name ?? '',
      category: item.category ?? '',
      quantity,
      price,
      date: this.normalizeYmd(item.date),
      total: quantity * price,
      image: this.getImageUrl(item.image),
    };
  }

  toPayload(product: Product): PurchaseHistoryProduct {
    const normalized = this.withTotal(product);

    return {
      id: normalized.id,
      code: normalized.code ?? '',
      name: normalized.name,
      category: normalized.category,
      quantity: normalized.quantity,
      price: normalized.price,
      date: normalized.date,
      total: normalized.total ?? normalized.quantity * normalized.price,
      image: normalized.image || '',
    };
  }

  /* ================= LOAD ================= */
  loadProductMasters(): void {
    this.purchaseHistoryService.getProductMaster().subscribe({
      next: (list: ProductMaster[]) => {
        this.productMasters = list || [];

        if (this.products.length > 0) {
          this.products = this.mapProductsWithMasterImage(this.products);
          this.filteredProducts = [...this.products];
        }
      },
      error: (err: unknown) => {
        console.error('โหลดรูปสินค้าจาก product master ไม่สำเร็จ', err);
        Swal.fire({
          icon: 'error',
          title: 'โหลดรูปสินค้าไม่สำเร็จ',
          text: 'ไม่สามารถดึงรูปจาก product master ได้',
        });
      },
    });
  }

  loadProducts(): void {
    this.purchaseHistoryService.getAll().subscribe({
      next: (res: PurchaseHistoryProduct[]) => {
        const mapped: Product[] = (res || []).map(
          (item: PurchaseHistoryProduct) =>
            this.normalizeProduct({
              id: item.id,
              code: item.code ?? '',
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              price: item.price,
              date: item.date,
              total: item.total,
              image: item.image || '',
            })
        );

        this.products = this.mapProductsWithMasterImage(mapped);
        this.filteredProducts = [...this.products];
      },
      error: (err: unknown) => {
        console.error('โหลดข้อมูล purchase history ไม่สำเร็จ', err);
        Swal.fire({
          icon: 'error',
          title: 'โหลดข้อมูลไม่สำเร็จ',
          text: 'ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้',
        });
      },
    });
  }

  /* ================= CREATE ================= */
  openCreateForm(): void {
    this.newProduct = this.createEmptyProduct();
    this.showCreateForm = true;
    this.isClosing = false;
  }

  onCreateSave(): void {
    const name = this.newProduct.name.trim();
    const category = this.newProduct.category.trim();
    const quantity = this.toInt(this.newProduct.quantity, 0);
    const price = this.toInt(this.newProduct.price, 0);
    const date = this.normalizeYmd(this.newProduct.date);

    if (!name || !category || !date) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกชื่อสินค้า ประเภท และวันที่ให้ครบ',
      });
      return;
    }

    if (quantity <= 0 || price < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'จำนวนต้องมากกว่า 0 และราคาต้องไม่ติดลบ',
      });
      return;
    }

    const payload = this.toPayload({
      ...this.newProduct,
      code: this.newProduct.code || `H${Date.now()}`,
      quantity,
      price,
      date,
    });

    this.purchaseHistoryService.create(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มข้อมูลสำเร็จ',
          timer: 1200,
          showConfirmButton: false,
        });

        this.newProduct = this.createEmptyProduct();
        this.closeCreateForm();
        this.loadProducts();
      },
      error: (err: unknown) => {
        console.error('เพิ่มข้อมูล purchase history ไม่สำเร็จ', err);
        Swal.fire({
          icon: 'error',
          title: 'เพิ่มข้อมูลไม่สำเร็จ',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
        });
      },
    });
  }

  onCreateCancel(): void {
    this.closeCreateForm();
  }

  closeCreateForm(): void {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.newProduct = this.createEmptyProduct();
    }, 200);
  }

  /* ================= EDIT ================= */
  startEdit(index: number, product: Product): void {
    this.editIndex = index;
    this.editProduct = {
      ...this.applyMasterImage(this.withTotal(product)),
      date: this.normalizeYmd(product.date),
    };
  }

  saveEdit(index: number): void {
    if (this.editIndex === null || !this.editProduct || !this.editProduct.id) {
      return;
    }

    const name = this.editProduct.name.trim();
    const category = this.editProduct.category.trim();
    const quantity = this.toInt(this.editProduct.quantity, 0);
    const price = this.toInt(this.editProduct.price, 0);
    const date = this.normalizeYmd(this.editProduct.date);

    if (!name || !category || !date) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบก่อนบันทึก',
      });
      return;
    }

    if (quantity <= 0 || price < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'จำนวนต้องมากกว่า 0 และราคาต้องไม่ติดลบ',
      });
      return;
    }

    const payload = this.toPayload({
      ...this.editProduct,
      quantity,
      price,
      date,
    });

    this.purchaseHistoryService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        const updatedProduct = this.applyMasterImage(
          this.withTotal({
            ...this.editProduct!,
            quantity,
            price,
            date,
          })
        );

        this.filteredProducts[index] = updatedProduct;

        const originalIndex = this.products.findIndex(
          (p) => p.id === updatedProduct.id
        );
        if (originalIndex !== -1) {
          this.products[originalIndex] = updatedProduct;
        }

        this.cancelEdit();

        Swal.fire({
          icon: 'success',
          title: 'แก้ไขสำเร็จ',
          timer: 1200,
          showConfirmButton: false,
        });
      },
      error: (err: unknown) => {
        console.error('แก้ไขข้อมูล purchase history ไม่สำเร็จ', err);
        Swal.fire({
          icon: 'error',
          title: 'แก้ไขไม่สำเร็จ',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
        });
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!product.id) return;

    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `ต้องการลบ ${product.name} ใช่หรือไม่`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.purchaseHistoryService.delete(product.id!).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            timer: 1200,
            showConfirmButton: false,
          });
          this.loadProducts();
        },
        error: (err: unknown) => {
          console.error('ลบข้อมูล purchase history ไม่สำเร็จ', err);
          Swal.fire({
            icon: 'error',
            title: 'ลบไม่สำเร็จ',
            text: 'ไม่สามารถลบข้อมูลได้',
          });
        },
      });
    });
  }

  cancelEdit(): void {
    this.editIndex = null;
    this.editProduct = null;
  }

  /* ================= IMAGE PREVIEW ================= */
  openImagePreview(imageUrl: string): void {
    if (!imageUrl) return;
    this.previewImageUrl = imageUrl;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.previewImageUrl = '';
    this.showImagePreview = false;
  }

  /* ================= EXPORT ================= */
  exportToExcel(): void {
    Swal.fire({
      icon: 'info',
      title: 'ยังไม่ได้เปิดใช้งาน',
      text: 'ฟังก์ชัน Export Excel ยังไม่ได้ถูกพัฒนา',
    });
  }
}
