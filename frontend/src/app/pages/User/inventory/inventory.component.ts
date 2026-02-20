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

// ✅ type สำหรับ option ของ dropdown/multiselect
type Option = { label: string; value: string };

@Component({
  selector: 'app-inventory',
  standalone: true,
  // ❌ ไม่ต้องใช้ CheckboxModule แล้ว (เพราะใช้ checkbox ธรรมดา)
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

  // ✅ selection (ใช้กับปุ่มส่ง history เหมือนเดิม)
  selectedProducts: Product[] = [];

  // ✅ เก็บ id ที่เลือก (checkbox ธรรมดา)
  selectedIds = new Set<number>();

  // ✅ options ชื่อสินค้า (ใช้ใน select)
  names: Option[] = [];

  // ✅ เก็บ master ทั้งก้อน เพื่อเอา price มาเติมอัตโนมัติ
  productMasters: ProductMaster[] = [];

  categories = [
    { label: 'โคน', value: 'โคน' },
    { label: 'ถ้วย', value: 'ถ้วย' },
  ];

  loading = false; // (ถ้าใช้ [loading] ใน p-table)

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly historyService: HistoryService,
    private readonly router: Router
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.loadProducts();
    this.loadProductMasters();
  }

  /* ================= INT ONLY (REMOVE DECIMALS) ================= */
  toInt(value: any, min = 0): number {
    const n = Math.floor(Number(value) || 0);
    return n < min ? min : n;
  }

  /* ================= TOTAL HELPERS ================= */
  private withTotal(p: Product): Product {
    const qty = this.toInt(p.quantity, 1);
    const price = this.toInt(p.price, 0);
    return { ...p, quantity: qty, price, total: qty * price };
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

        // ✅ กัน selection ค้างหลัง reload
        this.selectedIds.clear();
        this.selectedProducts = [];
      },
      error: () => Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error'),
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
        Swal.fire('ผิดพลาด', 'โหลดชื่อสินค้าจากหน้า product ไม่สำเร็จ', 'error'),
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
        this.products.filter((p) => this.selectedCategories.includes(p.category))
      );
    }

    // ✅ ตัวเลือก A: เคลียร์ selection เมื่อ filter เปลี่ยน (กันงง)
    this.selectedIds.clear();
    this.selectedProducts = [];

    // ✅ ตัวเลือก B: ถ้าอยาก "ไม่เคลียร์" ให้คอมเมนต์ 2 บรรทัดข้างบน
    // แล้วเรียก this.syncSelectedProducts(); เพื่อให้ selectedProducts ยังตรงกับ selectedIds
  }

  /* ================= CHECKBOX (CUSTOM) ================= */
  isSelected(p: Product): boolean {
    return !!p.id && this.selectedIds.has(p.id);
  }

  toggleRow(p: Product, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    if (!p.id) return;

    if (checked) this.selectedIds.add(p.id);
    else this.selectedIds.delete(p.id);

    this.syncSelectedProducts();
  }

  toggleSelectAll(ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;

    const ids = this.filteredProducts
      .filter((p) => !!p.id)
      .map((p) => p.id!) as number[];

    if (checked) ids.forEach((id) => this.selectedIds.add(id));
    else ids.forEach((id) => this.selectedIds.delete(id));

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
    // ใช้ products เป็นแหล่งจริง (กันกรณี filter แล้วหา object ไม่เจอ)
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
    this.newProduct.total = this.newProduct.quantity * this.newProduct.price;

    if (!this.isValidProduct(this.newProduct)) {
      Swal.fire('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ', 'error');
      return;
    }

    const payload: Product = this.withTotal({
      ...this.newProduct,
      code: 'P' + Date.now(),
    });

    this.inventoryService.create(payload).subscribe({
      next: () => {
        this.loadProducts();
        this.onCreateCancel();
        Swal.fire('สำเร็จ', 'สร้างรายการสำเร็จ', 'success');
      },
      error: () => Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างรายการได้', 'error'),
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

  /* ================= SELL (MODE A) ================= */
  sellOne(p: Product) {
    if (!p.id) {
      Swal.fire('ผิดพลาด', 'ไม่พบ ID ของสินค้า', 'error');
      return;
    }

    const currentQty = this.toInt(p.quantity, 0);
    if (currentQty <= 0) {
      Swal.fire('สินค้าหมด', 'ไม่สามารถขายได้', 'warning');
      return;
    }

    const historyPayload = this.safeHistoryPayload(p);

    this.historyService.create(historyPayload as any).subscribe({
      next: () => {
        const updated: Product = { ...p, quantity: currentQty - 1 };

        this.inventoryService.update(p.id!, updated).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire('สำเร็จ', 'บันทึกการขายแล้ว', 'success');
          },
          error: () =>
            Swal.fire('ผิดพลาด', 'บันทึก history ได้ แต่ตัดสต๊อกไม่สำเร็จ', 'error'),
        });
      },
      error: () => Swal.fire('ผิดพลาด', 'บันทึกประวัติการขายไม่สำเร็จ', 'error'),
    });
  }

  /* ================= SEND SELECTED TO HISTORY (BULK) ================= */
  sendSelectedToHistory() {
    const selected = [...(this.selectedProducts || [])];

    if (!selected.length) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกสินค้าก่อน', 'info');
      return;
    }

    const noId = selected.filter((p) => !p.id);
    if (noId.length) {
      Swal.fire('ผิดพลาด', 'มีบางรายการไม่มี ID (แก้ที่ข้อมูลในฐานข้อมูล)', 'error');
      return;
    }

    const outOfStock = selected.filter((p) => this.toInt(p.quantity, 0) <= 0);
    if (outOfStock.length) {
      Swal.fire(
        'สินค้าหมด',
        `มี ${outOfStock.length} รายการที่จำนวนเป็น 0 (ยกเลิกการเลือกก่อน)`,
        'warning'
      );
      return;
    }

    Swal.fire({
      title: `ยืนยันส่งไป history ${selected.length} รายการ?`,
      html:
        '<span>ระบบจะขาย <b style="color:#d81b60;">1 ชิ้น</b> ต่อ 1 รายการที่เลือก และตัดสต๊อก</span>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.loading = true;

      const jobs = selected.map((p) => {
        const historyPayload = this.safeHistoryPayload(p);

        return this.historyService.create(historyPayload as any).pipe(
          switchMap(() => {
            const currentQty = this.toInt(p.quantity, 0);
            const updated: Product = { ...p, quantity: currentQty - 1 };
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

          // ✅ เคลียร์ selection ทั้ง Set + array
          this.selectedIds.clear();
          this.selectedProducts = [];
          this.loadProducts();

          if (failList.length === 0) {
            Swal.fire('สำเร็จ', `ส่งไป history แล้ว ${successCount} รายการ`, 'success');
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

  private safeHistoryPayload(p: Product) {
    return {
      code: 'H' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: p.name,
      category: p.category,
      quantity: 1,
      price: this.toInt(p.price, 0),
      date: new Date().toISOString().split('T')[0],
    };
  }

  /* ================= EDIT ================= */
  onEdit(index: number) {
    if (this.showCreateForm) return;

    const p = this.filteredProducts[index];
    this.editIndex = index;

    const prepared = this.withTotal(p);
    this.editProduct = { ...prepared, date: this.formatDate(prepared.date) };
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

    const payload: Product = this.withTotal({
      ...this.editProduct,
      date: this.editProduct.date,
    });

    this.inventoryService.update(this.editProduct.id, payload).subscribe({
      next: () => {
        this.filteredProducts[index] = { ...payload };

        const originalIndex = this.products.findIndex((p) => p.id === this.editProduct!.id);
        if (originalIndex !== -1) this.products[originalIndex] = { ...payload };

        this.editIndex = null;
        this.editProduct = null;
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
      },
      error: () => Swal.fire('ผิดพลาด', 'อัปเดตข้อมูลไม่สำเร็จ', 'error'),
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
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.delete(product.id!).subscribe({
          next: () => {
            this.loadProducts();
            Swal.fire('สำเร็จ', 'ลบรายการสำเร็จ', 'success');
          },
          error: () => Swal.fire('ผิดพลาด', 'ลบรายการไม่สำเร็จ', 'error'),
        });
      }
    });
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

  private todayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private isValidProduct(p: Product): boolean {
    return !!(p.name && p.category && p.quantity >= 1 && p.price >= 0 && p.date);
  }
}