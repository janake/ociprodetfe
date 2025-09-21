import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TestMessage } from '../models/test-message.model';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  getMessage(): Observable<TestMessage> {
    console.log('TestService.getMessage() called');
    return this.http.get<TestMessage>(`${this.baseUrl}/teszt`);
  }
}
