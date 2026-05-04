import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';

import { PurchasehistoryService } from '../../../core/services/purchasehistory.service';
import {
  PurchaseService,
  Product as PurchaseProduct,
  ProductMaster,
} from '../../../core/services/purchase.service';

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

export interface ProductOption {
  id: number;
  code?: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  image?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SaleDraftItem {
  id: number;
  code?: string;
  name: string;
  category: string;
  stock: number;
  sellQty: number;
  price: number;
  date: string;
  image?: string;
}

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    MultiSelectModule,
    CheckboxModule,
  ],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  names: SelectOption[] = [];

  categories: SelectOption[] = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  productMasters: ProductMaster[] = [];

  showCreateForm = false;
  isClosing = false;

  showHistoryForm = false;
  isClosingHistory = false;
  isSubmittingHistory = false;

  showImagePreview = false;
  previewImageUrl = '';

  editIndex: number | null = null;
  editProduct: Product | null = null;

  newProduct: Product = this.createEmptyProduct();

  saleForm: {
    productId: number | null;
    qty: number;
  } = {
    productId: null,
    qty: 1,
  };

  saleFormInfo = '';
  saleDraftItems: SaleDraftItem[] = [];

  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly purchasehistoryService: PurchasehistoryService
  ) {}

  ngOnInit(): void {
    this.loadProductMasters();
    this.loadProducts();
  }

  loadProducts(): void {
    this.purchaseService.getAll().subscribe({
      next: (res: PurchaseProduct[]) => {
        this.products = this.mapProductsWithMasterData(
          (res || []).map((p) => this.normalizeProduct(p))
        );
        this.filteredProducts = [...this.products];
      },
      error: (err: unknown) => {
        console.error('loadProducts error:', err);
        Swal.fire({
          icon: 'error',
          title: 'โหลดข้อมูลไม่สำเร็จ',
          text: 'ไม่สามารถดึงข้อมูลรายการสั่งซื้อได้',
        });
      },
    });
  }

  loadProductMasters(): void {
    this.purchaseService.getProductMaster().subscribe({
      next: (list: ProductMaster[]) => {
        this.productMasters = list || [];

        const uniqueNames = Array.from(
          new Set(this.productMasters.map((x) => x.name))
        ).sort();

        this.names = uniqueNames.map((name) => ({
          label: name,
          value: name,
        }));

        if (this.products.length > 0) {
          this.products = this.mapProductsWithMasterData(this.products);
          this.filteredProducts = [...this.products];
        }
      },
      error: (err: unknown) => {
        console.error('loadProductMasters error:', err);
        Swal.fire({
          icon: 'error',
          title: 'โหลดชื่อสินค้าไม่สำเร็จ',
          text: 'ไม่สามารถดึงข้อมูลสินค้าจากหน้า product ได้',
        });
      },
    });
  }

  getMaster(name: string, category?: string): ProductMaster | undefined {
    const normalizedName = (name || '').trim().toLowerCase();
    const normalizedCategory = (category || '').trim().toLowerCase();

    const exact = this.productMasters.find(
      (x) =>
        (x.name || '').trim().toLowerCase() === normalizedName &&
        (x.category || '').trim().toLowerCase() === normalizedCategory
    );

    if (exact) {
      return exact;
    }

    const fallback = this.productMasters.find(
      (x) => (x.name || '').trim().toLowerCase() === normalizedName
    );

    return fallback;
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

  get createProductImage(): string {
    const master = this.getMaster(
      this.newProduct.name,
      this.newProduct.category
    );
    return this.getImageUrl(master?.image);
  }

  get editProductImage(): string {
    if (!this.editProduct) return '';
    const master = this.getMaster(
      this.editProduct.name,
      this.editProduct.category
    );
    return this.getImageUrl(master?.image);
  }

  private applyMasterData(product: Product): Product {
    const master = this.getMaster(product.name, product.category);

    return {
      ...product,
      code: master?.code || product.code || '',
      image: this.getImageUrl(master?.image || product.image),
    };
  }

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

  formatDisplayDate(value: string | Date): string {
    const ymd = this.normalizeYmd(value);
    if (!ymd) return '-';

    const [yyyy, mm, dd] = ymd.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  private withTotal(p: Product): Product {
    const qty = this.toInt(p.quantity, 1);
    const price = this.toInt(p.price, 0);
    const date = this.normalizeYmd(p.date);

    return {
      ...p,
      quantity: qty,
      price,
      date,
      total: qty * price,
    };
  }

  private mapProductsWithMasterData(list: Product[]): Product[] {
    return (list || []).map((p) => this.applyMasterData(this.withTotal(p)));
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

  normalizeProduct(p: Partial<Product>): Product {
    const qty = this.toInt(p.quantity, 0);
    const price = this.toInt(p.price, 0);

    return {
      id: p.id,
      code: p.code ?? '',
      name: p.name ?? '',
      category: p.category ?? '',
      quantity: qty,
      price,
      date: this.normalizeYmd(p.date) || this.todayString(),
      total: qty * price,
      image: this.getImageUrl(p.image),
    };
  }

  onCreateNameChange(selectedName: string): void {
    if (!selectedName) return;

    this.newProduct.name = selectedName;

    const master = this.getMaster(selectedName, this.newProduct.category);

    if (!master) {
      this.newProduct.code = '';
      this.newProduct.price = 0;
      this.newProduct.image = '';
      this.newProduct.total = this.toInt(this.newProduct.quantity, 1) * 0;
      return;
    }

    this.newProduct.code = master.code || '';
    this.newProduct.price = this.toInt(master.price, 0);
    this.newProduct.image = this.getImageUrl(master.image);
    this.newProduct.total =
      this.toInt(this.newProduct.quantity, 1) *
      this.toInt(this.newProduct.price, 0);
  }

  onCreateCancel(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.newProduct = this.createEmptyProduct();
    }, 180);
  }

  onCreateSave(): void {
    if (!this.newProduct.name || !this.newProduct.category) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณาเลือกชื่อสินค้าและประเภท',
      });
      return;
    }

    const payload: Product = {
      code: this.newProduct.code || '',
      name: this.newProduct.name,
      category: this.newProduct.category,
      quantity: this.toInt(this.newProduct.quantity, 1),
      price: this.toInt(this.newProduct.price, 0),
      date: this.normalizeYmd(this.newProduct.date),
      total:
        this.toInt(this.newProduct.quantity, 1) *
        this.toInt(this.newProduct.price, 0),
      image: this.createProductImage || this.newProduct.image || '',
    };

    if (!payload.code) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่พบรหัสสินค้า',
        text: 'กรุณาเลือกชื่อสินค้าและประเภทใหม่อีกครั้ง',
      });
      return;
    }

    this.purchaseService.create(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          text: 'เพิ่มข้อมูลเรียบร้อยแล้ว',
          timer: 1300,
          showConfirmButton: false,
        });

        this.showCreateForm = false;
        this.newProduct = this.createEmptyProduct();
        this.loadProducts();
      },
      error: (err: unknown) => {
        console.error('create error:', err);
        Swal.fire({
          icon: 'error',
          title: 'บันทึกไม่สำเร็จ',
          text: 'ไม่สามารถเพิ่มข้อมูลได้',
        });
      },
    });
  }
  onEdit(index: number): void {
    this.editIndex = index;
    const prepared = this.applyMasterData(
      this.withTotal(this.filteredProducts[index])
    );

    this.editProduct = {
      ...prepared,
      date: this.normalizeYmd(prepared.date),
    };
  }

  onEditNameChange(selectedName: string): void {
    if (!this.editProduct || !selectedName) return;

    const master = this.getMaster(selectedName, this.editProduct.category);
    if (!master) return;

    this.editProduct.name = selectedName;
    this.editProduct.code = master.code || '';
    this.editProduct.price = this.toInt(master.price, 0);
    this.editProduct.image = this.getImageUrl(master.image);
    this.editProduct.total =
      this.toInt(this.editProduct.quantity, 1) *
      this.toInt(this.editProduct.price, 0);
  }

  onCancel(): void {
    this.editIndex = null;
    this.editProduct = null;
  }

  onSave(index: number): void {
    if (!this.editProduct) return;

    if (!this.editProduct.id) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่พบรหัสข้อมูล',
        text: 'ไม่สามารถบันทึกการแก้ไขได้',
      });
      return;
    }

    const payload: Product = this.applyMasterData(
      this.withTotal({
        ...this.editProduct,
        date: this.normalizeYmd(this.editProduct.date),
      })
    );

    this.purchaseService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        this.filteredProducts[index] = { ...payload };

        const originalIndex = this.products.findIndex(
          (p) => p.id === this.editProduct!.id
        );
        if (originalIndex !== -1) {
          this.products[originalIndex] = { ...payload };
        }

        this.editIndex = null;
        this.editProduct = null;

        Swal.fire({
          icon: 'success',
          title: 'แก้ไขสำเร็จ',
          timer: 1200,
          showConfirmButton: false,
        });
      },
      error: (err: unknown) => {
        console.error('update error:', err);
        Swal.fire({
          icon: 'error',
          title: 'แก้ไขไม่สำเร็จ',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
        });
      },
    });
  }

  onDelete(index: number): void {
    const item = this.filteredProducts[index];
    const id = item?.id;

    if (id == null) return;

    Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `ต้องการลบ ${item.name} ใช่หรือไม่`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.purchaseService.delete(id).subscribe({
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
          console.error('delete error:', err);
          Swal.fire({
            icon: 'error',
            title: 'ลบไม่สำเร็จ',
            text: 'ไม่สามารถลบข้อมูลได้',
          });
        },
      });
    });
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

  openHistoryForm(): void {
    this.showHistoryForm = true;
    this.isClosingHistory = false;
    this.resetSaleForm();
  }

  closeHistoryForm(): void {
    this.isClosingHistory = true;
    setTimeout(() => {
      this.showHistoryForm = false;
      this.isClosingHistory = false;
      this.resetSaleForm();
    }, 180);
  }

  resetSaleForm(): void {
    this.saleForm = {
      productId: null,
      qty: 1,
    };
    this.saleFormInfo = '';
  }

  get saleProductOptions(): ProductOption[] {
    const selectedIds = new Set(this.saleDraftItems.map((x) => x.id));

    return this.products
      .filter(
        (p) =>
          !!p.id && this.toInt(p.quantity, 0) > 0 && !selectedIds.has(p.id!)
      )
      .map((p) => ({
        id: p.id!,
        code: p.code ?? '',
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        price: p.price,
        date: p.date,
        image: p.image,
      }));
  }

  get saleFormMax(): number {
    const selected = this.saleProductOptions.find(
      (p) => p.id === this.saleForm.productId
    );
    return selected ? this.toInt(selected.quantity, 0) : 1;
  }

  onSaleProductChange(): void {
    const selected = this.saleProductOptions.find(
      (p) => p.id === this.saleForm.productId
    );

    if (!selected) {
      this.saleFormInfo = '';
      this.saleForm.qty = 1;
      return;
    }

    this.saleForm.qty = 1;
    this.saleFormInfo =
      `คงเหลือ ${this.toInt(selected.quantity, 0)} • ` +
      `ราคา ${this.toInt(selected.price, 0)} บาท • ` +
      `วันที่ ${this.formatDisplayDate(selected.date)}`;
  }

  addSaleItem(): void {
    const selected = this.saleProductOptions.find(
      (p) => p.id === this.saleForm.productId
    );

    if (!selected) {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ได้เลือกสินค้า',
        text: 'กรุณาเลือกชื่อสินค้าก่อน',
      });
      return;
    }

    const qty = this.toInt(this.saleForm.qty, 1);

    if (qty <= 0 || qty > selected.quantity) {
      Swal.fire({
        icon: 'warning',
        title: 'จำนวนไม่ถูกต้อง',
        text: `กรอกจำนวนได้ตั้งแต่ 1 ถึง ${selected.quantity}`,
      });
      return;
    }

    this.saleDraftItems.push({
      id: selected.id,
      code: selected.code ?? '',
      name: selected.name,
      category: selected.category,
      stock: selected.quantity,
      sellQty: qty,
      price: selected.price,
      date: selected.date
        ? this.normalizeYmd(selected.date)
        : this.todayString(),
      image: selected.image,
    });

    this.resetSaleForm();
  }

  updateDraftQty(id: number, value: number): void {
    const item = this.saleDraftItems.find((x) => x.id === id);
    if (!item) return;

    const qty = this.toInt(value, 1);
    item.sellQty = Math.min(Math.max(qty, 1), item.stock);
  }

  removeSaleItem(id: number): void {
    this.saleDraftItems = this.saleDraftItems.filter((x) => x.id !== id);
  }

  confirmSendToHistory(): void {
    const items = [...(this.saleDraftItems || [])];

    if (!items.length) {
      Swal.fire({
        title: 'แจ้งเตือน',
        text: 'ยังไม่มีรายการสั่งซื้อในฟอร์ม',
        icon: 'info',
      });
      return;
    }

    const mapById = new Map<number, Product>(
      this.products.filter((p) => !!p.id).map((p) => [p.id!, p])
    );

    const invalid = items.find((it) => {
      const p = mapById.get(it.id);
      const stockNow = p ? this.toInt(p.quantity, 0) : 0;
      return it.sellQty < 1 || it.sellQty > stockNow;
    });

    if (invalid) {
      Swal.fire({
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'มีรายการที่จำนวนสั่งซื้อเกินสต๊อกหรือไม่ถูกต้อง กรุณาตรวจสอบ',
        icon: 'warning',
      });
      return;
    }

    Swal.fire({
      title: `ยืนยันส่งไปประวัติการสั่งซื้อ\n${items.length} รายการ?`,
      html: `ข้อมูลจะถูกบันทึกและตัดสต๊อก 
    <span style="color:#ef4444; font-weight:700;">ตามจำนวนที่ระบุ</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.submitHistory();
    });
  }

  submitHistory(): void {
    this.isSubmittingHistory = true;

    const jobs = this.saleDraftItems.map((item) => {
      const source = this.products.find((p) => p.id === item.id);

      if (!source) {
        throw new Error(`ไม่พบสินค้า id=${item.id}`);
      }

      const newQty =
        this.toInt(source.quantity, 0) - this.toInt(item.sellQty, 0);

      const historyPayload = {
        code: item.code || '',
        name: item.name,
        category: item.category,
        quantity: item.sellQty,
        price: item.price,
        date: this.todayString(),
        image: item.image || '',
      };

      const updatePayload: Product = {
        ...source,
        quantity: newQty,
        total: newQty * this.toInt(source.price, 0),
        date: this.normalizeYmd(source.date),
      };

      return forkJoin([
        this.purchasehistoryService.create(historyPayload),
        this.purchaseService.update(source.id!, updatePayload),
      ]);
    });

    forkJoin(jobs).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกประวัติสำเร็จ',
          text: 'ส่งข้อมูลไปยังประวัติการสั่งซื้อและตัดจำนวนเรียบร้อยแล้ว',
          timer: 1400,
          showConfirmButton: false,
        });

        this.isSubmittingHistory = false;
        this.saleDraftItems = [];
        this.closeHistoryForm();
        this.loadProducts();
      },
      error: (err: unknown) => {
        console.error('submit purchase history error:', err);
        this.isSubmittingHistory = false;

        Swal.fire({
          icon: 'error',
          title: 'ส่งข้อมูลไม่สำเร็จ',
          text: 'ไม่สามารถบันทึกประวัติการสั่งซื้อได้',
        });
      },
    });
  }
}
