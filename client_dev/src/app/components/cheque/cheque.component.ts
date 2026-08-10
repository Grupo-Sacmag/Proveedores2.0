import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-cheque',
  templateUrl: './cheque.component.html',
  styleUrls: ['./cheque.component.css']
})
export class ChequeComponent implements OnInit {
  uploadedFiles: Array<{ name: string; size: number; preview: string }> = [];
  previewSrc: string | null = null;
  cheques: any[] = [];
  idVendor: string = '';
  concepto: string = '';
  monto: number = 0;
  pago: string = '';
  chequeFile: File | null = null;
  uploading: boolean = false;
  uploadError: string = '';

  constructor(public projectService: ProjectService) { }

  ngOnInit(): void {
    this.idVendor = localStorage.getItem('vendorId') || '';
    this.getCheques();
  }

  getCheques() {
    if (!this.idVendor) return;
    this.projectService.getCheque(this.idVendor).subscribe({
      next: (res) => {
        this.cheques = (res.cheques || []).map((c: any) => ({
          ...c,
          url: `${this.projectService.url}cheques/file/${c.nombre}`
        }));
      },
      error: (err) => {
        this.cheques = [];
        console.error('Error al obtener cheques:', err);
      }
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const isImage = validTypes.includes(file.type);
      const isSizeOk = file.size <= 5 * 1024 * 1024; // 5MB

      if (isImage && isSizeOk) {
        this.chequeFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.uploadedFiles = [{
            name: file.name,
            size: +(file.size / (1024 * 1024)).toFixed(2),
            preview: e.target.result
          }];
        };
        reader.readAsDataURL(file);
      } else {
        alert(
          `El archivo "${file.name}" no es válido. Solo se permiten imágenes JPG, JPEG o PNG de máximo 5MB.`
        );
        this.chequeFile = null;
        this.uploadedFiles = [];
      }
    }
  }

  showButtonAnimation(event: Event) {
    const btn = event.target as HTMLButtonElement;
    btn.style.background = '#1565c0';
    setTimeout(() => {
      btn.style.background = '#1976d2';
    }, 200);
  }

  subirCheque() {
    if (!this.chequeFile || !this.idVendor) {
      this.uploadError = 'Selecciona un archivo de imagen válido antes de subir.';
      alert(this.uploadError);
      return;
    }
    this.uploadError = '';
    this.uploading = true;
    const formData = new FormData();
    formData.append('cheque', this.chequeFile);
    formData.append('concepto', this.concepto);
    formData.append('monto', this.monto.toString());
    formData.append('pago', this.pago);

    this.projectService._http.post(
      `${this.projectService.url}cheques/${this.idVendor}`,
      formData,
      {
        headers: this.projectService.getToken()
          ? { Authorization: this.projectService.getToken() }
          : {}
      }
    ).subscribe({
      next: () => {
        this.getCheques();
        this.uploadedFiles = [];
        this.chequeFile = null;
        this.concepto = '';
        this.monto = 0;
        this.pago = '';
        this.uploading = false;
        alert('Cheque subido correctamente.');
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = 'Error al subir el cheque. Intenta de nuevo.';
        alert('Error al subir el cheque');
        console.error('Error al subir cheque:', err);
      }
    });
  }

  previewCheque(c: any) {
    this.previewSrc = c.url;
  }

  closePreview() {
    this.previewSrc = null;
  }
}
