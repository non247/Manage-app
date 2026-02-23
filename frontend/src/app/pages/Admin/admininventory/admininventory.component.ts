import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import {
  InventoryService,
  ProductMaster,
} from '../../../core/services/Inventory.service';
import { HistoryService } from '../../../core/services/history.service';

// ✅ เพิ่ม RXJS สำหรับยิงหลายรายการทีเดียว
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

/* ================= INTERFACE ================= */
export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string; // ✅ ใช้ string ป้องกัน timezone
  total?: number; // ✅ ราคารวม
}

type Option = { label: string; value: string };

type SaleDraftItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sellQty: number;
  date: string;
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [TableModule, MultiSelectModule, FormsModule, CommonModule],
  templateUrl: './admininventory.component.html',
  styleUrl: './admininventory.component.scss',
})
export class AdminInventoryComponent implements OnInit {
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

  // ✅ options ชื่อสินค้า
  names: Option[] = [];

  // ✅ master
  productMasters: ProductMaster[] = [];

  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  loading = false;

  // ==========================
  // ✅ HISTORY FORM (NEW)
  // ==========================
  showHistoryForm = false;
  isClosingHistory = false;
  isSubmittingHistory = false;

  saleDraftItems: SaleDraftItem[] = [];

  saleForm: { productId: number | null; qty: number } = {
    productId: null,
    qty: 1,
  };

