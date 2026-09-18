import { TestBed } from '@angular/core/testing';
import { PostFilesComponent } from './post-files.component';

describe('PostFilesComponent', () => {
  let component: PostFilesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostFilesComponent],
    });
    component = TestBed.createComponent(PostFilesComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / ngOnChanges / processFiles', () => {
    it('processes image files and marks them loading', () => {
      component.files = [{ id: '1', file: 'photo.jpg' }];
      component.ngOnInit();
      expect(component.processedFiles.length).toBe(1);
      expect(component.processedFiles[0]._fileType).toBe('image');
      expect(component.imageLoadStates['1']).toBe('loading');
    });

    it('reprocesses on ngOnChanges', () => {
      component.files = [{ id: '2', file: 'doc.pdf' }];
      component.ngOnChanges();
      expect(component.processedFiles[0]._fileType).toBe('pdf');
    });

    it('uses index as fallback key when no id or file', () => {
      component.files = [{}];
      component.ngOnInit();
      expect(component.processedFiles[0]._fileKey).toBe('0');
    });
  });

  describe('onImageClick / onFileOpen / onFileDownload', () => {
    it('emits fileOpen on image click', () => {
      let emitted: any;
      component.fileOpen.subscribe((f) => (emitted = f));
      const file = { id: '1' };
      component.onImageClick(file);
      expect(emitted).toBe(file);
    });

    it('emits fileOpen via onFileOpen', () => {
      let emitted: any;
      component.fileOpen.subscribe((f) => (emitted = f));
      const file = { id: '1' };
      component.onFileOpen(file);
      expect(emitted).toBe(file);
    });

    it('emits fileDownload via onFileDownload', () => {
      let emitted: any;
      component.fileDownload.subscribe((f) => (emitted = f));
      const file = { id: '1' };
      component.onFileDownload(file);
      expect(emitted).toBe(file);
    });
  });

  describe('onImageLoad', () => {
    it('marks square orientation when width/height nearly equal', () => {
      const file = { _fileKey: 'k1' };
      const image = { naturalWidth: 100, naturalHeight: 90 } as HTMLImageElement;
      component.onImageLoad(file, { target: image } as unknown as Event);
      expect(component.mediaOrientations['k1']).toBe('square');
      expect(component.imageLoadStates['k1']).toBe('loaded');
    });

    it('marks landscape orientation when width much greater than height', () => {
      const file = { _fileKey: 'k2' };
      const image = { naturalWidth: 400, naturalHeight: 100 } as HTMLImageElement;
      component.onImageLoad(file, { target: image } as unknown as Event);
      expect(component.mediaOrientations['k2']).toBe('landscape');
    });

    it('marks portrait orientation when height much greater than width', () => {
      const file = { _fileKey: 'k3' };
      const image = { naturalWidth: 100, naturalHeight: 400 } as HTMLImageElement;
      component.onImageLoad(file, { target: image } as unknown as Event);
      expect(component.mediaOrientations['k3']).toBe('portrait');
    });

    it('falls back to id or file for the key when _fileKey missing', () => {
      const file = { id: 'k4' };
      const image = { naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement;
      component.onImageLoad(file, { target: image } as unknown as Event);
      expect(component.imageLoadStates['k4']).toBe('loaded');
    });
  });

  describe('onImageError', () => {
    it('marks error state using _fileKey', () => {
      component.onImageError({ _fileKey: 'k1' });
      expect(component.imageLoadStates['k1']).toBe('error');
    });
  });

  describe('getFileTypeCached / getFileType', () => {
    it('throws for a null file, since the public method reads file.id before the null guard', () => {
      expect(() => component.getFileType(null)).toThrow();
    });

    it('caches file type across calls', () => {
      const file = { id: '1', file: 'video.mp4' };
      expect(component.getFileType(file)).toBe('video');
      expect(component.getFileType(file)).toBe('video');
    });

    it('detects document, archive and other types', () => {
      expect(component.getFileType({ id: 'a', file: 'x.docx' })).toBe('document');
      expect(component.getFileType({ id: 'b', file: 'x.zip' })).toBe('archive');
      expect(component.getFileType({ id: 'c', file: 'x.txt' })).toBe('other');
    });
  });

  describe('getImageUrl', () => {
    it('throws for a null file, since the public method reads file.id before the null guard', () => {
      expect(() => component.getImageUrl(null)).toThrow();
    });

    it('returns absolute urls unchanged', () => {
      expect(component.getImageUrl({ id: '1', file: 'https://x.com/a.jpg' })).toBe(
        'https://x.com/a.jpg',
      );
    });

    it('prefixes a relative path with a leading slash', () => {
      expect(component.getImageUrl({ id: '2', file: 'a.jpg' })).toBe('/a.jpg');
    });

    it('caches computed urls', () => {
      const file = { id: '3', file: 'b.jpg' };
      expect(component.getImageUrl(file)).toBe('/b.jpg');
      expect(component.getImageUrl(file)).toBe('/b.jpg');
    });
  });

  describe('getFileIcon', () => {
    it('maps known types to icons', () => {
      expect(component.getFileIcon('pdf')).toBe('fas fa-file-pdf');
      expect(component.getFileIcon('document')).toBe('fas fa-file-word');
      expect(component.getFileIcon('archive')).toBe('fas fa-file-archive');
    });

    it('falls back to a generic icon', () => {
      expect(component.getFileIcon('other')).toBe('fas fa-file');
    });
  });

  describe('formatFileSize', () => {
    it('returns empty string for a falsy size', () => {
      expect(component.formatFileSize(0)).toBe('');
    });

    it('formats bytes', () => {
      expect(component.formatFileSize(500)).toBe('500.0 B');
    });

    it('formats kilobytes', () => {
      expect(component.formatFileSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(component.formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});
