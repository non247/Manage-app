import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private apiUrl = 'http://localhost:3000/api/predict';

  constructor(private http: HttpClient) {}

  getPrediction(inputData: number[]): Observable<any> {
    // โครงสร้าง Body ต้องตรงกับที่ Express รอรับ (req.body.data)
    return this.http.post<any>(this.apiUrl, { data: inputData });
  }
}
