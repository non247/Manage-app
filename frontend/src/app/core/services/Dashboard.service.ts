import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://localhost:3000/api/dashboard'; 
  constructor(private http: HttpClient) {}


  getTodaySales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/today-sales`);
  }

  getTotalProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/total-products`);
  }

  getSalesOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales-overview`);
  }

  getTopSeller(): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-seller`);
  }
}
