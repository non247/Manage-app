import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import {
  HistoryService,
  ProductMaster,
} from '../../../core/services/history.service';

/* ================= INTERFACE ================= */
export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  total?: number;
  image?: string;
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
  styleUrls: ['./history.component.scss'],
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
  productMasters: ProductMaster[] = [];

  // ===== CHECKBOX =====
  selectedProducts: Product[] = [];

  // ===== IMAGE PREVIEW =====
  showImagePreview = false;
  previewImageUrl = '';

  // ===== CATEGORY OPTIONS =====
  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor(
    private readonly historyService: HistoryService,
    private readonly router: Router
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadProductMasters();

    if (this.isBrowser) {
      const items = history.state?.items as Product[] | undefined;

      if (Array.isArray(items) && items.length > 0) {
        const normalized = this.withTotal(items);
        const aggregated = this.aggregateProducts(normalized);

        this.products = this.mapProductsWithMasterImage(aggregated);
        this.filteredProducts = [...this.products];
        return; // ✅ Stop here if we got items from history
      }
    }

    this.loadProducts();
  }

  /* ================= IMAGE HELPERS ================= */
  private getMasterByName(name: string): ProductMaster | undefined {
    return this.productMasters.find((x) => x.name === name);
  }

  getImageUrl(image?: string): string {
    if (!image) return '';

    const cleaned = image.trim().replaceAll('\\', '/');

    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      return cleaned;
    }

    if (cleaned.startsWith('/uploads/')) {
      return cleaned; // ✅ already has leading slash
    }

    if (cleaned.startsWith('uploads/')) {
      return `/${cleaned}`; // ✅ add leading slash
    }

    return `/uploads/${cleaned}`; // ✅ use proxy path
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

  openImagePreview(url?: string): void {
    if (!url) return;
    this.previewImageUrl = url;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImageUrl = '';
  }

  /* ================= TOTAL NORMALIZER ================= */
  private withTotal(list: Product[]): Product[] {
    return (list || []).map((x) => {
      const quantity = Number((x as any).quantity ?? 0) || 0;
      const price = Number((x as any).price ?? 0) || 0;
      const date = this.normalizeYmd((x as any).create_date ?? (x as any).date);

      return {
        ...x,
        quantity,
        price,
        date,
        total: quantity * price,
      };
    });
  }

  /* ================= AGGREGATE DUPLICATES ================= */
  private aggregateProducts(list: Product[]): Product[] {
    const map = new Map<string, Product>();

    for (const item of list) {
      const normalized: Product = {
        ...item,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        date: this.normalizeYmd(item.date),
        total: (Number(item.quantity) || 0) * (Number(item.price) || 0),
      };

      const key = [
        normalized.date,
        normalized.name?.trim().toLowerCase(),
        normalized.category?.trim().toLowerCase(),
        Number(normalized.price) || 0,
      ].join('|');

      const existing = map.get(key);

      if (existing) {
        existing.quantity =
          (Number(existing.quantity) || 0) + (Number(normalized.quantity) || 0);

        existing.total =
          (Number(existing.quantity) || 0) * (Number(existing.price) || 0);

        if (!existing.image && normalized.image) {
          existing.image = normalized.image;
        }

        if (!existing.id && normalized.id) {
          existing.id = normalized.id;
        }

        if (!existing.code && normalized.code) {
          existing.code = normalized.code;
        }
      } else {
        map.set(key, { ...normalized });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /* ================= LOAD ================= */
  loadProducts(): void {
    this.historyService.getAll().subscribe({
      next: (res) => {
        const normalized = this.withTotal(res || []);
        const aggregated = this.aggregateProducts(normalized);

        this.products = this.mapProductsWithMasterImage(aggregated);
        this.filteredProducts = [...this.products];

        this.selectedProducts = this.selectedProducts.filter((s) =>
          this.filteredProducts.some((p) => this.sameRow(p, s))
        );
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'โหลดข้อมูลไม่สำเร็จ',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        }),
    });
  }

  loadProductMasters(): void {
    this.historyService.getProductMaster().subscribe({
      next: (list) => {
        this.productMasters = list || [];

        if (this.products.length > 0) {
          this.products = this.mapProductsWithMasterImage(this.products);
          this.filteredProducts = [...this.products];
        }
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'โหลดรูปสินค้าจากหน้า product ไม่สำเร็จ',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        }),
    });
  }

  /* ================= FILTER ================= */
  filterProducts(): void {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter((p) =>
        this.selectedCategories.includes(p.category)
      );
    }

    this.selectedProducts = this.selectedProducts.filter((s) =>
      this.filteredProducts.some((p) => this.sameRow(p, s))
    );
  }

  /* ================= CREATE ================= */
  onCreate(): void {
    if (this.editIndex !== null) return;
    this.showCreateForm = true;
  }

  onCreateNameChange(selectedName: string): void {
    if (!selectedName) return;
    this.newProduct.name = selectedName;

    const master = this.getMasterByName(selectedName);
    if (!master) {
      this.newProduct.code = '';
      this.newProduct.price = 0;
      this.newProduct.category = this.newProduct.category || '';
      return;
    }

    this.newProduct.code = master.code || '';
    this.newProduct.price = Number(master.price) || 0;
    if (master.category) {
      this.newProduct.category = master.category;
    }
  }

  onCreateSave(): void {
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

    const quantity = Number((this.newProduct as any).quantity ?? 0) || 0;
    const price = Number((this.newProduct as any).price ?? 0) || 0;

    const payload: Product = {
      ...this.newProduct,
      quantity,
      price,
      total: quantity * price,
      code: this.newProduct.code || '',
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

  onCreateCancel(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.newProduct = this.getEmptyProduct();
    }, 250);
  }

  /* ================= EDIT ================= */
  onEdit(index: number): void {
    if (this.showCreateForm) return;

    const p = this.filteredProducts[index];
    this.editIndex = index;

    this.editProduct = {
      ...this.applyMasterImage(p),
      date: this.normalizeYmd(p.date),
      total: (Number(p.quantity) || 0) * (Number(p.price) || 0),
    };
  }

  onSave(index: number): void {
    if (!this.editProduct?.id) return;

    const quantity = Number((this.editProduct as any).quantity ?? 0) || 0;
    const price = Number((this.editProduct as any).price ?? 0) || 0;

    const payload: Product = this.applyMasterImage({
      ...this.editProduct,
      quantity,
      price,
      date: this.normalizeYmd(this.editProduct.date),
      total: quantity * price,
    });

    this.historyService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        this.loadProducts();
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
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        }),
    });
  }

  onCancel(): void {
    this.editIndex = null;
    this.editProduct = null;
  }

  /* ================= DELETE ================= */
  onDelete(index: number): void {
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
        error: () =>
          Swal.fire({
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
  private sameRow(a: Product, b: Product): boolean {
    if (a?.id != null && b?.id != null) return a.id === b.id;
    return a.code === b.code;
  }

  isSelected(p: Product): boolean {
    return this.selectedProducts.some((x) => this.sameRow(x, p));
  }

  toggleRow(p: Product, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.isSelected(p)) {
        this.selectedProducts = [...this.selectedProducts, p];
      }
    } else {
      this.selectedProducts = this.selectedProducts.filter(
        (x) => !this.sameRow(x, p)
      );
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedProducts = checked ? [...this.filteredProducts] : [];
  }

  isAllSelected(): boolean {
    return (
      this.filteredProducts.length > 0 &&
      this.selectedProducts.length === this.filteredProducts.length
    );
  }

  isIndeterminate(): boolean {
    return (
      this.selectedProducts.length > 0 &&
      this.selectedProducts.length < this.filteredProducts.length
    );
  }

  /* ================= EXPORT ================= */
  exportToExcel(): void {
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
      วันที่: this.formatThDate(p.date),
      ชื่อสินค้า: p.name,
      หมวดหมู่: p.category,
      จำนวน: p.quantity,
      ราคา: p.price,
      ราคารวม: p.total ?? (Number(p.quantity) || 0) * (Number(p.price) || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'History');
    XLSX.writeFile(wb, 'History.xlsx');
  }

  /* ================= DATE HELPERS ================= */
  private normalizeYmd(date: string | Date): string {
    if (!date) return this.todayString();

    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [dd, mm, yyyy] = date.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    const d = new Date(date);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  }

  private formatThDate(date: string | Date): string {
    const ymd = this.normalizeYmd(date);
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
      total: 0,
      image: '',
    };
  }

  private todayString(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
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
