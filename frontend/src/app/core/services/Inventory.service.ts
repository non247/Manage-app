import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string; // yyyy-MM-dd
  total?: number;
}

/** ✅ สินค้า master จากหน้า product (ถ้าฟิลด์เหมือนกัน ใช้ตัว Product เดิมก็ได้) */
export interface ProductMaster {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly apiUrl = 'http://localhost:3000/api/inventory';

  // ✅ เพิ่ม: endpoint ของหน้า product
  private readonly productApiUrl = 'http://localhost:3000/api/products';
  // ⬆️ ถ้าของคุณเป็น /api/product ให้เปลี่ยนตรงนี้

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ เพิ่ม: ดึงรายชื่อสินค้าจาก DB หน้า product
  getProductMaster(): Observable<ProductMaster[]> {
    return this.http.get<ProductMaster[]>(this.productApiUrl);
  }
}
