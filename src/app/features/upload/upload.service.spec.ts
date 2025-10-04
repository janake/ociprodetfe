import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UploadService } from './upload.service';

function createFile(name = 'test.txt', size = 10, type = 'text/plain'): File {
  const blob = new Blob([new Array(size).fill('a').join('')], { type });
  return new File([blob], name, { type });
}

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST FormData to /api/upload with file and report progress', (done) => {
    const file = createFile();
    const events: any[] = [];

    service.upload(file).subscribe({
      next: (e) => {
        events.push(e);
      },
      complete: () => {
        try {
          // We expect at least one event (the response)
          expect(events.length).toBeGreaterThan(0);
          done();
        } catch (err) {
          done.fail(err as Error);
        }
      }
    });

    const req = httpMock.expectOne('/api/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.reportProgress).toBeTrue();
    expect(req.request.responseType).toBe('json');

    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    const sentFile = body.get('file') as File | null;
    expect(sentFile).toBeTruthy();
    expect(sentFile?.name).toBe(file.name);

    // Flush a successful empty body response
    req.flush({ message: 'ok' });
  });
});
