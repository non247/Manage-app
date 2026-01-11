import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api/inventory';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})
export class AnalyzeService {
    public user: any;

  constructor(
    private httpClient: HttpClient
  ) { }
}