import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private readonly apiUrl = 'http://localhost:5000/api/getForecastSoldPerDay';

  constructor(private readonly http: HttpClient) {}

  getForecastSoldPerDay(payload: any): Observable<any> {
    // โครงสร้าง Body ต้องตรงกับที่ Express รอรับ (req.body.data)
    return this.http.post<any>(this.apiUrl, payload);
  }
}
