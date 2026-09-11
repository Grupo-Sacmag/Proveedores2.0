import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { Proveedor } from '../../models/vendor';
import { Global } from '../../services/global';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [ProjectService]
})
export class RegisterComponent implements OnInit {
  public vendor: Proveedor;
  public url: string;
  public identity: any;
  public title: string;
  public cargando: boolean = false;
  public mensaje: string = '';
  public confirmando: boolean = false;
  private formActual: any; // para guardar el form mientras confirmamos
  public tipoMensaje: 'error' | 'exito' | 'info' = 'info';
  public esFisica: boolean = false;
  public tieneRegistroPatronal: boolean | null = null;
  public esSociedadCivil: boolean | null = null;
  public tipoPersonaMoral: 'SC' | 'REPSE' | 'NINGUNO' | null = null;
  tieneRegistro: boolean | null = null;


  constructor(
    private _projectService: ProjectService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this.vendor = new Proveedor('', '', '', '', '', '', '', '', 0, '', false, [''], '', false, new Date());
    this.vendor.archivosRequeridos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    this.asegurarArchivosObligatorios();
    this.url = Global.url;
    this.title = "Registrar";
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      let id = params.id;
      this.identity = this._projectService.getIdentity();
      var element = <HTMLInputElement>document.getElementById("boton");
      element.style.display = 'none';
      if (this.identity['rol'] === "administrador" || this.identity['rol'] === "usuario") {
        element.style.display = 'block';
        this.getVendor(id);


      }
      if (this.identity['rol'] === "proveedor") {
        this.title = "Datos";
        this.vendor.rfc = this.identity['rfc'];
        this.vendor.registroPatronal = this.identity['registroPatronal'];
        var seccion = <HTMLElement>document.querySelector('.registro');
        seccion.style.display = 'none';
      }





    })
  }

  mostrarMensaje(texto: string, tipo: 'error' | 'exito' | 'info' = 'info') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
  }


  cerrarMensaje() {
    this.mensaje = '';
  }
  onSubmit(form: any) {
    this.formActual = form;
    this.confirmando = true; // Mostrar modal de confirmación
  }

  // Funciones para el modal de confirmación
  confirmarEnviar() {
    this.confirmando = false;
    this.procesarEnvio(this.formActual);
  }

  cancelarEnviar() {
    this.confirmando = false;
  }

  procesarEnvio(form: any) {
    this.cargando = true;

    setTimeout(() => {
      this.vendor.empresa = this.identity['empresa'];

      // 1️⃣ Validar RFC vs Registro Patronal
      if (this.similitudMaxima(this.vendor.rfc, this.vendor.registroPatronal)) {
        this.cargando = false;
        this.mostrarMensaje(
          "Registro Patronal no válido, parecen ser muy similar al RFC, ingresa la información correcta",
          'error'
        );
        return;
      }

      // 2️⃣ Validar teléfono
      if (!this.validarTelefono(this.vendor.telefono?.toString())) {
        this.cargando = false;
        this.mostrarMensaje("El teléfono ingresado no es válido", 'error');
        return;
      }

      if (!this.validarRegistroPatronal(
        this.vendor.registroPatronal,
        this.vendor.regimenFiscal,
        this.vendor.rfc,
        this.vendor.razonSocial
      )) {
        this.cargando = false;
        this.mostrarMensaje("El Registro Patronal ingresado no es válido", 'error');
        return;
      }
      // 3️⃣ Validar Registro Patronal
      const validacion = this.validarRegistroPatronal(
        this.vendor.registroPatronal,
        this.vendor.regimenFiscal,
        this.vendor.rfc,
        this.vendor.razonSocial
      );

      if (!validacion.valido) {
        this.cargando = false;
        this.mostrarMensaje(validacion.mensaje || "El Registro Patronal ingresado no es válido", 'error');
        return;
      }
      // 4️⃣ Validar nombre de contacto
      if (!this.validarContacto(this.vendor.nombreContacto)) {
        this.cargando = false;
        this.mostrarMensaje("El nombre de contacto ingresado no es válido", 'error');
        return;
      }
      this._projectService.saveVendor(this.vendor).subscribe(
        response => {
          this.cargando = false;
          this.mostrarMensaje('El Proveedor fue registrado correctamente', 'exito');

          // Reiniciar página después de un pequeño delay para que se vea el mensaje
          setTimeout(() => {
            window.location.reload();
          }, 1000); // 1 segundo de delay para que el usuario vea el mensaje
        },
        error => {
          this.cargando = false;
          this.mostrarMensaje('Ocurrió un error: ' + (error.error?.message || error.message), 'error');
        }
      );

    }, 0);
  }


  getVendor(id: any) {
    this._projectService.getVendor(id).subscribe(
      response => {

        this.vendor = response.vendor;
        if (response.vendor) {
          this.title = "Datos";
        }


      }, error => {
        console.log(<any>error);
      }
    )
  }
  valid() {
    if (this.vendor.rfc.length < 12 || this.vendor.rfc.length > 13) {
      this.vendor.rfc = '';
    }
  }

  similitudMaxima(rfc: string, patronal: string): boolean {
    if (!rfc || !patronal) return false;

    // Convertir a mayúsculas y quitar espacios
    rfc = rfc.toUpperCase().trim();
    patronal = patronal.toUpperCase().trim();

    const minLength = Math.min(rfc.length, patronal.length);
    let coincidencias = 0;

    // Contar coincidencias en los primeros minLength caracteres
    for (let i = 0; i < minLength; i++) {
      if (rfc[i] === patronal[i]) coincidencias++;
    }

    const porcentaje = (coincidencias / minLength) * 100;
    return porcentaje > 50;
  }

  // Valida teléfono
  validarTelefono(tel: string): boolean {
    const regex = /^\d{10}$/; // Debe tener 10 dígitos
    if (!regex.test(tel)) return false;
    if (/^(\d)\1{9}$/.test(tel)) return false; // Evita 0000000000 o 1111111111
    return true;
  }

  // Valida nombre de contacto
  validarContacto(contacto: string): boolean {
    if (contacto.length < 2) return false;
    if (/^([a-zA-Z])\1+$/.test(contacto)) return false; // Evita zzzzz o aaaaa
    return true;
  }

  validarRegistroPatronal(
    patronal: string | undefined,
    regimenFiscal: string,
    rfc?: string,
    razonSocial?: string
  ): { valido: boolean; mensaje?: string } {
    if (!patronal) return { valido: false, mensaje: "El Registro Patronal está vacío" };

    patronal = patronal.toUpperCase().trim();
    rfc = rfc?.toUpperCase().trim();
    razonSocial = razonSocial?.toUpperCase().trim();

    // Caso especial: persona física o moral (S.C.) sin registro
    if ((regimenFiscal === "fisica" || regimenFiscal === "moral") && patronal === "SINREGISTRO") {
      return { valido: true };
    }

    // Palabras prohibidas
    const prohibidas = ["NOTIENE", "NO TIENE", "NOAPLICA", "NO APLICA", "N/A", "NA"];
    if (prohibidas.includes(patronal)) {
      return { valido: false, mensaje: "El Registro Patronal contiene un valor no permitido" };
    }

    // No puede contener espacios
    if (/\s/.test(patronal)) {
      return { valido: false, mensaje: "El Registro Patronal no puede contener espacios" };
    }

    // Formato alfa-numérico flexible
    // Opciones: solo números, 1 letra + números, 2-3 letras + números
    const regexOpciones = [
      /^\d+$/,             // Solo números
      /^[A-Z]\d+$/,        // 1 letra + números
      /^[A-Z]{2}\d+$/    // 2 + números
    ];

    const coincide = regexOpciones.some(rx => rx.test(patronal ?? ''));

    if (!coincide) {
      return { valido: false, mensaje: "El Registro Patronal no sigue un formato válido DE LA FORM: solo números o 1-2 letras al inicio + números" };
    }

    // Evitar que sea igual o demasiado parecido al RFC
    if (rfc && patronal.includes(rfc)) {
      return { valido: false, mensaje: "El Registro Patronal no puede contener el RFC" };
    }

    // Evitar parecido a la Razón Social
    if (razonSocial) {
      const razonNormalizada = razonSocial.replace(/[^A-Z0-9]/g, "");
      const patronalNormalizado = patronal.replace(/[^A-Z0-9]/g, "");
      if (
        patronalNormalizado.includes(razonNormalizada) ||
        razonNormalizada.includes(patronalNormalizado)
      ) {
        return { valido: false, mensaje: "El Registro Patronal no puede ser igual o similar a la Razón Social" };
      }
    }

    return { valido: true };
  }


  onRegimenChange(event: any) {
    const regimen = event.target.value;
    this.vendor.regimenFiscal = regimen; // aseguramos que se guarde
    this.asegurarArchivosObligatorios();

    // Asegurar que el input esté habilitado si se deshabilitó previamente
    const input = document.getElementById('regP') as HTMLInputElement;
    if (input) input.disabled = false;

    if (regimen === 'fisica') {
      this.esFisica = true;
      this.esSociedadCivil = null;
      this.tipoPersonaMoral = null;
      this.tieneRegistroPatronal = null; // Resetear para que aparezca la pregunta en HTML
      this.vendor.registroPatronal = '';
    } else if (regimen === 'moral') {
      this.esFisica = false;
      this.tipoPersonaMoral = null; // Resetear para que aparezca la pregunta de SC/REPSE/Ninguno
      this.esSociedadCivil = null;
      this.tieneRegistroPatronal = null;
      this.vendor.registroPatronal = '';
    } else {
      this.esFisica = false;
      this.tipoPersonaMoral = null;
      this.esSociedadCivil = null;
      this.tieneRegistroPatronal = null;
      this.vendor.registroPatronal = ''; // limpio campo si no es fisica ni moral
    }
  }


  preguntarRegistroPatronal() {
    this.confirmando = true;
    this.mensaje = "¿Cuentas con Registro Patronal?";
    this.tipoMensaje = 'info';
  }

  continuar() {
    if (!this.vendor.regimenFiscal) {
      this.mostrarMensaje("Debes seleccionar un régimen fiscal");
      return;
    }
  }

  seleccionarTipoMoral(tipo: 'SC' | 'REPSE' | 'NINGUNO') {
    this.tipoPersonaMoral = tipo;
    this.esSociedadCivil = (tipo === 'SC');
    this.tieneRegistroPatronal = null; // Resetea para preguntar si cuenta o no con Registro Patronal
    this.vendor.registroPatronal = '';

    this.asegurarArchivosObligatorios();
  }

  confirmarRegistroPatronal(tiene: boolean) {
    this.tieneRegistroPatronal = tiene;

    if (!tiene) {
      // Bloquear el campo y asignar valor por defecto
      this.vendor.registroPatronal = "SINREGISTRO";

      // Bloquear input para que el usuario no escriba
      const input = document.getElementById('regP') as HTMLInputElement;
      if (input) input.disabled = true;

    } else {
      // Limpiar y permitir que lo escriba
      this.vendor.registroPatronal = "";

      const input = document.getElementById('regP') as HTMLInputElement;
      if (input) input.disabled = false;
    }

    this.asegurarArchivosObligatorios();
    this.confirmando = false;
  }

  confirmarSociedadCivil(esSC: boolean) {
    this.esSociedadCivil = esSC;

    if (esSC) {
      // Es S.C. -> No tiene registro patronal (igual que física sin registro)
      this.tieneRegistroPatronal = false;
      this.vendor.registroPatronal = "SINREGISTRO";

      // Bloquear input para que el usuario no escriba
      const input = document.getElementById('regP') as HTMLInputElement;
      if (input) input.disabled = true;

    } else {
      // No es S.C. -> Moral normal con registro patronal
      this.tieneRegistroPatronal = true;
      this.vendor.registroPatronal = "";
      const input = document.getElementById('regP') as HTMLInputElement;
      if (input) input.disabled = false;
    }

    this.confirmando = false;
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
      return true;
    }
    return this.vendor.archivosRequeridos.indexOf(id) !== -1;
  }

  isArchivoObligatorio(id: number): boolean {
    // Documentos base siempre obligatorios para cualquier proveedor:
    // 2. CSF SAT, 4. INE, 6. Comprobante domicilio, 7. Estado de cuenta, 8. Opinión 32D SAT, 14. Código de ética
    const siempreObligatorios = [2, 4, 6, 7, 8, 14];
    if (siempreObligatorios.includes(id)) {
      return true;
    }

    // 5. Acta constitutiva y poder (obligatorio si es Persona Moral)
    if (id === 5 && this.vendor.regimenFiscal === 'moral') {
      return true;
    }

    // 3. Alta IMSS Registro Patronal (obligatorio si cuenta con Registro Patronal)
    if (id === 3 && this.tieneRegistroPatronal === true) {
      return true;
    }

    // 12. Registro REPSE (obligatorio si es REPSE)
    if (id === 12 && this.tipoPersonaMoral === 'REPSE') {
      return true;
    }

    return false;
  }

  asegurarArchivosObligatorios() {
    if (!this.vendor.archivosRequeridos) {
      this.vendor.archivosRequeridos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }

    // Asegurar que todos los obligatorios estén presentes
    for (const doc of this.catalogoDocumentos) {
      if (this.isArchivoObligatorio(doc.id)) {
        if (!this.vendor.archivosRequeridos.includes(doc.id)) {
          this.vendor.archivosRequeridos.push(doc.id);
        }
      }
    }

    // Si es física, retirar acta constitutiva (id: 5)
    if (this.vendor.regimenFiscal === 'fisica') {
      const idx5 = this.vendor.archivosRequeridos.indexOf(5);
      if (idx5 !== -1) {
        this.vendor.archivosRequeridos.splice(idx5, 1);
      }
    }

    // Si no tiene registro patronal, retirar id: 3
    if (this.tieneRegistroPatronal === false) {
      const idx3 = this.vendor.archivosRequeridos.indexOf(3);
      if (idx3 !== -1) {
        this.vendor.archivosRequeridos.splice(idx3, 1);
      }
    }

    this.vendor.archivosRequeridos.sort((a, b) => a - b);
  }

  toggleRequisito(id: number) {
    // Si es obligatorio, no se permite desmarcar
    if (this.isArchivoObligatorio(id)) {
      return;
    }

    if (!this.vendor.archivosRequeridos) {
      this.vendor.archivosRequeridos = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    }
    const idx = this.vendor.archivosRequeridos.indexOf(id);
    if (idx !== -1) {
      this.vendor.archivosRequeridos.splice(idx, 1);
    } else {
      this.vendor.archivosRequeridos.push(id);
      this.vendor.archivosRequeridos.sort((a, b) => a - b);
    }
  }
}
