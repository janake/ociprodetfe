import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeneratedFile } from '../../core/models/generated-file.model';
import { GenerationRun } from '../../core/models/generation-run.model';

@Injectable({ providedIn: 'root' })
export class GenerateFilesService {
  private readonly apiUrl = '/api/files/generate';
  private readonly listUrl = '/api/files';
  private readonly generationsUrl = '/api/files/generations';
  private readonly syncUrl = '/api/files/sync';
  private readonly cleanUrl = '/api/files/clean';

  constructor(private http: HttpClient) {}

  generate(count: number): Observable<GeneratedFile[]> {
    const params = new HttpParams().set('count', String(count));
    return this.http.post<GeneratedFile[]>(this.apiUrl, {}, { params });
  }

  list(limit = 200): Observable<GeneratedFile[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<GeneratedFile[]>(this.listUrl, { params });
  }

  listGenerations(limit = 50): Observable<GenerationRun[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<GenerationRun[]>(this.generationsUrl, { params });
  }

  sync(limit = 200): Observable<GeneratedFile[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.post<GeneratedFile[]>(this.syncUrl, {}, { params });
  }

  clean(): Observable<{ deletedDbRows: number; deletedFiles: number }> {
    return this.http.post<{ deletedDbRows: number; deletedFiles: number }>(this.cleanUrl, {});
  }
}
