import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private readonly apiUrl = 'https://manage-app-5koc.onrender.com/api/getSaleForecastData';

  constructor(private readonly http: HttpClient) {}

  getSaleForecastData(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
