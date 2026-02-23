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

// ✅ RXJS
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

  // ✅ selection
  selectedProducts: Product[] = [];
  selectedIds = new Set<number>();

  // ✅ options ชื่อสินค้า
  names: Option[] = [];

  // ✅ master
  productMasters: ProductMaster[] = [];

  // ✅ จำนวนที่จะขาย/ตัด ต่อรายการ (กรอกจากตาราง)
  sellQtyById: Record<number, number> = {};

  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  loading = false;

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

  /* ================= SELL QTY HELPERS ================= */
  private getSellQty(p: Product): number {
    if (!p.id) return 0;
    const raw = this.sellQtyById[p.id] ?? 1;
    return this.toInt(raw, 1);
  }

  /** ✅ ตั้งค่า default = 1 ให้ทุกตัว หลังโหลด */
  private seedSellQtyDefaults(list: Product[]) {
    for (const p of list) {
      if (p.id && this.sellQtyById[p.id] == null) {
        this.sellQtyById[p.id] = 1;
      }
    }
  }

  /** ✅ กันค่าว่างเวลาติ๊กเลือก */
  ensureSellQty(p: Product) {
    if (!p.id) return;
    if (this.sellQtyById[p.id] == null) this.sellQtyById[p.id] = 1;
  }

  /** ✅ กัน 0/ติดลบ/เกินสต๊อก ตอนกรอก input */
  onSellQtyInput(p: Product) {
    if (!p.id) return;

    const max = this.toInt(p.quantity, 0);
    let v = this.toInt(this.sellQtyById[p.id], 1);

    if (max <= 0) v = 0;
    if (v > max) v = max;

    this.sellQtyById[p.id] = v;
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

        // ✅ default จำนวนที่จะตัด = 1
        this.seedSellQtyDefaults(this.products);

        // ✅ เคลียร์ selection หลัง reload
        this.selectedIds.clear();
        this.selectedProducts = [];
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

    // ✅ เคลียร์ selection เมื่อ filter เปลี่ยน
    this.selectedIds.clear();
    this.selectedProducts = [];
  }

  /* ================= CHECKBOX (CUSTOM) ================= */
  isSelected(p: Product): boolean {
    return !!p.id && this.selectedIds.has(p.id);
  }

  toggleRow(p: Product, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    if (!p.id) return;

    // ✅ กันค่าว่าง
    this.ensureSellQty(p);

    if (checked) this.selectedIds.add(p.id);
    else this.selectedIds.delete(p.id);

    this.syncSelectedProducts();
  }

  toggleSelectAll(ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;

    const rows = this.filteredProducts.filter((p) => !!p.id);
    const ids = rows.map((p) => p.id!) as number[];

    if (checked) {
      rows.forEach((p) => this.ensureSellQty(p));
      ids.forEach((id) => this.selectedIds.add(id));
    } else {
      ids.forEach((id) => this.selectedIds.delete(id));
    }

    this.syncSelectedProducts();
  }

  isAllSelected(): boolean {
    const ids = this.filteredProducts.filter((p) => !!p.id).map((p) => p.id!);
    return ids.length > 0 && ids.every((id) => this.selectedIds.has(id));
  }

  isIndeterminate(): boolean {
    const ids = this.filteredProducts.filter((p) => !!p.id).map((p) => p.id!);
    const selectedCount = ids.filter((id) => this.selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }

  private syncSelectedProducts() {
    const mapById = new Map<number, Product>(
      this.products.filter((p) => !!p.id).map((p) => [p.id!, p])
    );

    this.selectedProducts = Array.from(this.selectedIds)
      .map((id) => mapById.get(id))
      .filter((p): p is Product => !!p);
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

  /* ================= SELL ONE (CUT BY QTY) ================= */
  sellOne(p: Product) {
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

    this.ensureSellQty(p);

    const wantSell = this.getSellQty(p);
    const sellQty = Math.min(wantSell, currentQty);

    if (sellQty <= 0) {
      Swal.fire({
        title: 'แจ้งเตือน',
        text: 'จำนวนขายต้องมากกว่า 0',
        icon: 'info',
      });
      return;
    }

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

  /* ================= BULK SELL (CUT BY QTY) ================= */
  sendSelectedToHistory() {
    const selected = [...(this.selectedProducts || [])];

    if (!selected.length) {
      Swal.fire({
        title: 'แจ้งเตือน',
        text: 'กรุณาเลือกสินค้าก่อน',
        icon: 'info',
      });
      return;
    }

    const noId = selected.filter((p) => !p.id);
    if (noId.length) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'มีบางรายการไม่มี ID',
        icon: 'error',
      });
      return;
    }

    const outOfStock = selected.filter((p) => this.toInt(p.quantity, 0) <= 0);
    if (outOfStock.length) {
      Swal.fire({
        title: 'สินค้าหมด',
        text: `มี ${outOfStock.length} รายการที่จำนวนเป็น 0 (ยกเลิกการเลือกก่อน)`,
        icon: 'warning',
      });
      return;
    }

    // ✅ เช็คจำนวนขายห้ามเกินสต๊อก
    const overSell = selected.filter((p) => {
      this.ensureSellQty(p);
      const currentQty = this.toInt(p.quantity, 0);
      const sellQty = this.getSellQty(p);
      return sellQty > currentQty;
    });

    if (overSell.length) {
      Swal.fire({
        title: 'จำนวนขายเกินสต๊อก',
        html: `
          <div style="text-align:left">
            มี <b>${overSell.length}</b> รายการที่จำนวนขายมากกว่าสต๊อก<br/>
            กรุณาปรับจำนวนขายให้ไม่เกินจำนวนคงเหลือ
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    Swal.fire({
      title: `ยืนยันส่งไปหน้าประวัติ\n${selected.length} รายการ?`,
      html: '<span>ระบบจะตัดตาม <b style="color:#d81b60;">จำนวนตัด</b> ของแต่ละรายการ และบันทึกลงประวัติการขาย</span>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.loading = true;

      const jobs = selected.map((p) => {
        const currentQty = this.toInt(p.quantity, 0);

        this.ensureSellQty(p);

        const wantSell = this.getSellQty(p);
        const sellQty = Math.min(wantSell, currentQty);

        if (sellQty <= 0) {
          return of({ ok: false as const, code: p.code, name: p.name });
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
          map(() => ({ ok: true as const, code: p.code, name: p.name })),
          catchError((err) => {
            console.error('bulk sell fail:', p, err);
            return of({ ok: false as const, code: p.code, name: p.name });
          })
        );
      });

      forkJoin(jobs)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((results) => {
          const successCount = results.filter((x) => x.ok).length;
          const failList = results.filter((x) => !x.ok);

          this.selectedIds.clear();
          this.selectedProducts = [];
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
