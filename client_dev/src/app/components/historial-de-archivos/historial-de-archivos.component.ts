import { Component, OnInit } from '@angular/core';
import { ProjectService } from 'src/app/services/project.service'; // Asegúrate de que esta ruta sea correcta
import { ActivatedRoute } from '@angular/router';
import { Global } from 'src/app/services/global';

@Component({
  selector: 'app-historial-de-archivos',
  templateUrl: './historial-de-archivos.component.html',
  styleUrls: ['./historial-de-archivos.component.css']
})
export class HistorialDeArchivosComponent implements OnInit {
  archivoOld: { [key: string]: any[] } = {}; // Esto contendrá la lista de archivos agrupados
  rfcRecibido: string = '';

  // Descripciones de los archivos
  archivoDescripcion: { [key: string]: string } = {
    'archivo1': '1. Formato requisitado para alta del proveedor',
    'archivo2': '2. Constancia de situación fiscal SAT',
    'archivo3': '3. Alta imss registro patronal',
    'archivo4': '4. Ine representante legal',
    'archivo5': '5. Acta constitutiva y modificaciones(persona moral) y poder del representante legal',
    'archivo6': '6. Comprobante de domicilio del domicilio fiscal vigente',
    'archivo7': '7. Estado de cuenta con cuenta clabe, sólo caratula',
    'archivo8': '8. Opinión de cumplimiento de 32D SAT',
    'archivo9': '9. Opinión de cumplimiento de 32D IMSS',
    'archivo10': '10. Opinión de cumplimiento de 32D INFONAVIT',
    'archivo11': '11. Curriculum de la empresa o persona fisica y/o cédula de las personas que realizarán el proyecto',
    'archivo12': '12. Registro de prestadoras de servicios especializados u obras especializadas (REPSE)',
    'archivo13': '13. Especificaciones de calibración de equipos y certificaciones en caso de contar con equipo',
    'archivo14': '14. Contrato de servicios y código de ética firmado por representante legal',
    'archivo15': '15. Última declaración anual y estados financieros del año(cualquiera de los últimos 3 meses)',
  };

  constructor(
    private _projectService: ProjectService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener el RFC desde la URL
    this.rfcRecibido = this.route.snapshot.paramMap.get('rfc') || '';
    console.log('RFC recibido:', this.rfcRecibido);

    // Llamar al servicio para obtener los archivos
    if (this.rfcRecibido) {
      this.getArchiveOld(this.rfcRecibido);
    }
  }

  getArchiveOld(rfc: string) {
    this._projectService.getArchivosOld(rfc).subscribe(
      response => {
        console.log('Archivos recibidos:', response);
        this.archivoOld = response.archivos; // Aquí asignas la respuesta a archivoOld
      },
      error => {
        console.error('Error al obtener archivo old:', error);
      }
    );
  }

  verArchivo(ruta: string) {
    const fileName = ruta.split('/').pop();  // Extraer el nombre del archivo
    const url = `https://proveedores-grupo-sacmag.com.mx/api/archiveOld/${fileName}`;
    console.log('Redirigiendo a:', url);
    window.location.href = url; // Redirige a la URL del archivo
  }

  viewFile(nombreArchivo: string): void {
    this._projectService.OldArchivo(nombreArchivo).subscribe(
      (response: Blob) => {
        const fileURL = URL.createObjectURL(response);
        window.open(fileURL, '_blank');
      },
      (error) => {
        console.error('Error al visualizar el archivo:', error);
      }
    );
  }

  // Método para obtener las claves del objeto archivoOld
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
