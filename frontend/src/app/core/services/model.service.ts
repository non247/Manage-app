import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private readonly apiUrl = 'http://localhost:3000/api/forecast ';

  constructor(private readonly http: HttpClient) {}

  getPrediction(inputData: number[]): Observable<any> {
    // โครงสร้าง Body ต้องตรงกับที่ Express รอรับ (req.body.data)
    return this.http.post<any>(this.apiUrl, { data: inputData });
  }
}
