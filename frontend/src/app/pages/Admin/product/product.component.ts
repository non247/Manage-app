import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import {
  Product,
  ProductService,
} from '../../../core/services/product.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, TableModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  products: Product[] = [];

  keyword = '';
  loading = false;
  error = '';

  // ✅ ให้ตรงกับ HTML แบบ usermanagement
  showCreateForm = false;
  isClosing = false;

  isEdit = false;
  editingId: number | null = null;

  selectedFile: File | null = null;
  previewUrl = '';

  // ✅ ปรับตาม backend
  apiUrl = 'http://localhost:3000';

  form = {
    name: '',
    price: 0 as number | null,
    image: null as File | null,
  };

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.load();
  }

  toImgUrl(img: string | null | undefined) {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    if (!img.startsWith('/')) img = '/uploads/' + img;
    return this.apiUrl + img;
  }

  load() {
    this.loading = true;
    this.error = '';
    this.productService.getAll(this.keyword).subscribe({
      next: (rows) => {
        this.products = rows;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'โหลดข้อมูลไม่สำเร็จ';
        this.loading = false;
      },
    });
  }

  /** ✅ เปิดฟอร์มเพิ่มสินค้า (เหมือน usermanagement: toggle) */
  toggleCreate() {
    if (this.showCreateForm) {
      this.onCreateCancel();
    } else {
      this.openCreate();
    }
  }

  openCreate() {
    this.isClosing = false;

    this.isEdit = false;
    this.editingId = null;

    this.form = { name: '', price: 0, image: null };
    this.selectedFile = null;
    this.previewUrl = '';

    this.showCreateForm = true;
  }

  openEdit(p: Product) {
    this.isClosing = false;

    this.isEdit = true;
    this.editingId = p.id;

    this.form = {
      name: p.name,
      price: Number(p.price),
      image: null,
    };

    this.selectedFile = null;
    this.previewUrl = p.image ? this.toImgUrl(p.image) : '';

    this.showCreateForm = true;
  }

  /** ✅ ปิดฟอร์ม (เหมือน usermanagement: closing animation + reset) */
  onCreateCancel() {
    if (!this.showCreateForm || this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;

      this.isEdit = false;
      this.editingId = null;

      this.form = { name: '', price: 0, image: null };
      this.selectedFile = null;
      this.previewUrl = '';
    }, 250); // ให้ตรงกับ CSS animation 0.25s
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    const ok = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!ok) {
      Swal.fire({
        icon: 'warning',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาอัปโหลดไฟล์ .png หรือ .jpg เท่านั้น',
      });
      input.value = '';
      return;
    }

    this.form.image = file;
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  async save() {
    if (!this.form.name.trim()) {
      await Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อสินค้า' });
      return;
    }
    if (this.form.price === null || Number(this.form.price) <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ราคาต้องมากกว่า 0' });
      return;
    }

    const fd = new FormData();
    fd.append('name', this.form.name.trim());
    fd.append('price', String(Number(this.form.price)));

    if (this.selectedFile) {
      fd.append('image', this.selectedFile);
    }

    this.loading = true;
    this.error = '';

    if (this.isEdit && this.editingId !== null) {
      this.productService.update(this.editingId, fd).subscribe({
        next: async () => {
          this.loading = false;
          await Swal.fire({
            title: 'สำเร็จ',
            text: 'บันทึกข้อมูลเรียบร้อย',
            icon: 'success',
            timer: 1500, // เวลาแสดง (ms)
            showConfirmButton: false,
            timerProgressBar: true,
          });
          this.onCreateCancel();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.error = 'แก้ไขสินค้าไม่สำเร็จ';
          this.loading = false;
        },
      });
    } else {
      this.productService.create(fd).subscribe({
        next: async () => {
          this.loading = false;
          await Swal.fire({
            icon: 'success',
            title: 'เพิ่มสินค้าสำเร็จ',
            timer: 900,
            showConfirmButton: false,
          });
          this.onCreateCancel();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.error = 'เพิ่มสินค้าไม่สำเร็จ';
          this.loading = false;
        },
      });
    }
  }

  async remove(p: Product) {
    const res = await Swal.fire({
      title: 'ยืนยันที่จะลบ?',
      html: '<span style="color:red; font-weight:bold;">ข้อมูลจะไม่สามารถกู้คืนได้</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
    });

    if (!res.isConfirmed) return;

    this.loading = true;
    this.error = '';
    this.productService.delete(p.id).subscribe({
      next: async () => {
        this.loading = false;
        await Swal.fire({
          title: 'สำเร็จ',
          text: 'ลบรายการสำเร็จ',
          icon: 'success',
          timer: 1500, // เวลาแสดง (ms)
          showConfirmButton: false,
          timerProgressBar: true,
        });
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.error = 'ลบสินค้าไม่สำเร็จ';
        this.loading = false;
      },
    });
  }

  trackById(_: number, item: Product) {
    return item.id;
  }
}
