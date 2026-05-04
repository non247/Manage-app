import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/* ================= INTERFACE ================= */
export interface Product {
  id?: number;
  code?: string; // purchase อาจไม่มี code ก็ได้
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string; // yyyy-MM-dd
  total?: number;
  image?: string;
}

/** ✅ สินค้า master จากหน้า product */
export interface ProductMaster {
  id: number;
  code?: string;
  name: string;
  category?: string;
  price: number;
  image?: string;
}

/* ================= SERVICE ================= */
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly apiUrl = '/api/purchase';

  // ✅ ใช้ดึง master จาก product
  private readonly productApiUrl = '/api/products';

  constructor(private readonly http: HttpClient) {}

  /* ================= CRUD PURCHASE ================= */
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

  /* ================= PRODUCT MASTER ================= */
  getProductMaster(): Observable<ProductMaster[]> {
    return this.http.get<ProductMaster[]>(this.productApiUrl);
  }
}
