import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';

@Component({
  selector: 'app-patch-notes',
  templateUrl: './patch-notes.component.html',
  styleUrls: ['./patch-notes.component.scss'],
})
export class PatchNotesComponent implements OnInit {
  // rutas relativas al root /assets
  images = [
    { src: '/assets/img/Actuali/1.png', alt: 'Validación uno por uno' },
    { src: '/assets/img/Actuali/2.png', alt: 'Nuevos estados' },
    { src: '/assets/img/Actuali/3.png', alt: 'Validación proveedor' },
  ];

  selectedImage: { src: string; alt?: string } | null = null;

  constructor() {}

  ngOnInit(): void {
    // Preload opcional para evitar parpadeos
    this.images.forEach((it) => {
      const i = new Image();
      i.src = it.src;
    });
  }

  openImage(src: string, alt?: string): void {
    this.selectedImage = { src, alt };
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedImage = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.selectedImage) {
      this.closeImage();
    }
  }
}
