import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PurchaseHistoryProduct {
  id?: number;
  code?: string; // ✅ เพิ่มตรงนี้
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: string;
  total?: number;
  image?: string;
}

export interface ProductMaster {
  id?: number;
  code?: string;
  name: string;
  category?: string;
  quantity?: number;
  price?: number;
  date?: string;
  total?: number;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PurchasehistoryService {
  private readonly apiUrl = 'http://localhost:3000/api/purchasehistory';
  private readonly productUrl = 'http://localhost:3000/api/products';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<PurchaseHistoryProduct[]> {
    return this.http.get<PurchaseHistoryProduct[]>(this.apiUrl);
  }

  create(payload: PurchaseHistoryProduct): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  update(id: number, payload: PurchaseHistoryProduct): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getProductMaster(): Observable<ProductMaster[]> {
    return this.http.get<ProductMaster[]>(this.productUrl);
  }
}
