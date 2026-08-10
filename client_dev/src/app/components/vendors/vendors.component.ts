import { Component, OnInit } from '@angular/core';
import { Proveedor } from '../../models/vendor';
import { ProjectService } from '../../services/project.service';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Archivo } from 'src/app/models/archive';
import * as JSZip from 'jszip';
import { Router } from '@angular/router';
import { Usuario } from '../../models/user';
@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css'],
  providers: [ProjectService]
})
export class VendorsComponent implements OnInit {
  public vendors: Proveedor[];
  public identity;
  public archivos: Archivo;
  public originalVendors: Proveedor[] = [];
  public mosaicoView: boolean = true; // Variable para controlar la vista
  public archivosMap: { [rfc: string]: Archivo } = {};
  // --- Alerta de Mantenimiento ---
  public maintenanceAlertVisible: boolean = true;
  public maintenanceAlertShrunk: boolean = false;

  // --- VARIABLE NUEVA PARA NOTAS ---
  public showPatchNotes: boolean = false;

  search = new FormControl('');
  filtroValor = '';
  regimenFiltroActivo: boolean = false;
  filtroValind: boolean = false;

  constructor(private _projectService: ProjectService, private router: Router) {
    this.vendors = [];
    this.identity = this._projectService.getIdentity();

    this.archivos = new Archivo('','','','','','','','','','','','','','','','','', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, false, false);
    this.identity = new Usuario("","","","","","","","","","",false);
    this.identity = this._projectService.getIdentity();
  }

  ngOnInit(): void {
    if (this._projectService.getToken() != undefined) {
      this.getVendors();
    }

    this.search.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.searchVendors(value);
    });

    // Lógica para la alerta de mantenimiento
    setTimeout(() => {
      this.maintenanceAlertShrunk = true;
    }, 5000); // La alerta se encoge después de 5 segundos

    // --- LÓGICA NUEVA PARA NOTAS DEL PARCHE ---
    // Definimos una clave única para esta versión de las notas
    const patchNotesKey = 'patchNotes_v20251027'; // (Puedes cambiar esta clave si haces futuras notas)

    // Comprobamos si el usuario ya vio estas notas
    const hasSeenNotes = localStorage.getItem(patchNotesKey);

    if (!hasSeenNotes) {
      // Si no las ha visto, mostramos el modal
      this.showPatchNotes = true;
    }
    // --- FIN DE LÓGICA NUEVA ---
  }

  descargarZIP(): void {
    const zip = new JSZip();

    this.vendors.forEach((vendor, index) => {
      zip.file(`proveedor_${index + 1}.txt`, JSON.stringify(vendor));
    });

    zip.generateAsync({ type: 'blob' })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'proveedores.zip';
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
      })
      .catch((error) => console.error('Error al generar el archivo ZIP', error));
  }

  getAllArchives(rfc:any){

    this._projectService.getAllArchives(localStorage.getItem("rfc")).subscribe(
      response=>{

      },error =>{
        console.log(<any>error);

      }
    )
  }
getVendors() {
  this._projectService.getVendorsWithArchives().subscribe(
    response => {
      if (response.vendorsWithArchives) {
        this.vendors = response.vendorsWithArchives.map((item: any) => item.vendor);
        this.originalVendors = [...this.vendors];

        this.archivosMap = {};
        response.vendorsWithArchives.forEach((item: any) => {
          this.archivosMap[item.vendor.rfc.toLowerCase().trim()] = item.archive;
         // console.log('Archivo para RFC ' + item.vendor.rfc + ':', item.archive);
        });
      }
    },
    error => {
      console.log(error);
    }
  );
}



  handleSearch(value: any) {
    this.filtroValor = value;
  }
  searchVendors(value: string) {
    // Convertir el valor de búsqueda a minúsculas para una comparación sin distinción entre mayúsculas y minúsculas
    const searchValue = value.toLowerCase();

    // Filtrar la lista de proveedores originales en base al valor de búsqueda
    this.vendors = this.originalVendors.filter(vendor =>
      // Realizar la búsqueda en todas las propiedades del proveedor
      Object.values(vendor).some(prop =>
        // Convertir el valor de la propiedad a texto en minúsculas y verificar si incluye el valor de búsqueda
        prop.toString().toLowerCase().includes(searchValue)
      )
    );
  }

 //Metodo para router
 goToRegisterProv(){
    this.router.navigate(['/registro']);
   }
 goToRegisterUse(){
    this.router.navigate(['/registro-usuarios']);
   }

  //Aqui empiezan los filtros de la botonera


  // Filtro: Solo aceptados (validar === true)
