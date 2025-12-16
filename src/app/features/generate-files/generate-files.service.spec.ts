import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GenerateFilesService } from './generate-files.service';

describe('GenerateFilesService', () => {
  let service: GenerateFilesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(GenerateFilesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST to /api/files/generate with count param', () => {
    service.generate(20).subscribe((result) => {
      expect(Array.isArray(result)).toBeTrue();
    });

    const req = httpMock.expectOne((r) => r.url === '/api/files/generate' && r.params.get('count') === '20');
    expect(req.request.method).toBe('POST');
    req.flush([]);
  });

  it('should GET /api/files with limit param', () => {
    service.list(50).subscribe((result) => {
      expect(Array.isArray(result)).toBeTrue();
    });

    const req = httpMock.expectOne((r) => r.url === '/api/files' && r.params.get('limit') === '50');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST /api/files/sync with limit param', () => {
    service.sync(75).subscribe((result) => {
      expect(Array.isArray(result)).toBeTrue();
    });

    const req = httpMock.expectOne((r) => r.url === '/api/files/sync' && r.params.get('limit') === '75');
    expect(req.request.method).toBe('POST');
    req.flush([]);
  });

  it('should POST /api/files/clean', () => {
    service.clean().subscribe((result) => {
      expect(result.deletedDbRows).toBe(3);
      expect(result.deletedFiles).toBe(10);
    });

    const req = httpMock.expectOne('/api/files/clean');
    expect(req.request.method).toBe('POST');
    req.flush({ deletedDbRows: 3, deletedFiles: 10 });
  });
});
