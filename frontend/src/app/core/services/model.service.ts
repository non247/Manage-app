import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private readonly apiUrl = '/model/api/getSaleForecastData';

  constructor(private readonly http: HttpClient) {}

  getSaleForecastData(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
