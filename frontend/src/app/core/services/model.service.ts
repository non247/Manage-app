import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private readonly apiUrl =
    `${environment.modelApiUrl}/getSaleForecastData`;

  constructor(private readonly http: HttpClient) {}

  getSaleForecastData(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}