// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface Product {
//   id?: number;
//   code: string;
//   name: string;
//   category: string;
//   quantity: number;
//   price: number;
//   date: Date; // yyyy-MM-dd
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class InventoryService {
//   private apiUrl = 'http://localhost:3000/api/inventory';

//   constructor(private http: HttpClient) {}

//   getAll(): Observable<Product[]> {
//     return this.http.get<Product[]>(this.apiUrl);
//   }

//   create(data: Product): Observable<Product> {
//     return this.http.post<Product>(this.apiUrl, data);
//   }

//   update(id: number, data: Product): Observable<Product> {
//     return this.http.put<Product>(`${this.apiUrl}/${id}`, data);
//   }

//   delete(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/${id}`);
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  date: Date; // yyyy-MM-dd
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = 'http://localhost:3000/api/inventory';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  create(data: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, data);
  }

  update(id: number, data: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}