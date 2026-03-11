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
  image?: string; // ✅ เพิ่มรูปภาพ
}

/** ✅ สินค้า master จากหน้า product */
export interface ProductMaster {
  id: number;
  name: string;
  price: number;
  image?: string; // ✅ ฟิลด์รูป
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private readonly apiUrl = 'http://localhost:3000/api/history';

  // ✅ endpoint ของหน้า product
  private readonly productApiUrl = 'http://localhost:3000/api/products';

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

  // ✅ ดึงรายชื่อสินค้าจาก DB หน้า product
  getProductMaster(): Observable<ProductMaster[]> {
    return this.http.get<ProductMaster[]>(this.productApiUrl);
  }
}
