import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  image?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = 'http://localhost:3000/api/products';

  constructor(private readonly http: HttpClient) {}

  getAll(keyword = ''): Observable<Product[]> {
    let params = new HttpParams();

    if (keyword?.trim()) {
      params = params.set('search', keyword.trim());
    }

    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  create(fd: FormData): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, fd);
  }

  update(id: number, fd: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, fd);
  }

  delete(
    id: number
  ): Observable<{ message: string; id: number; code: string }> {
    return this.http.delete<{ message: string; id: number; code: string }>(
      `${this.baseUrl}/${id}`
    );
  }
}
