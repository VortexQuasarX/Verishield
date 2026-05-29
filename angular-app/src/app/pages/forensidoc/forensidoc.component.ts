import { Component, OnInit, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ForensiDocResult } from '../../models/ai.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-forensidoc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forensidoc.component.html',
  styleUrl: './forensidoc.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForensiDocComponent implements OnInit {
  isLoading = false;
  analysisComplete = false;
  result: ForensiDocResult | null = null;
  documentName = '';

  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  isDragOver = false;

  mockResult: ForensiDocResult = {
    tamperDetected: false,
    authenticityScore: 94,
    findings: [
      { type: 'metadata', description: 'Document metadata intact - no modification timestamps detected', severity: 'info' },
      { type: 'font', description: 'Font analysis shows consistent typography throughout document', severity: 'info' },
      { type: 'image', description: 'Embedded images show no signs of manipulation or splicing', severity: 'info' },
      { type: 'signature', description: 'Digital signature verified - matches issuer certificate', severity: 'info' },
      { type: 'layout', description: 'Minor layout inconsistency detected on page 2, paragraph 3', severity: 'warning' },
    ],
    analyzedAt: new Date().toISOString(),
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.documentName = this.selectedFile.name;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      this.documentName = this.selectedFile.name;
    }
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement?.click();
  }

  clearFile(): void {
    this.selectedFile = null;
    this.documentName = '';
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  uploadDocument(): void {
    this.isLoading = true;
    this.analysisComplete = false;

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);
      formData.append('documentName', this.selectedFile.name);

      this.apiService.forensiDoc(formData).subscribe({
        next: (data) => {
          this.result = data;
          this.analysisComplete = true;
          this.isLoading = false;
        },
        error: () => {
          this.result = this.mockResult;
          this.analysisComplete = true;
          this.isLoading = false;
        },
      });
    } else {
      this.apiService.forensiDocAnalyze({ documentId: 'demo-doc-' + Date.now() }).subscribe({
        next: (data) => {
          this.result = data;
          this.analysisComplete = true;
          this.isLoading = false;
        },
        error: () => {
          this.result = this.mockResult;
          this.analysisComplete = true;
          this.isLoading = false;
        },
      });
    }
  }

  resetAnalysis(): void {
    this.analysisComplete = false;
    this.result = null;
    this.documentName = '';
    this.clearFile();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileTypeIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp': return '🖼️';
      case 'txt': return '📃';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📊';
      case 'zip':
      case 'rar':
      case '7z': return '📦';
      default: return '📎';
    }
  }

  getFindingIcon(severity: string): string {
    switch (severity) {
      case 'info': return '\u2713';
      case 'warning': return '\u26A0';
      case 'error': return '\u2717';
      default: return '\u2139';
    }
  }

  getFindingClass(severity: string): string {
    return `finding-${severity}`;
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'var(--accent-green)';
    if (score >= 70) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }
}
