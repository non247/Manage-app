import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  products: Product[] = [];

  keyword = '';
  loading = false;
  error = '';

  showForm = false;
  isEdit = false;
  editingId: number | null = null;

  selectedFile: File | null = null;
  previewUrl = '';

  // ✅ ปรับตรงนี้ตาม backend ของคุณ
  apiUrl = 'http://localhost:3000';

  form = {
    name: '',
    price: 59 as number | null,
    image: null as File | null, // (optional) เผื่อใช้ แต่หลักๆ ใช้ selectedFile
  };

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.load();
  }

  // ✅ แปลง path ใน DB ให้เป็น URL ที่เปิดได้จริง
  toImgUrl(img: string | null | undefined) {
    if (!img) return '';
    if (img.startsWith('http')) return img;

    // ถ้า DB เก็บเป็นชื่อไฟล์ล้วน เช่น 123.jpg
    if (!img.startsWith('/')) img = '/uploads/' + img;

    return this.apiUrl + img; // => http://localhost:3000/uploads/xxx.jpg
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

  openCreate() {
    this.isEdit = false;
    this.editingId = null;

    this.form = { name: '', price: 59, image: null };
    this.selectedFile = null;
    this.previewUrl = '';

    this.showForm = true;
  }

  openEdit(p: Product) {
    this.isEdit = true;
    this.editingId = p.id;

    this.form = {
      name: p.name,
      price: Number(p.price),
      image: null, // ✅ ยังไม่เลือกไฟล์ใหม่
    };

    this.selectedFile = null;

    // ✅ preview รูปเดิมจาก DB (ต้องแปลงเป็น URL เต็ม)
    this.previewUrl = p.image ? this.toImgUrl(p.image) : '';

    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // ถ้าไม่ได้เลือกไฟล์ ก็ไม่ทำอะไร (คง preview เดิมตอน edit)
    if (!file) return;

    const ok = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!ok) {
      alert('กรุณาอัปโหลดไฟล์ .png หรือ .jpg เท่านั้น');
      input.value = '';
      return;
    }

    this.form.image = file;
    this.selectedFile = file;

    // ✅ preview ไฟล์ใหม่เป็น base64
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  save() {
    if (!this.form.name.trim()) return alert('กรุณากรอกชื่อสินค้า');
    if (this.form.price === null || Number(this.form.price) <= 0)
      return alert('ราคาต้องมากกว่า 0');

    // ✅ ต้องส่งเป็น multipart/form-data
    const fd = new FormData();
    fd.append('name', this.form.name.trim());
    fd.append('price', String(Number(this.form.price)));

    // ✅ แนบไฟล์เฉพาะตอนมีการเลือกไฟล์
    if (this.selectedFile) {
      fd.append('image', this.selectedFile); // key ต้องตรงกับ backend (upload.single('image'))
    }

    this.loading = true;
    this.error = '';

    if (this.isEdit && this.editingId !== null) {
      this.productService.update(this.editingId, fd).subscribe({
        next: () => {
          this.showForm = false;
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
        next: () => {
          this.showForm = false;
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

  remove(p: Product) {
    const ok = confirm(`ลบสินค้า: ${p.name} ?`);
    if (!ok) return;

    this.loading = true;
    this.error = '';
    this.productService.delete(p.id).subscribe({
      next: () => this.load(),
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
