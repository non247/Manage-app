// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class DashboardService {

//   private apiUrl = 'http://localhost:3000/api/dashboard'; 
//   constructor(private http: HttpClient) {}


//   getTodaySales(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/today-sales`);
//   }

//   getTotalProducts(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/total-products`);
//   }

//   getSalesOverview(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/sales-overview`);
//   }

//   getTopSeller(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/top-seller`);
//   }

//   getDashboard(): Observable<any> {
//     return this.http.get<any>(this.apiUrl);
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }
}

/* 👇 interface แนะนำ (แก้ error any ด้วย) */
export interface DashboardResponse {
  todaySales: number;
  totalProducts: number;
  
  salesChart: { date: string; total: number }[];
   // ✅ รายสัปดาห์
  salesChartWeekly: {week: number;total: number;}[];
  // ✅ รายเดือน
  salesChartMonthly: {month: string; total: number;}[];
  topSellers: { name: string; sold: number }[];
  productChart: { name: string; sold: number }[];
}
