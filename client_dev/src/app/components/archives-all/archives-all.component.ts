import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { saveAs } from 'file-saver';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-archives-all',
  templateUrl: './archives-all.component.html',
  styleUrls: ['./archives-all.component.css'],
  providers: [ProjectService]
})
export class ArchivesAllComponent implements OnInit, OnDestroy {
  public descargandoZIP: boolean = false;
  public progresoReal: number = 0;      // progreso reportado por el backend
  public progresoSimulado: number = 0;  // avance lento hasta 99%
  public mensaje: string | null = null;

  private descargaSub?: Subscription;
  private simuladorSub?: Subscription;
  private stopSimulado$ = new Subject<void>();
  readonly DURACION_SIMULADO_MS = 20 * 60 * 1000; // 20 minutos

  constructor(private _projectService: ProjectService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopSimulado$.next();
    this.stopSimulado$.complete();
    this.descargaSub?.unsubscribe();
    this.simuladorSub?.unsubscribe();
  }

  // Lo que se muestra: el mayor entre real y simulado, pero nunca pasa de 99 salvo que se complete.
  get displayProgress(): number {
    if (!this.descargandoZIP) return 0;
    if (this.progresoReal === 100) return 100;
    return Math.min(99, Math.max(this.progresoReal, this.progresoSimulado));
  }

  descargarTodosLosRFCsZIP(): void {
    const token = this._projectService.getToken();
    if (!token) {
      alert("No se encontró el token. Inicia sesión.");
      return;
    }

    // Reset
    this.descargandoZIP = true;
    this.progresoReal = 0;
    this.progresoSimulado = 0;
    this.mensaje = null;

    // Inicia el simulador lento
    this.arrancarSimulado();

    this.descargaSub = this._projectService.descargarTodosLosArchivosConProgreso(token)
      .subscribe({
        next: (event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.DownloadProgress:
              if (event.total) {
                this.progresoReal = Math.round((event.loaded / event.total) * 100);
              } else {
                console.log("No se pudo calcular el progreso real, el total no está disponible.");
              }
              break;

            case HttpEventType.Response:
              // Forzar 100% y guardar archivo
              const fecha = new Date();
              const nombreArchivo = `Todos-RFCs-${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}.zip`;
              saveAs(event.body, nombreArchivo);

              // Detener simulador
              this.stopSimulado$.next();
              this.progresoReal = 100;
              this.progresoSimulado = 100;
              this.descargandoZIP = false;
              this.mensaje = ' ✅ Descarga completada con éxito, que tal estuvo el cafe ? ☕ :)';
              break;
          }
        },
        error: (error) => {
          console.error("❌ Error al descargar el ZIP:", error);
          this.stopSimulado$.next();
          this.descargandoZIP = false;
          this.progresoReal = 0;
          this.progresoSimulado = 0;
          this.mensaje = 'Ups, hubo un problema';
        }
      });
  }

  private arrancarSimulado() {
    // Detener cualquier simulador previo
    this.stopSimulado$.next();
    this.progresoSimulado = 0;
    this.simuladorSub?.unsubscribe();

    // Queremos subir a 99 en 15 minutos => intervalo
    const pasos = 99;
    const intervaloMs = this.DURACION_SIMULADO_MS / pasos;

    this.simuladorSub = interval(Math.ceil(intervaloMs))
      .pipe(takeUntil(this.stopSimulado$))
      .subscribe(() => {
        if (this.progresoSimulado < 99) {
          this.progresoSimulado += 1;
        } else {
          // Llegó a 99, se detiene
          this.simuladorSub?.unsubscribe();
        }
      });
  }
}
