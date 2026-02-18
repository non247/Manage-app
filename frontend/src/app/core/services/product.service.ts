import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string; // ถ้าคุณมีฟิลด์รูป
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = 'http://localhost:3000/api/products'; // ปรับให้ตรง backend ของคุณ

  constructor(private http: HttpClient) {}

  getAll(keyword = ''): Observable<Product[]> {
    let params = new HttpParams();
    if (keyword?.trim()) params = params.set('q', keyword.trim());
    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  // ✅ รับ FormData
  create(fd: FormData): Observable<any> {
    return this.http.post(this.baseUrl, fd);
  }

  // ✅ รับ FormData
  update(id: number, fd: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, fd);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
