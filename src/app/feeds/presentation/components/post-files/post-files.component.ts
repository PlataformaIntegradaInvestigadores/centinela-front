import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-post-files',
  templateUrl: './post-files.component.html',
  styleUrls: ['./post-files.component.css'],
})
export class PostFilesComponent implements OnInit, OnChanges {
  @Input() files: any[] = [];

  @Output() fileOpen = new EventEmitter<any>();
  @Output() fileDownload = new EventEmitter<any>();

  // Track image load states
  imageLoadStates: { [key: string]: 'loading' | 'loaded' | 'error' } = {};
  mediaOrientations: { [key: string]: 'portrait' | 'landscape' | 'square' } = {};

  // Cache para evitar recálculos
  private fileTypeCache: { [key: string]: string } = {};
  private imageUrlCache: { [key: string]: string } = {};

  // Processed files para optimización
  processedFiles: any[] = [];

  ngOnInit() {
    this.processFiles();
  }

  ngOnChanges() {
    this.processFiles();
  }

  private processFiles() {
    this.processedFiles = this.files.map((file, index) => {
      const fileType = this.getFileTypeCached(file);
      const imageUrl = this.getImageUrlCached(file);
      const fileKey = String(file.id || file.file || index);

      // Inicializar estado de carga para imágenes
      if (fileType === 'image') {
        this.imageLoadStates[fileKey] = 'loading';
      }

      return {
        ...file,
        _fileKey: fileKey,
        _fileType: fileType,
        _imageUrl: imageUrl,
      };
    });
  }

  onImageClick(file: any): void {
    this.fileOpen.emit(file);
  }

  onImageLoad(file: any, event: Event): void {
    const key = file._fileKey || file.id || file.file;
    const image = event.target as HTMLImageElement;
    const width = image.naturalWidth || 1;
    const height = image.naturalHeight || 1;

    this.mediaOrientations[key] =
      Math.abs(width - height) < 80 ? 'square' : width > height ? 'landscape' : 'portrait';
    this.imageLoadStates[key] = 'loaded';
  }

  onImageError(file: any): void {
    this.imageLoadStates[file._fileKey || file.id || file.file] = 'error';
  }

  onFileOpen(file: any): void {
    this.fileOpen.emit(file);
  }

  onFileDownload(file: any): void {
    this.fileDownload.emit(file);
  }

  private getFileTypeCached(file: any): string {
    if (!file || !file.file) return 'other';

    const cacheKey = file.id || file.file;
    if (this.fileTypeCache[cacheKey]) {
      return this.fileTypeCache[cacheKey];
    }

    const fileType = this.calculateFileType(file);
    this.fileTypeCache[cacheKey] = fileType;
    return fileType;
  }

  private getImageUrlCached(file: any): string {
    if (!file || !file.file) return '';

    const cacheKey = file.id || file.file;
    if (this.imageUrlCache[cacheKey]) {
      return this.imageUrlCache[cacheKey];
    }

    const imageUrl = this.calculateImageUrl(file);
    this.imageUrlCache[cacheKey] = imageUrl;
    return imageUrl;
  }

  private calculateFileType(file: any): string {
    const url = file.file.toLowerCase();

    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i)) {
      return 'image';
    } else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i)) {
      return 'video';
    } else if (url.match(/\.pdf(\?.*)?$/i)) {
      return 'pdf';
    } else if (url.match(/\.(doc|docx)(\?.*)?$/i)) {
      return 'document';
    } else if (url.match(/\.(zip|rar|7z|tar|gz)(\?.*)?$/i)) {
      return 'archive';
    } else {
      return 'other';
    }
  }

  private calculateImageUrl(file: any): string {
    let url = file.file.trim();

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const baseUrl = '';
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return `${baseUrl}${url}`;
  }

  getFileType(file: any): string {
    // Usar la cache si existe
    const cacheKey = file.id || file.file;
    if (this.fileTypeCache[cacheKey]) {
      return this.fileTypeCache[cacheKey];
    }

    return this.getFileTypeCached(file);
  }

  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'document':
        return 'fas fa-file-word';
      case 'archive':
        return 'fas fa-file-archive';
      default:
        return 'fas fa-file';
    }
  }

  /**
   * Corrige la URL de la imagen si es necesario
   */
  getImageUrl(file: any): string {
    // Usar la cache si existe
    const cacheKey = file.id || file.file;
    if (this.imageUrlCache[cacheKey]) {
      return this.imageUrlCache[cacheKey];
    }

    return this.getImageUrlCached(file);
  }

  formatFileSize(size: number): string {
    if (!size) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }
}
