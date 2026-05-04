import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }
}

/* 👇 interface แนะนำ (แก้ error any ด้วย) */
export interface DashboardResponse {
  todaySales: number;
  totalProducts: number;
  totalSold: number;

  salesChart: { date: string; total: number }[];
  // ✅ รายสัปดาห์
  salesChartWeekly: { week: number; total: number }[];
  // ✅ รายเดือน
  salesChartMonthly: { month: string; total: number }[];
  topSellers: { name: string; sold: number }[];
  productChart: { name: string; sold: number }[];
}