filterValidArchives() {
  this.vendors = this.originalVendors.filter(vendor => {
    const archivo = this.archivosMap[vendor.rfc.toLowerCase().trim()];
    return archivo?._id && archivo.validar === true;
  });
}

// Filtro: Solo revisión pendiente (validar === false)
filterPendingArchives() {
  this.vendors = this.originalVendors.filter(vendor => {
    const archivo = this.archivosMap[vendor.rfc.toLowerCase().trim()];
    return archivo?._id && archivo.validar === false;
  });
}

// Filtro: Solo inválidos (sin archivo o validar no está definido)
filterInvalidArchives() {
  this.vendors = this.originalVendors.filter(vendor => {
    const archivo = this.archivosMap[vendor.rfc.toLowerCase().trim()];
    return !archivo || archivo._id === ''
  });
}
  //Regresas a todos
  showAllVendors() {
    this.vendors = [...this.originalVendors];
  }

    getArchives(rfc:string){
    var files = document.querySelectorAll('.file');
    const empresa = this.identity?.empresa || 'todas';
    this._projectService.getArchives(rfc, empresa).subscribe(
      response=>{


        this.archivos = response.archives;


      for(var i = 0; i < files.length;i++){
        var file = <HTMLInputElement> files[i];
        file.style.display= 'none';
    }


      },error=>{
        console.log(<any>error);

      })
  }


  //Filtros regimen fiscal
  filterRegimenM(){
    this.regimenFiltroActivo = !this.regimenFiltroActivo;

    if(this.regimenFiltroActivo){
      this.vendors = [...this.originalVendors];

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "moral");
    } else if(this.filtroValind || !this.regimenFiltroActivo){

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "moral");
    }
    else
    {
      this.vendors = [...this.originalVendors];

    }
  }


  filterRegimenF() {
    this.regimenFiltroActivo = !this.regimenFiltroActivo;

    if(this.regimenFiltroActivo){
      this.vendors = [...this.originalVendors];

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "fisica");
    } else if(this.filtroValind || this.regimenFiltroActivo){

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "fisica");
    }
    else
    {
      this.vendors = [...this.originalVendors];

    }
  }

  filterRegimenR() {
    this.regimenFiltroActivo = !this.regimenFiltroActivo;

    if(this.regimenFiltroActivo){
      this.vendors = [...this.originalVendors];

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "repse");
    } else if(this.filtroValind || this.regimenFiltroActivo){

      this.vendors = this.vendors.filter(vendor => vendor.regimenFiscal == "repse");
    }
    else
    {
      this.vendors = [...this.originalVendors];

    }
  }

  // Método que compara RFC y Registro Patronal
esRFCyRegistroDiferente(vendor: Proveedor): string {
  if (!vendor.rfc || !vendor.registroPatronal) {
    return "NO"; // si falta un dato, asumimos NO
  }

  // Normalizar datos (quitar espacios, pasar a minúsculas)
  const rfc = vendor.rfc.toLowerCase().trim();
  const regPat = vendor.registroPatronal.toLowerCase().trim();

  // Aquí decides el nivel de "parecido"
  if (rfc.includes(regPat) || regPat.includes(rfc)) {
    return "NO"; // son muy parecidos
  }

  return "SI"; // no se parecen
}


  // supongamos que tu usuario tiene una propiedad 'empresa'
get filteredVendors() {
  return this.vendors
    .filter(v => v.empresa === this.identity.empresa) // solo la misma empresa
    .filter(v => this.filtroValor ? v.razonSocial.toLowerCase().includes(this.filtroValor.toLowerCase()) : true);
}


  // Método para alternar entre vistas
  toggleView() {
    this.mosaicoView = !this.mosaicoView;
  }

  // --- Métodos para la Alerta de Mantenimiento ---
  closeMaintenanceAlert(): void {
    this.maintenanceAlertVisible = false;
  }

  toggleMaintenanceAlert(): void {
    // Permite expandir o encoger la alerta al hacer clic
    this.maintenanceAlertShrunk = !this.maintenanceAlertShrunk;
  }

  // --- MÉTODO NUEVO PARA CERRAR NOTAS ---
  closePatchNotes(): void {
    const patchNotesKey = 'patchNotes_v20251027'; // Debe ser la misma clave que en ngOnInit

    // 1. Ocultamos el modal
    this.showPatchNotes = false;

    // 2. Guardamos en localStorage que ya las vio
    localStorage.setItem(patchNotesKey, 'true');
  }
}
