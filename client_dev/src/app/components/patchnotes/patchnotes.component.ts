import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-patchnotes',
  templateUrl: './patchnotes.component.html',
  styleUrls: ['./patchnotes.component.css']
})
export class PatchnotesComponent implements OnInit {

  feedbackForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  minDescriptionWords = 10;

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectService
  ) {
    const identity = this.projectService.getIdentity();
    const defaultEmail = identity ? identity.correo : '';
    const defaultName = identity ? (identity.empresa || identity.nombre_contacto || identity.nombre || 'Ambos de la cuenta') : '';

    this.feedbackForm = this.formBuilder.group({
      reportType: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      module: [''],
      userName: [{ value: defaultName, disabled: true }, Validators.required],
      email: [{ value: defaultEmail, disabled: true }, [Validators.email, Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (files && files.length > 0) {
      // Validar máximo 3 imágenes
      if (files.length + this.selectedFiles.length > 3) {
        this.errorMessage = 'Puedes mandar de una a tres imágenes máximo.';
        event.target.value = '';
        return;
      }

      // Agregar archivos seleccionados
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar que sea imagen
        if (!file.type.includes('image')) {
          this.errorMessage = 'Solo se permiten archivos de imagen.';
          event.target.value = '';
          return;
        }

        this.selectedFiles.push(file);

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewImages.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      this.errorMessage = '';
    }
  }

  descriptionWordCount(): number {
    const val = this.feedbackForm.get('description')?.value || '';
    return (val || '').trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos.';
      return;
    }

    // Validación por número mínimo de palabras en la descripción
    const words = this.descriptionWordCount();
    if (words < this.minDescriptionWords) {
      this.errorMessage = `La descripción debe tener al menos ${this.minDescriptionWords} palabras. Actualmente tiene ${words}.`;
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Crear FormData para enviar archivos
    const formData = new FormData();
    
    // Agregar datos del formulario
    formData.append('reportType', this.feedbackForm.get('reportType')?.value);
    formData.append('subject', this.feedbackForm.get('subject')?.value);
    formData.append('description', this.feedbackForm.get('description')?.value);
    formData.append('module', this.feedbackForm.get('module')?.value);
    // Para campos disabled (readonly), usamos getRawValue() o accedemos directamente al control disabled 
    const rawData = this.feedbackForm.getRawValue();
    formData.append('userName', rawData.userName);
    formData.append('email', rawData.email);
    formData.append('timestamp', new Date().toISOString());
    formData.append('userAgent', navigator.userAgent);

    // Agregar imágenes
    for (let file of this.selectedFiles) {
      formData.append('images', file, file.name);
    }

    // Llamar al servicio para enviar el reporte
    this.projectService.submitFeedbackWithImages(formData).subscribe(
      (response: any) => {
        this.isSubmitting = false;
        this.successMessage = '¡Reporte enviado correctamente! Gracias por tu retroalimentación.';
        this.feedbackForm.reset();
        this.selectedFiles = [];
        this.previewImages = [];
        
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message || 'Error al enviar el reporte. Por favor intenta nuevamente.';
        console.error('Error:', error);
      }
    );
  }

  onReset(): void {
    this.feedbackForm.reset();
    this.selectedFiles = [];
    this.previewImages = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

}
