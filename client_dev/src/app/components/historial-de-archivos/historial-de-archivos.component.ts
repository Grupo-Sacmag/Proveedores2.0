import { Component, OnInit } from '@angular/core';
import { ProjectService } from 'src/app/services/project.service'; // Asegúrate de que esta ruta sea correcta
import { ActivatedRoute } from '@angular/router';
import { Global } from 'src/app/services/global';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

    // ===== NUEVAS VARIABLES DE UI =====
  grupos: any[] = [];
  cargando: boolean = true;
  requeridos: number[] | null = null;
  soloRequeridos: boolean = true;
  archivoActual: any = null;
  fechas: { [nombre: string]: string } = {};
  empresas: string[] = [];
  empresaActiva: string = '';
  rfcNorm: string = '';

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
        this.cargarDatosExtra(rfc);
      },
      error => {
        console.error('Error al obtener archivo old:', error);
        this.cargarDatosExtra(rfc);
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

    // ===== NUEVOS MÉTODOS =====

  // Trae vendor (requeridos + empresa) y el archivo actual, luego arma la lista
    cargarDatosExtra(rfc: string) {
    this.rfcNorm = (rfc || '').trim().toLowerCase();

    this._projectService.getVendorRfc(this.rfcNorm).pipe(
      catchError(() => of(null))
    ).subscribe((resV: any) => {
      const vendor = resV ? resV.vendor : null;

      this.requeridos = vendor && vendor.archivosRequeridos && vendor.archivosRequeridos.length
        ? vendor.archivosRequeridos
        : null;

      // Empresas del proveedor (sin vacías ni repetidas)
      let lista: string[] = (vendor && vendor.empresa ? vendor.empresa : [])
        .filter((e: any) => !!e)
        .map((e: any) => String(e).toLowerCase().trim())
        .filter((e: string, i: number, arr: string[]) => arr.indexOf(e) === i);

      // Un administrador limitado a una empresa solo ve esa
      const identity = this._projectService.getIdentity();
      if (identity && identity.rol === 'administrador' && identity.empresa &&
          String(identity.empresa).toLowerCase().trim() !== 'todas') {
        lista = [String(identity.empresa).toLowerCase().trim()];
      }

      if (!lista.length) { lista = ['todas']; }
      this.empresas = lista;

      // Empresa pedida por la URL (?empresa=xxx), si es válida
      const pedida = (this.route.snapshot.queryParamMap.get('empresa') || '').toLowerCase().trim();
      this.empresaActiva = lista.indexOf(pedida) !== -1 ? pedida : lista[0];

      this.cargarArchivoActual();
    });
  }

  cargarArchivoActual() {
    this._projectService.getArchives(this.rfcNorm, this.empresaActiva).pipe(
      catchError(() => of(null))
    ).subscribe((resA: any) => {
      this.archivoActual = resA && resA.archives ? resA.archives : {};
      this.construirGrupos();
      this.cargando = false;
    });
  }

  cambiarEmpresa(empresa: string) {
    if (empresa === this.empresaActiva) { return; }
    this.empresaActiva = empresa;
    this.cargarArchivoActual();
  }

    construirGrupos() {
    const old: any = this.archivoOld || {};
    const actual: any = this.archivoActual || {};
    const lista: any[] = [];

    for (let i = 1; i <= 15; i++) {
      const key = 'archivo' + i;
      const versiones: any[] = old[key] || [];
      const previo = this.grupos.find(x => x.key === key);
      const grupo = {
        key: key,
        numero: i,
        titulo: (this.archivoDescripcion[key] || key).replace(/^\d+\.\s*/, ''),
        actual: actual[key] ? { nombre: actual[key] } : null,
        historial: versiones.map((v: any) => ({
          nombre: this.nombreDesdeRuta(v.ruta),
          ruta: v.ruta
        })),
        abierto: previo ? previo.abierto : false
      };
      if (grupo.abierto && grupo.actual) { this.cargarFecha(grupo.actual.nombre); }
      lista.push(grupo);
    }
    this.grupos = lista;
  }

  get gruposVisibles(): any[] {
    const req = this.requeridos;
    if (this.soloRequeridos && req) {
      return this.grupos.filter(g => req.indexOf(g.numero) !== -1);
    }
    return this.grupos;
  }

  trackByKey(index: number, g: any): string {
    return g.key;
  }

  toggleGrupo(g: any) {
    g.abierto = !g.abierto;
    if (g.abierto) {
      if (g.actual) { this.cargarFecha(g.actual.nombre); }
      g.historial.forEach((h: any) => this.cargarFecha(h.nombre));
    }
  }

  cargarFecha(nombre: string) {
    if (!nombre || this.fechas[nombre] !== undefined) { return; }
    this.fechas[nombre] = '';
    this._projectService.getFechaArchivoPorNombre(nombre).subscribe(
      res => { this.fechas[nombre] = res && res.fecha ? res.fecha : ''; },
      () => { this.fechas[nombre] = ''; }
    );
  }

  formatearFecha(valor: string): string {
    if (!valor) { return 'Fecha no disponible'; }
    const d = new Date(valor);
    if (isNaN(d.getTime())) { return valor; }
    return d.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  nombreDesdeRuta(ruta: string): string {
    return (ruta || '').split('/').pop() || '';
  }

  // Ver el archivo ACTUAL (endpoint existente archivos/:file)
  verActual(nombreArchivo: string): void {
    this._projectService.getArchive(nombreArchivo).subscribe(
      (response: Blob) => {
        const fileURL = URL.createObjectURL(response);
        window.open(fileURL, '_blank');
      },
      (error) => {
        console.error('Error al visualizar el archivo actual:', error);
      }
    );
  }
}
