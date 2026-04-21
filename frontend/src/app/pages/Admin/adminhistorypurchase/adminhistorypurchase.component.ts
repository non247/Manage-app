import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  selector: 'app-adminhistorypurchase',
  imports: [CommonModule, FormsModule, TableModule, InputTextModule],
  templateUrl: './adminhistorypurchase.component.html',
  styleUrl: './adminhistorypurchase.component.scss',
})
export class AdminhistorypurchaseComponent {
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

  todayString(): string {
    return new Date().toLocaleDateString('en-CA', {
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
    return (list || []).map((p) => this.applyMasterImage(p));
  }

  /* ================= TOTAL ================= */
  withTotal(product: Product): Product {
    return {
      ...product,
      quantity: Number(product.quantity) || 0,
      price: Number(product.price) || 0,
      total: (Number(product.quantity) || 0) * (Number(product.price) || 0),
    };
  }

  toPayload(product: Product): PurchaseHistoryProduct {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      quantity: Number(product.quantity) || 0,
      price: Number(product.price) || 0,
      date: product.date,
      total: (Number(product.quantity) || 0) * (Number(product.price) || 0),
      image: product.image || '',
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
      },
    });
  }

  loadProducts(): void {
    this.purchaseHistoryService.getAll().subscribe({
      next: (res: PurchaseHistoryProduct[]) => {
        const mapped: Product[] = (res || []).map(
          (item: PurchaseHistoryProduct) =>
            this.withTotal({
              id: item.id,
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
    const quantity = Number(this.newProduct.quantity);
    const price = Number(this.newProduct.price);
    const date = this.newProduct.date;

    if (!name || !category || !date) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    if (quantity <= 0 || price < 0) {
      alert('จำนวนหรือราคาสินค้าไม่ถูกต้อง');
      return;
    }

    const payload = this.toPayload(this.newProduct);

    this.purchaseHistoryService.create(payload).subscribe({
      next: () => {
        this.newProduct = this.createEmptyProduct();
        this.closeCreateForm();
        this.loadProducts();
      },
      error: (err: unknown) => {
        console.error('เพิ่มข้อมูล purchase history ไม่สำเร็จ', err);
        alert('ไม่สามารถเพิ่มข้อมูลได้');
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
    }, 200);
  }

  /* ================= EDIT ================= */
  startEdit(index: number, product: Product): void {
    this.editIndex = index;
    this.editProduct = { ...this.applyMasterImage(product) };
  }

  saveEdit(index: number): void {
    if (this.editIndex === null || !this.editProduct || !this.editProduct.id) {
      return;
    }

    const name = this.editProduct.name.trim();
    const category = this.editProduct.category.trim();
    const quantity = Number(this.editProduct.quantity);
    const price = Number(this.editProduct.price);
    const date = this.editProduct.date;

    if (!name || !category || !date) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    if (quantity <= 0 || price < 0) {
      alert('จำนวนหรือราคาสินค้าไม่ถูกต้อง');
      return;
    }

    const payload = this.toPayload(this.editProduct);

    this.purchaseHistoryService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        const updatedProduct = this.applyMasterImage(
          this.withTotal({
            ...this.editProduct!,
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
      },
      error: (err: unknown) => {
        console.error('แก้ไขข้อมูล purchase history ไม่สำเร็จ', err);
        alert('ไม่สามารถแก้ไขข้อมูลได้');
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!product.id) return;

    const confirmed = window.confirm('ต้องการลบรายการนี้หรือไม่?');
    if (!confirmed) return;

    this.purchaseHistoryService.delete(product.id).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err: unknown) => {
        console.error('ลบข้อมูล purchase history ไม่สำเร็จ', err);
        alert('ไม่สามารถลบข้อมูลได้');
      },
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
    console.log('Export Excel');
  }
}