  saleFormInfo = '';

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly historyService: HistoryService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadProductMasters();
  }

  /* ================= INT ONLY ================= */
  toInt(value: any, min = 0): number {
    const n = Math.floor(Number(value) || 0);
    return n < min ? min : n;
  }

  /* ================= TOTAL HELPERS ================= */
  private withTotal(p: Product): Product {
    const qty = this.toInt(p.quantity, 1);
    const price = this.toInt(p.price, 0);
    const date = this.normalizeYmd(p.date);
    return { ...p, quantity: qty, price, date, total: qty * price };
  }

  private mapWithTotal(list: Product[]): Product[] {
    return (list || []).map((p) => this.withTotal(p));
  }

  /* ================= GO HISTORY PAGE (OPTIONAL) ================= */
  goToHistory() {
    const items = this.mapWithTotal(this.filteredProducts);
    this.router.navigate(['/history'], { state: { items } });
  }

  /* ================= LOAD ================= */
  loadProducts() {
    this.inventoryService.getAll().subscribe({
      next: (res) => {
        this.products = this.mapWithTotal(res);
        this.filteredProducts = [...this.products];
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

  loadProductMasters() {
    this.inventoryService.getProductMaster().subscribe({
      next: (list: ProductMaster[]) => {
        this.productMasters = list;
        const uniqueNames = Array.from(new Set(list.map((x) => x.name))).sort();
        this.names = uniqueNames.map((name) => ({ label: name, value: name }));
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'โหลดชื่อสินค้าจากหน้า product ไม่สำเร็จ',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        }),
    });
  }

  /* ================= AUTO FILL PRICE ================= */
  onCreateNameChange(selectedName: string) {
    if (!selectedName) return;
    const master = this.productMasters.find((x) => x.name === selectedName);
    if (!master) return;

    this.newProduct.price = this.toInt(master.price, 0);
    this.newProduct.total =
      this.toInt(this.newProduct.quantity, 1) *
      this.toInt(this.newProduct.price, 0);
  }

  onEditNameChange(selectedName: string) {
    if (!this.editProduct) return;
    if (!selectedName) return;

    const master = this.productMasters.find((x) => x.name === selectedName);
    if (!master) return;

    this.editProduct.price = this.toInt(master.price, 0);
    this.editProduct.total =
      this.toInt(this.editProduct.quantity, 1) *
      this.toInt(this.editProduct.price, 0);
  }

  /* ================= FILTER ================= */
  filterProducts() {
    if (this.selectedCategories.length === 0) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.mapWithTotal(
        this.products.filter((p) =>
          this.selectedCategories.includes(p.category)
        )
      );
    }
  }

  /* ================= CREATE ================= */
  onCreate() {
    if (this.editIndex !== null) return;
    this.showCreateForm = true;
  }

  onCreateSave() {
    this.newProduct.quantity = this.toInt(this.newProduct.quantity, 1);
    this.newProduct.price = this.toInt(this.newProduct.price, 0);
    this.newProduct.date = this.normalizeYmd(this.newProduct.date);
    this.newProduct.total = this.newProduct.quantity * this.newProduct.price;

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

    const payload: Product = this.withTotal({
      ...this.newProduct,
      code: 'P' + Date.now(),
      date: this.normalizeYmd(this.newProduct.date),
    });

    this.inventoryService.create(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.onCreateCancel();
        Swal.fire({
          title: 'สำเร็จ',
          text: 'สร้างรายการสำเร็จ',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
        });
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถสร้างรายการได้',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'ตกลง',
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

  /* ================= SELL ONE (ยังใช้ได้ ถ้าคุณมีปุ่มขายทีละชิ้นที่อื่น) ================= */
  sellOne(p: Product, qty = 1) {
    if (!p.id) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'ไม่พบ ID ของสินค้า',
        icon: 'error',
      });
      return;
    }

    const currentQty = this.toInt(p.quantity, 0);
    if (currentQty <= 0) {
      Swal.fire({
        title: 'สินค้าหมด',
        text: 'ไม่สามารถขายได้',
        icon: 'warning',
      });
      return;
    }

    const sellQty = Math.min(this.toInt(qty, 1), currentQty);

    const historyPayload = this.safeHistoryPayload(p, sellQty);

    this.historyService.create(historyPayload as any).subscribe({
      next: () => {
        const remaining = currentQty - sellQty;
        const updated: Product = this.withTotal({ ...p, quantity: remaining });

        this.inventoryService.update(p.id!, updated).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire(
              'สำเร็จ',
              `บันทึกการขายแล้ว (ตัด ${sellQty} ชิ้น)`,
              'success'
            );
          },
          error: () =>
            Swal.fire({
              title: 'ผิดพลาด',
              text: 'อัปเดตสต๊อกไม่สำเร็จ',
              icon: 'error',
            }),
        });
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'บันทึกประวัติการขายไม่สำเร็จ',
          icon: 'error',
        }),
    });
  }

  // ==========================================================
  // ✅ HISTORY FORM : เลือกสินค้า + ใส่จำนวน + เพิ่มรายการ
  // ==========================================================

  /** dropdown options: เอาเฉพาะรายการที่มี id และ stock > 0 */
  get saleProductOptions(): Product[] {
    return (this.products || []).filter(
      (p) => !!p.id && this.toInt(p.quantity, 0) > 0
    );
  }

  /** ✅ dropdown options: เอารายการที่ "ยังไม่ถูกเพิ่มใน draft" */
  get availableSaleProducts(): Product[] {
    const selectedIds = new Set(this.saleDraftItems.map((x) => x.id));
    return this.saleProductOptions.filter((p) => !selectedIds.has(p.id!));
  }

  /** max ของ qty ในช่อง input */
  get saleFormMax(): number {
    const p = this.getProductById(this.saleForm.productId);
    return p ? this.toInt(p.quantity, 0) : 1;
  }

  /** ยอดรวมในฟอร์ม */
  get saleDraftTotal(): number {
    return this.saleDraftItems.reduce(
      (sum, it) => sum + it.sellQty * it.price,
      0
    );
  }

  openHistoryForm() {
    this.showHistoryForm = true;
    this.saleFormInfo = '';
    this.saleForm = { productId: null, qty: 1 };
  }

  closeHistoryForm() {
    this.isClosingHistory = true;
    setTimeout(() => {
      this.showHistoryForm = false;
      this.isClosingHistory = false;
    }, 250);
  }

  onSaleProductChange() {
    const p = this.getProductById(this.saleForm.productId);
    if (!p) {
      this.saleFormInfo = '';
      return;
    }
    this.saleForm.qty = 1;
    this.saleFormInfo = `คงเหลือ ${this.toInt(p.quantity, 0)} • ราคา ${this.toInt(
      p.price,
      0
    )} บาท`;
  }

  addSaleItem() {
    const p = this.getProductById(this.saleForm.productId);
    if (!p || !p.id) {
      Swal.fire({
        title: 'แจ้งเตือน',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
        text: 'กรุณาเลือกสินค้า',
        icon: 'info',
      });
      return;
    }

    const stock = this.toInt(p.quantity, 0);
    if (stock <= 0) {
      Swal.fire({
        title: 'สินค้าหมด',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
        text: 'รายการนี้สต๊อกเป็น 0',
        icon: 'warning',
      });
      return;
    }

    const qty = this.toInt(this.saleForm.qty, 1);
    if (qty > stock) {
      Swal.fire({
        title: 'จำนวนเกินสต๊อก',
        confirmButtonColor: '#3085d6',
        text: `คงเหลือ ${stock} ชิ้น`,
        icon: 'warning',
      });
      return;
    }

    // ✅ กันเพิ่มซ้ำ (เพราะเราต้องการให้หายจาก dropdown)
    const existing = this.saleDraftItems.find((x) => x.id === p.id);
    if (existing) {
      Swal.fire({
        title: 'เพิ่มแล้ว',
        text: 'สินค้านี้ถูกเพิ่มในรายการแล้ว (ลบออกก่อน หากต้องการเลือกใหม่)',
        icon: 'info',
      });
      return;
    }

    this.saleDraftItems.push({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      price: this.toInt(p.price, 0),
      stock,
      sellQty: qty,
      date: p.date ? this.normalizeYmd(p.date) : this.todayString(),
    });

    // reset ช่องกรอกเพื่อเพิ่มรายการถัดไป
    this.saleForm = { productId: null, qty: 1 };
    this.saleFormInfo = '';
  }

  removeSaleItem(id: number) {
    this.saleDraftItems = this.saleDraftItems.filter((x) => x.id !== id);
  }

  updateDraftQty(id: number, value: any) {
    const it = this.saleDraftItems.find((x) => x.id === id);
    if (!it) return;

    let v = this.toInt(value, 1);
    if (v > it.stock) v = it.stock;
    if (it.stock <= 0) v = 0;

    it.sellQty = v;
  }

  /** ✅ ยืนยันส่ง: ส่งเข้า history + ตัดสต๊อก */
  confirmSendToHistory() {
    const items = [...(this.saleDraftItems || [])];

    if (!items.length) {
      Swal.fire({
        title: 'แจ้งเตือน',
        text: 'ยังไม่มีรายการขายในฟอร์ม',
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
        text: 'มีรายการที่จำนวนขายเกินสต๊อกหรือไม่ถูกต้อง กรุณาตรวจสอบ',
        icon: 'warning',
      });
      return;
    }

    Swal.fire({
      title: `ยืนยันส่งไปประวัติ\n${items.length} รายการ?`,
      html: `ข้อมูลจะถูกบันทึกและตัดสต๊อก 
      <span style="color:#ef4444; font-weight:700;">
      ตามจำนวนที่ระบุ`,
      text: 'ข้อมูลจะถูกบันทึกและตัดสต๊อกทันที',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isSubmittingHistory = true;
      this.loading = true;

      const jobs = items.map((it) => {
        const p = mapById.get(it.id);
        if (!p || !p.id)
          return of({ ok: false as const, name: it.name, code: it.code });

        const currentQty = this.toInt(p.quantity, 0);
        const sellQty = Math.min(this.toInt(it.sellQty, 1), currentQty);

        if (sellQty <= 0) {
          return of({ ok: false as const, name: it.name, code: it.code });
        }

        const historyPayload = this.safeHistoryPayload(p, sellQty);

        return this.historyService.create(historyPayload as any).pipe(
          switchMap(() => {
            const remaining = currentQty - sellQty;
            const updated: Product = this.withTotal({
              ...p,
              quantity: remaining,
            });
            return this.inventoryService.update(p.id!, updated);
          }),
          map(() => ({ ok: true as const, name: it.name, code: it.code })),
          catchError((err) => {
            console.error('history form sell fail:', it, err);
            return of({ ok: false as const, name: it.name, code: it.code });
          })
        );
      });

      forkJoin(jobs)
        .pipe(
          finalize(() => {
            this.isSubmittingHistory = false;
            this.loading = false;
          })
        )
        .subscribe((results) => {
          const successCount = results.filter((x) => x.ok).length;
          const failList = results.filter((x) => !x.ok);

          this.saleDraftItems = [];
          this.closeHistoryForm();
          this.loadProducts();

          if (failList.length === 0) {
            Swal.fire({
              title: 'สำเร็จ',
              text: `ส่งไปประวัติการขายแล้ว ${successCount} รายการ`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            });
          } else {
            const failText = failList
              .slice(0, 8)
              .map((x) => `• ${x.name} (${x.code})`)
              .join('<br/>');

            Swal.fire({
              icon: 'warning',
              title: 'ทำรายการสำเร็จบางส่วน',
              html: `
                <div style="text-align:left">
                  สำเร็จ: <b>${successCount}</b> รายการ<br/>
                  ไม่สำเร็จ: <b>${failList.length}</b> รายการ
                  <hr/>
                  ${failText}
                  ${failList.length > 8 ? '<br/>…' : ''}
                </div>
              `,
            });
          }
        });
    });
  }

  private getProductById(id: number | null): Product | null {
    if (!id) return null;
    return this.products.find((p) => p.id === id) ?? null;
  }

  /* ================= HISTORY PAYLOAD ================= */
  private safeHistoryPayload(p: Product, qty: number) {
    return {
      code: 'H' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: p.name,
      category: p.category,
      quantity: qty,
      price: this.toInt(p.price, 0),
      date: p.date ? this.normalizeYmd(p.date) : this.todayString(),
    };
  }

  /* ================= EDIT ================= */
  onEdit(index: number) {
    if (this.showCreateForm) return;

    const p = this.filteredProducts[index];
    this.editIndex = index;

    const prepared = this.withTotal(p);
    this.editProduct = { ...prepared, date: this.normalizeYmd(prepared.date) };
  }

  onSave(index: number) {
    if (!this.editProduct?.id) return;

    const payload: Product = this.withTotal({
      ...this.editProduct,
      date: this.normalizeYmd(this.editProduct.date),
    });

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
          text: 'อัปเดตข้อมูลเรียบร้อย',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
      },
      error: () =>
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'อัปเดตข้อมูลไม่สำเร็จ',
          icon: 'error',
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
        error: () =>
          Swal.fire({
            title: 'ผิดพลาด',
            text: 'ลบรายการไม่สำเร็จ',
            icon: 'error',
          }),
      });
    });
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

  private todayString(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  }

  /* ================= UTILS ================= */
  private getEmptyProduct(): Product {
    const p: Product = {
      code: '',
      name: '',
      category: '',
      quantity: 1,
      price: 0,
      date: this.todayString(),
      total: 0,
    };
    return this.withTotal(p);
  }

  private isValidProduct(p: Product): boolean {
    return !!(
      p.name &&
      p.category &&
      p.quantity >= 1 &&
      p.price >= 0 &&
      p.date
    );
  }
}
