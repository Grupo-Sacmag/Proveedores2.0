import { Component, OnInit } from '@angular/core';
import { ProjectService } from 'src/app/services/project.service';
import { Proveedor } from 'src/app/models/vendor';
import { Global } from 'src/app/services/global';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { Archivo } from 'src/app/models/archive';
import { UploadService } from 'src/app/services/upload.service';
import { UpperCasePipe } from '@angular/common';
import { empty } from 'rxjs';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { error } from 'console';
import { OldArchivo } from 'src/app/models/oldarchives';
import { Usuario } from 'src/app/models/user';

@Component({
  selector: 'app-archives',
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css'],
  providers: [ProjectService, UploadService]
})
export class ArchivesComponent implements OnInit {
  public vendor: Proveedor;
  public identity: any;
  public archivos: Archivo;
  public url: string;
  public rfc: any;
  public charge: boolean;
  public changeDataEmail: boolean;
  public mostrarConfiguracion: boolean = false;
  public identidad: any;
  public fechArchivo: { [key: string]: string } = {};
  public empresaActiva: string = '';

  public filesToUpload: Array<File[]>;


  constructor(private _projectService: ProjectService,
    private _uploadService: UploadService,
    private _router: Router,
    private _route: ActivatedRoute) {
    // archives.component.ts (dentro de la clase ArchivesComponent)
    // ...
    this.vendor = new Proveedor('', '', '', '', '', '', '', '', 0, '', false, [''], '', false, new Date());

    // ✅ Esta línea está bien (tiene 34 argumentos)
    // (Son 17 '', 15 null, 15 '', y 2 false)

    this.archivos = new Archivo('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, false);
    this.identity = this._projectService.getIdentity();

    this.filesToUpload = [];
    this.url = Global.url;
    this.charge = false;
    this.changeDataEmail = false;
    this.identidad = this._projectService.getIdentity();
    this.identidad = new Usuario("", "", "", "", "", "", "", "", "", "", false);
  }

  mostrar: boolean = true; // al inicio se muestra "HOLA"


  handleFileChange(event: any) {
    const inputName = event.target.name; // nombre del input: archivo1, archivo2, etc.
    const index = parseInt(inputName.replace('archivo', '')) - 1;

    if (event.target.files[0]?.size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      this.filesToUpload[index] = [];
    } else {
      this.filesToUpload[index] = <Array<File>>event.target.files;
    }
  }

  get canEditData(): boolean {
    return (
      this.identity &&
      (this.identity.rol === 'proveedor' || this.identity.rol === 'administrador' || this.identity.rol === 'administrador_premium')
    );
  }

  get canEditAdmin(): boolean {
    return (
      this.identity &&
      (this.identity.rol === 'administrador' || this.identity.rol === 'administrador_premium')
    );
  }

  getFechaCreacion(vendor: any): Date | null {
    if (vendor?.fechaAlta) {
      return new Date(vendor.fechaAlta);
    }
    if (vendor?._id && typeof vendor._id === 'string' && vendor._id.length >= 8) {
      try {
        const timestamp = parseInt(vendor._id.substring(0, 8), 16) * 1000;
        return new Date(timestamp);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  toggle() {
    this.mostrar = !this.mostrar;
  }

  ngOnInit(): void {
    // Limpia el RFC del localStorage solo si NO eres proveedor
    if (this.identity && this.identity.rol === "proveedor" && this.identity.rfc) {
      // Normaliza el RFC
      const rfc = this.identity.rfc.trim().toLowerCase();
      localStorage.setItem('rfc', rfc);

      // Carga los datos del proveedor y sus archivos
      this.getVendorRfc(rfc);
      // No necesitas manipular el DOM aquí, Angular lo hará cuando vendor esté listo
      this.mostrar = true;
    } else {
      // Otros roles: usa el parámetro de la ruta
      this._route.params.subscribe(params => {
        const id = params.id;
        if (id) {
          this.getVendor(id);
        }
      });
    }
  }
  getAllArchives(rfc: any) {

    this._projectService.getAllArchives(localStorage.getItem("rfc")).subscribe(
      response => {

      }, error => {
        console.log(<any>error);

      }
    )
  }

  imprimir() {
    const resumen = document.getElementById("resumen-imprimir");
    if (!resumen) return;

    const rfc = (document.getElementById("rfc") as HTMLInputElement)?.value || '';
    const regpat = (document.getElementById("regpat") as HTMLInputElement)?.value || '';
    const razon = (document.getElementById("razon") as HTMLInputElement)?.value || '';
    const nombre = (document.getElementById("nombre") as HTMLInputElement)?.value || '';
    const correo = (document.getElementById("correo") as HTMLInputElement)?.value || '';
    const tel = (document.getElementById("tel") as HTMLInputElement)?.value || '';
    const tipo = (document.getElementById("tipo") as HTMLSelectElement)?.value || '';
    const regimen = (document.getElementById("regimen") as HTMLSelectElement)?.value || '';

    // ✅ Usamos la variable del componente
    const archivosValidar = this.archivos;
    let estatus = '';
    if (archivosValidar?._id) {
      estatus = archivosValidar.validar
        ? '<span class="alert verde">✅ Archivos Aceptados</span>'
        : '<span class="alert amarillo">📂 Archivos Enviados Pendientes De Revisión</span>';
    } else {
      estatus = '<span class="alert rojo">❌ Sin Archivos, enviar los archivos Correspondientes</span>';
    }

    const contenido = `
    <h1>Archivo de Proveedores</h1>
    <h2>Proveedor ${razon}</h2>
    <h3>Información del proveedor</h3>
    <table>
      <tr><td><strong>RFC:</strong></td><td>${rfc}</td></tr>
      <tr><td><strong>Registro Patronal:</strong></td><td>${regpat}</td></tr>
      <tr><td><strong>Razón Social:</strong></td><td>${razon}</td></tr>
      <tr><td><strong>Nombre Contacto:</strong></td><td>${nombre}</td></tr>
      <tr><td><strong>Correo:</strong></td><td>${correo}</td></tr>
      <tr><td><strong>Teléfono:</strong></td><td>${tel}</td></tr>
      <tr><td><strong>Tipo de Proveedor:</strong></td><td>${tipo}</td></tr>
      <tr><td><strong>Régimen Fiscal:</strong></td><td>${regimen}</td></tr>
    </table>

    <h3>Estatus de Archivos</h3>
    ${estatus}

    <h3>Resumen de Documentos</h3>
    ${resumen.querySelector(".perfil-resumen")?.innerHTML || ''}
  `;

    const ventana = window.open("", "_blank", "width=900,height=650");
    if (!ventana) return;

    ventana.document.open();
    ventana.document.write(`
  <html>
    <head>
      <title>Resumen de Proveedor</title>
   <style>
  @page {
    size: A4 portrait;
    margin: 1.2cm;
  }
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 10px 25px;
    line-height: 1.5;
    color: #333;
    font-size: 22px;
  }
  h1 {
    color: #1976d2;
    text-align: center;
    font-size: 20px;
    margin-bottom: 4px; /* más compacto */
  }
  h2 {
    text-align: center;
    color: #000;
    font-size: 15px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  h3 {
    color: #1976d2;
    margin-bottom: 6px;
    border-bottom: 2px solid #1976d2;
    padding-bottom: 3px;
    margin-top: 18px;
    font-size: 14px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    table-layout: fixed;
  }

td {
  padding: 4px 4px; /* más compacto */
  border: 1px solid #ccc;
  vertical-align: top;
  word-wrap: break-word;
  font-size: 12px; /* texto más chico */
}
  td:first-child {
    font-weight: bold;
    background-color: #f5f5f5;
    width: 32%;
  }
  td:last-child {
    width: 68%;
  }
  .perfil-resumen {
    font-size: 13px;
  }
  .perfil-resumen ol {
    padding-left: 18px;
    margin-top: 8px;
  }
  .perfil-resumen li {
    margin-bottom: 10px;
  }
  .verde { color: green; font-weight: bold; }
  .rojo { color: red; font-weight: bold; }
  .amarillo { color: goldenrod; font-weight: bold; }
  .alert {
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    margin: 5px 0 12px 0;
    font-size: 12px;
    border: 1px solid #ccc;
  }
  .perfil-resumen table {
    width: 100%;
    border: 1px solid #ddd;
    border-collapse: collapse;
    margin-top: 8px;
  }
  .perfil-resumen td {
    padding: 5px;
    font-size: 12.5px;
    border: 1px solid #ccc;
  }
  .section {
    page-break-inside: avoid;
  }
</style>

    </head>
    <body>
      ${contenido}
    </body>
  </html>
`);

    ventana.document.close();
    ventana.print();
  }


  getVendor(id: any) {
    this._projectService.getVendor(id).subscribe(
      response => {
        this.vendor = response.vendor;
        this.asegurarArchivosObligatorios(); // Garantiza obligatoriedad al cargar

        // Normaliza el RFC ANTES de cualquier transformación
        if (this.vendor && this.vendor.rfc) {
          const rfcNormalizado = this.vendor.rfc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase().trim();
          localStorage.setItem('rfc', rfcNormalizado);

          // Inicializar empresaActiva
          if (this.identity && this.identity.rol === 'administrador' && this.identity.empresa?.toLowerCase().trim() !== 'todas') {
            this.empresaActiva = this.identity.empresa?.toLowerCase().trim();
          } else if (this.vendor.empresa && this.vendor.empresa.length > 0) {
            this.empresaActiva = this.vendor.empresa[0] ? String(this.vendor.empresa[0]).toLowerCase().trim() : 'todas';
          } else {
            this.empresaActiva = 'todas';
          }

          this.getArchives(rfcNormalizado, this.empresaActiva);
          this.getAllArchives(rfcNormalizado);
        } else {
          console.warn('El proveedor no tiene RFC definido:', this.vendor);
        }

        // Ahora sí, transforma para mostrar en pantalla
        this.vendor.rfc = this.vendor.rfc.toUpperCase();
        this.vendor.registroPatronal = this.vendor.registroPatronal.toUpperCase();
        this.vendor.razonSocial = this.vendor.razonSocial.toUpperCase();
        this.vendor.nombreContacto = this.vendor.nombreContacto.toUpperCase();
        if (this.vendor.observaciones) {
          this.vendor.observaciones = this.vendor.observaciones.toUpperCase();
        }
        this.vendor.userAlta = this.vendor.userAlta ? this.vendor.userAlta.toLowerCase() : '';
        this.vendor.correo = this.vendor.correo ? this.vendor.correo.toLowerCase() : '';

        if (this.vendor.regimenFiscal == 'fisica') {
          var ocultos = document.querySelectorAll('.ocultar');
          for (var i = 0; i < ocultos.length; i++) {
            var oculto = <HTMLInputElement>ocultos[i];
            oculto.style.display = 'none';
          }
        }
      }, error => {
        console.log(<any>error);
      }
    )
  }
  getVendorRfc(rfc: string) {

    this._projectService.getVendorRfc(rfc).subscribe(
      response => {
        this.vendor = response.vendor;
        this.asegurarArchivosObligatorios();

        this.vendor.rfc = this.vendor.rfc.toUpperCase();
        this.vendor.registroPatronal = this.vendor.registroPatronal.toUpperCase();
        this.vendor.razonSocial = this.vendor.razonSocial.toUpperCase();

        this.vendor.nombreContacto = this.vendor.nombreContacto.toUpperCase();
        if (this.vendor.observaciones) {
          this.vendor.observaciones = this.vendor.observaciones.toUpperCase();
        }

        this.vendor.correo = this.vendor.correo.toLowerCase();

        localStorage.setItem('rfc', this.vendor.rfc);

        // Inicializar empresaActiva
        if (this.identity && this.identity.rol === 'administrador' && this.identity.empresa?.toLowerCase().trim() !== 'todas') {
          this.empresaActiva = this.identity.empresa?.toLowerCase().trim();
        } else if (this.vendor.empresa && this.vendor.empresa.length > 0) {
          this.empresaActiva = this.vendor.empresa[0] ? String(this.vendor.empresa[0]).toLowerCase().trim() : 'todas';
        } else {
          this.empresaActiva = 'todas';
        }

        this.getArchives(this.vendor.rfc.toLowerCase().trim(), this.empresaActiva);
        this.getAllArchives(this.vendor.rfc);
        if (this.vendor.regimenFiscal == 'fisica') {
          var ocultos = document.querySelectorAll('.ocultar');
          for (var i = 0; i < ocultos.length; i++) {
            var oculto = <HTMLInputElement>ocultos[i];
            oculto.style.display = 'none';
          }
        }

      }, error => {
        console.log(<any>error);
      }
    )
  }

  getArchives(rfc: string, empresa: string) {
    // Obtener los inputs de archivo
    const files = document.querySelectorAll('.file');

    // Llamada principal para traer los nombres de los archivos
    this._projectService.getArchives(rfc, empresa).subscribe(
      response => {
        this.archivos = response.archives;

        // Ocultar todos los inputs file, SÓLO si el rol NO es 'proveedor'
        if (this.identity && this.identity.rol !== 'proveedor') {
          var files = document.querySelectorAll<HTMLInputElement>('.file');
          for (var i = 0; i < files.length; i++) {
            files[i].style.display = 'none';
          }
        }

        // Inicializar objeto fechasArchivos si aún no existe
        if (!this.fechArchivo) {
          this.fechArchivo = {};
        }

        // Recorrer cada archivo y pedir su fecha
        for (let i = 1; i <= 15; i++) {
          const fileName = (this.archivos as any)[`archivo${i}`];

          if (fileName && fileName !== '') {
            // Petición al backend para traer la fecha
            this._projectService.getFechaArchivoPorNombre(fileName).subscribe(
              res => {
                // Guardar la fecha directamente como string sin conversión
                this.fechArchivo[`archivo${i}`] = res.fecha;
                //  console.log(`Fecha para archivo${i}:`, res.fecha);
              },
              err => {
                //  console.warn(`No se encontró fecha para archivo${i}:`, fileName, err);
                // Opcional: limpiar fecha si no existe
                this.fechArchivo[`archivo${i}`] = '';
              }
            );
          } else {
            // Limpiar si no hay archivo
            this.fechArchivo[`archivo${i}`] = '';
          }
        }
      },
      error => {
        console.warn('No se encontraron archivos para esta empresa, mostrando formulario limpio:', error);
        // Limpiamos los archivos y fechas para mostrar el formulario de carga inicial
        this.archivos = new Archivo('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, false);
        this.fechArchivo = {};
      }
    );
  }


  obtenerArchivo(archivo: string) {
    this._projectService.getArchive(archivo).subscribe(
      response => {
      }, error => {
        console.log(<any>error);
      }
    )
  }

  onSubmit1() {
    if (this.filesToUpload[0].length != 0 && this.filesToUpload[1].length != 0) {
      var opcion = confirm("¿Estás seguro de enviar la información?");
      if (opcion == true) {
        this.charge = true;
        this._uploadService.makeFileRequest(Global.url + "subir-archivos/" + localStorage.getItem('rfc') + "/" + this.empresaActiva, [], this.filesToUpload).then((result: any) => {
          this.refresh();
          this.charge = false;
          alert('Los archivos fueron enviados exitosamente');

        }, error => {
          console.log(error);
          alert('Ocurrió un error ' + error);
          this.charge = false;
        })
      }
    }
  }
  onSubmit() {
    // Verificar que todos los campos de archivos tengan al menos un archivo seleccionado
    const allFilesSelected = Array.from({ length: 15 }).every((_, i) =>
      this.filesToUpload[i] && this.filesToUpload[i].length > 0
    );

    if (allFilesSelected) {
      const opcion = confirm("¿Estás seguro de enviar la información?");
      if (opcion) {
        this.charge = true;
        this._uploadService.makeFileRequest(
          Global.url + "subir-archivos/" + localStorage.getItem('rfc') + "/" + this.empresaActiva,
          [],
          this.filesToUpload
        )
          .then((result: any) => {
            this.refresh();
            this.charge = false;
            alert('Los archivos fueron enviados exitosamente');
          })
          .catch(error => {
            console.log(error);
            alert('Ocurrió un error ' + error);
            this.charge = false;
          });
      }
    } else {
      alert('Recuerda llenar todos los campos, si un archivo no aplica a tu caso, selecciona un archivo PDF en blanco. Si estas actualizando, ignora este mensaje');
    }
  }



  fileChangeEvent1(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[0] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[0] = [];
    } else {
      this.filesToUpload[0] = <Array<File>>fileInput.target.files;

    }
  }
  fileChangeEvent2(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[1] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[1] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent3(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[2] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[2] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent4(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[3] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[3] = <Array<File>>fileInput.target.files;
    }



  }
  fileChangeEvent5(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[4] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[4] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent6(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[5] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[5] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent7(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[6] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[6] = <Array<File>>fileInput.target.files;
    }

  }
  fileChangeEvent8(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[7] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[7] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent9(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[8] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[8] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent10(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[9] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[9] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent11(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[10] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[10] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent12(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[11] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[11] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent13(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[12] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[12] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent14(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[13] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[13] = <Array<File>>fileInput.target.files;
    }


  }
  fileChangeEvent15(fileInput: any) {
    if (fileInput.target.files[0].size > 5000000) {
      alert('El archivo excede el tamaño permitido de 5 MB, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
      this.filesToUpload[14] = [];
    }
    else if (!fileInput.target.files[0].name.toLowerCase().endsWith('.pdf')) {
      alert('El archivo debe ser un PDF, selecciona un archivo válido');
      fileInput.target.value = ''; // Limpiar el input
    } else {
      this.filesToUpload[14] = <Array<File>>fileInput.target.files;
    }


  }

  habilitar() {
    var opcion = confirm("¿Estás seguro de modificar la información?");
    if (opcion == true) {
      var files = document.querySelectorAll('.file');
      for (var i = 0; i < files.length; i++) {
        var file = <HTMLInputElement>files[i];
        file.style.display = 'block';
      }
    }


  }
  rechazar() {
    var mensaje = prompt("Redactar motivo por el rechazo de archivos?");
    var opcion = confirm("¿Estás seguro de enviar la  información?");
    if (opcion == true) {
      this._projectService.refuseArchives(this.vendor.rfc, mensaje, this.empresaActiva).subscribe(
        response => {
          alert('Los archivos fueron rechazados exitosamente');
          this.refresh();

        },
        error => {
          alert('Ocurrió un error: ' + error.error.message);

        }
      )
    }
  }
  validar() {
    if (this.identity['rol'] === "administrador" || this.identity['rol'] === "usuario") {
      var opcion = confirm("¿Estás seguro de enviar la  información?");
      if (opcion == true) {
        this._projectService.validateArchives(this.vendor.rfc, this.empresaActiva).subscribe(
          response => {
            alert('Los archivos fueron validados correctamente');
            this.refresh();

          },
          error => {
            alert('Ocurrió un error: ' + error.error.message);

          }
        )
      }

    } else {
      alert('No tienes permisos suficientes');
    }
  }
  updateExistingFiles() {
    if (this.filesToUpload[0] && this.filesToUpload[0].length > 0) {
      alert("No hay archivos seleccionados para actualizar.");
      return;
    }

    const rfc = localStorage.getItem('rfc') ?? '';

    const archivos: { [key: string]: File } = {};

    for (let i = 0; i < this.filesToUpload.length; i++) {
      if (this.filesToUpload[i] && this.filesToUpload[i].length > 0) {
        archivos[`archivo${i + 1}`] = this.filesToUpload[i][0];
      }
    }

    if (Object.keys(archivos).length === 0) {
      alert('Debes seleccionar al menos un archivo válido para actualizar.');
      return;
    }

    const opcion = confirm('¿Estás seguro de actualizar los archivos existentes?');
    if (!opcion) return;

    this.charge = true;
    this._projectService.updateArchives(rfc, archivos, this.empresaActiva).subscribe({
      next: () => {
        alert('Archivos actualizados correctamente');
        this.charge = false;
        this.refresh();
      },
      error: (error) => {
        console.error(error);
        alert('Error al actualizar archivos');
        this.charge = false;
      }
    });
  }


  refresh(): void { window.location.reload(); }
  onSubmitU() {
    if (!this.canEditData) {
      alert('No tienes permisos para modificar esta información.');
      return;
    }

    if (this.changeDataEmail === true) {
      const emailchange = confirm(
        'Se detectó cambio de correo, ¿Deseas reenviar la información al nuevo correo del proveedor?'
      );
      this.changeDataEmail = emailchange;
    }

    const opcion = confirm('¿Estás seguro de guardar la información?');
    if (!opcion) {
      return;
    }

    // Normalizar campos antes de enviar
    if (this.vendor.rfc) this.vendor.rfc = this.vendor.rfc.trim().toLowerCase();
    if (this.vendor.correo) this.vendor.correo = this.vendor.correo.trim().toLowerCase();
    if (this.vendor.registroPatronal) this.vendor.registroPatronal = this.vendor.registroPatronal.trim();
    if (this.vendor.razonSocial) this.vendor.razonSocial = this.vendor.razonSocial.trim();
    if (this.vendor.tipoProveedor) this.vendor.tipoProveedor = this.vendor.tipoProveedor.trim();
    if (this.vendor.regimenFiscal) this.vendor.regimenFiscal = this.vendor.regimenFiscal.trim();
    if (this.vendor.nombreContacto) this.vendor.nombreContacto = this.vendor.nombreContacto.trim();
    if (this.vendor.observaciones) this.vendor.observaciones = this.vendor.observaciones.trim();

    this._projectService.updateVendor(this.vendor, this.changeDataEmail).subscribe(
      response => {
        alert('La información del proveedor se actualizó correctamente.');
        this.refresh();
        this.changeDataEmail = false;
      },
      error => {
        alert('Ocurrió un error: ' + (error.error?.message || error.message));
      }
    );
  }

  onSubmitUpdate() {
    const rfc = localStorage.getItem('rfc') ?? '';

    if (!rfc) {
      alert('No se encontró el RFC en el almacenamiento local.');
      return;
    }

    const archivos: { [key: string]: File } = {};

    for (let i = 0; i < this.filesToUpload.length; i++) {
      if (this.filesToUpload[i] && this.filesToUpload[i].length > 0) {
        archivos[`archivo${i + 1}`] = this.filesToUpload[i][0];
      }
    }

    if (Object.keys(archivos).length === 0) {
      alert('Debes seleccionar al menos un archivo válido para actualizar.');
      return;
    }

    const opcion = confirm('¿Estás seguro de actualizar los archivos existentes?');
    if (!opcion) return;

    this.charge = true;
    this._projectService.updateArchives(rfc, archivos, this.empresaActiva).subscribe({
      next: () => {
        alert('Archivos actualizados correctamente');
        this.charge = false;
        this.refresh();
      },
      error: (error) => {
        console.error(error);
        alert('Error al actualizar archivos: ' + error.error.message);
        this.charge = false;
      }
    });
  }

  changeData() {
    this.changeDataEmail = true;

  }

  getArchiveOld(rfc: string) {
    this._projectService.getArchivosOld(rfc).subscribe(
      response => {
        // console.log('Archivo old:', response); // puedes guardarlo en una variable si quieres
        // this.archivoOld = response.archivoOld;
      },
      error => {
        console.log('Error al obtener historial de archivos:', error);
      }
    );
  }

  // archives.component.ts (dentro de la clase ArchivesComponent)

  /**
   * Se llama desde el botón en el HTML para validar o desvalidar un archivo.
   * @param fileIndex El número de archivo (1-15)
   */
  toggleValidacion(fileIndex: number) {
    if (!this.archivos || !this.vendor) return;

    // 1. Determina el estado actual y el nuevo estado
    const rfc = this.vendor.rfc.toLowerCase().trim(); // Usa el RFC normalizado
    const currentValidField = `validacion${fileIndex}` as keyof Archivo;
    const isCurrentlyValid = this.archivos[currentValidField] as boolean;
    const newValidState = !isCurrentlyValid; // Invierte el estado

    // 2. Mensaje de confirmación
    const actionText = newValidState ? 'VALIDAR' : 'MARCAR COMO PENDIENTE';
    const opcion = confirm(`¿Estás seguro de ${actionText} este archivo?`);

    if (opcion && rfc) {
      // 3. Llama al servicio
      this._projectService.toggleFileValidation(rfc, fileIndex, newValidState, this.empresaActiva).subscribe(
        response => {
          // 4. Actualiza el objeto local SIN recargar toda la página
          if (response.archive) {
            this.archivos = response.archive; // El backend nos devuelve el objeto actualizado
            alert(`Archivo ${actionText.toLowerCase()} correctamente.`);
          }
        },
        error => {
          console.error(error);
          alert('Ocurrió un error al actualizar el estado: ' + error.error.message);
        }
      );
    }
  }

  // archives.component.ts

  // NUEVA FUNCIÓN PARA VALIDAR
  validarArchivo(fileIndex: number) {
    if (!this.archivos || !this.vendor) return;

    const rfc = this.vendor.rfc.toLowerCase().trim();
    // 1. Llama al servicio con 'true'
    this._projectService.toggleFileValidation(rfc, fileIndex, true, this.empresaActiva).subscribe(
      response => {
        if (response.archive) {
          this.archivos = response.archive; // Actualiza el objeto local
          alert(`Archivo VALIDADO correctamente.`);
        }
      },
      error => {
        console.error(error);
        alert('Ocurrió un error al validar: ' + error.error.message);
      }
    );
  }

  // NUEVA FUNCIÓN PARA RECHAZAR
  rechazarArchivo(fileIndex: number) {
    if (!this.archivos || !this.vendor) return;

    const rfc = this.vendor.rfc.toLowerCase().trim();
    const opcion = confirm("¿Estás seguro de RECHAZAR este archivo? Esta acción no se puede deshacer.");

    if (opcion && rfc) {
      // 2. Llama al servicio con 'false'
      this._projectService.toggleFileValidation(rfc, fileIndex, false, this.empresaActiva).subscribe(
        response => {
          if (response.archive) {
            this.archivos = response.archive; // Actualiza el objeto local
            alert(`Archivo RECHAZADO correctamente.`);
          }
        },
        error => {
          console.error(error);
          alert('Ocurrió un error al rechazar: ' + error.error.message);
        }
      );
    }
  }

  iraCheques(rfc: string) {
    this._router.navigate(['/cheque', rfc]);
  }

  irAHistorial(rfc: string) {
    this._router.navigate(['/historial-archivos', rfc]);
  }

  irAWorkOrders() {
    this._router.navigate(['/workorders', this.vendor.rfc, this.empresaActiva]);
  }

  openedDetails: boolean[] = Array(15).fill(false);

  toggleDetails(index: number, event: Event) {
    const isOpen = (event.target as HTMLDetailsElement).open;

    // Si es el último (15), solo él se abre/cierra
    if (index === 14) {
      this.openedDetails[14] = isOpen;
      return;
    }

    // Si es par (derecha: 2, 4, 6...), controla el par izquierdo también
    if ((index + 1) % 2 === 0) {
      this.openedDetails[index] = isOpen;
      this.openedDetails[index - 1] = isOpen;
    } else {
      // Si es impar (izquierda: 1, 3, 5...)
      this.openedDetails[index] = isOpen;
      this.openedDetails[index + 1] = isOpen;
    }
  }

  public catalogoDocumentos = [
    { id: 1, nombre: 'Formato requisitado para alta del proveedor' },
    { id: 2, nombre: 'Constancia de situación fiscal SAT' },
    { id: 3, nombre: 'Alta imss registro patronal' },
    { id: 4, nombre: 'Ine representante legal' },
    { id: 5, nombre: 'Acta constitutiva y poder rep legal' },
    { id: 6, nombre: 'Comprobante de domicilio fiscal' },
    { id: 7, nombre: 'Estado de cuenta con CLABE' },
    { id: 8, nombre: 'Opinión de cumplimiento 32D SAT' },
    { id: 9, nombre: 'Opinión de cumplimiento 32D IMSS' },
    { id: 10, nombre: 'Opinión de cumplimiento 32D INFONAVIT' },
    { id: 11, nombre: 'Curriculum/cédula' },
    { id: 12, nombre: 'Registro REPSE' },
    { id: 13, nombre: 'Especificaciones de calibración' },
    { id: 14, nombre: 'Contrato y código de ética' },
    { id: 15, nombre: 'Última declaración anual' }
  ];

  isArchivoRequerido(id: number): boolean {
    if (!this.vendor || !this.vendor.archivosRequeridos) {
      return true; // Por defecto requiere todos
    }
    return this.vendor.archivosRequeridos.indexOf(id) !== -1;
  }

  isArchivoObligatorio(id: number): boolean {
    return false;
  }

  asegurarArchivosObligatorios() {
    if (!this.vendor) return;
    let requeridos = this.vendor.archivosRequeridos || [];
    requeridos.sort((a, b) => a - b);
    this.vendor.archivosRequeridos = requeridos;
  }

  toggleRequisito(id: number) {
    if (!this.vendor.archivosRequeridos) {
      this.vendor.archivosRequeridos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }
    const idx = this.vendor.archivosRequeridos.indexOf(id);
    if (idx !== -1) {
      this.vendor.archivosRequeridos.splice(idx, 1);
    } else {
      this.vendor.archivosRequeridos.push(id);
      this.vendor.archivosRequeridos.sort((a, b) => a - b);
    }
  }

  guardarRequisitos() {
    if (!this.vendor || !this.vendor._id) return;
    this._projectService.updateVendor(this.vendor, false).subscribe(
      response => {
        alert('Requisitos de archivos actualizados correctamente.');
      },
      error => {
        console.error('Error al actualizar requisitos:', error);
        alert('Error al actualizar los requisitos.');
      }
    );
  }

  descargarZip() {
    if (!this.vendor || !this.vendor.rfc) return;
    const rfc = this.vendor.rfc.toLowerCase().trim();
    this._projectService.descargarProveedorZip(rfc, this.empresaActiva).subscribe(
      blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rfc.toUpperCase()}_documentos.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error => {
        console.error('Error al descargar el archivo ZIP:', error);
        alert('Ocurrió un error al descargar el archivo ZIP.');
      }
    );
  }

  cambiarEmpresaActiva(empresa: any) {
    if (!this.vendor || !this.vendor.rfc) return;
    const empStr = String(empresa).toLowerCase().trim();
    this.empresaActiva = empStr;
    // Limpiamos temporalmente para evitar parpadeos de archivos de la empresa anterior
    this.archivos = new Archivo('', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, false);
    this.fechArchivo = {};
    const rfcNormalizado = this.vendor.rfc.toLowerCase().trim();
    this.getArchives(rfcNormalizado, this.empresaActiva);
  }
}
