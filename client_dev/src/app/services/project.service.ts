import { OldArchivo } from '../models/oldarchives';
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpEvent } from "@angular/common/http";
import { Observable } from 'rxjs';
import { Usuario } from '../models/user';
import { Proveedor } from "../models/vendor";
import { Archivo } from "../models/archive";
import { catchError, map } from 'rxjs/operators';

import { Global } from "./global";
import { file } from 'jszip';

@Injectable()
export class ProjectService {
  public url: string;
  public identity: any;
  public token: any;
  public rfc: any;

  constructor(public _http: HttpClient) {
    this.url = Global.url;


  }
  signup(user: any, gettoken: any = null): Observable<any> {
    if (gettoken != null) {
      user = Object.assign(user, { gettoken });
    }

    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this._http.post(this.url + 'login', params, { headers: headers });

  }
  getIdentity() {
    let identity = '';
    identity = JSON.parse(localStorage.getItem('identity') || '{}');
    if (identity != null) {
      this.identity = identity;
    } else {
      this.identity = null;
    }
    return this.identity;
  }
  getRfc() {
    let rfc = '';
    rfc = localStorage.getItem('rfc') || '{}';
    if (rfc != null) {
      this.rfc = rfc;
    } else {
      this.rfc = null;
    }
    return this.rfc;
  }
  getToken() {
    let token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      this.token = token;
    } else {
      this.token = null;
    }
    return this.token;
  }

  getUSer(userId: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'usuario/' + userId, { headers: headers });



  }
  saveVendor(user: Proveedor): Observable<any> {

    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.post(this.url + 'subir-proveedor', params, { headers: headers });


  }
  getVendors(empresa: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'proveedores/' + empresa, { headers: headers });

  }

  descargarTodosLosArchivosConProgreso(token: string): Observable<HttpEvent<Blob>> {
    const headers = new HttpHeaders({
      Authorization: token
    });

    return this._http.get(this.url + 'descargar-todos', {
      headers,
      observe: 'events',
      reportProgress: true,
      responseType: 'blob'
    });
  }

  getArchives22(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'obtener-archivos', { headers: headers });
  }


  getVendor(id: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'proveedor/' + id, { headers: headers });
  }
  getVendorRfc(rfc: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'proveedorauth/' + rfc, { headers: headers });
  }

  getAllArchivesByEmpresa(empresa: string): Observable<any> {
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'get-all-archives-by-empresa/' + empresa, { headers });
  }

  getVendorNoRfc(rfc: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'proveedorauth/' + rfc, { headers: headers });
  }

  saveArchives(archivo: Archivo, rfc: string, empresa: string): Observable<any> {

    let params = JSON.stringify(archivo);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.post(this.url + 'subir-archivos/' + rfc + '/' + empresa, params, { headers: headers });


  }
  getArchives(rfc: any, empresa: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'obtener-archivos/' + rfc + '/' + empresa, { headers: headers });

  }

  getArchive(file: any): Observable<any> {
    let headers = new HttpHeaders()
      .set('Authorization', this.getToken());

    return this._http.get(this.url + 'archivos/' + file, {
      headers: headers,
      responseType: 'blob'  // Indica que la respuesta es de tipo blob
    });
  }


  getAllArchives(rfc: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'proveedor-archives/' + rfc, { headers: headers });
  }
  descargarProveedorZip(rfc: string, empresa: string): Observable<Blob> {
    let headers = new HttpHeaders().set('Authorization', this.getToken());
    return this._http.get(this.url + 'descargar-proveedor-zip/' + rfc + '/' + empresa, {
      headers: headers,
      responseType: 'blob'
    });
  }
  refuseArchives(rfc: any, mensaje: any, empresa: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());

    return this._http.delete(this.url + 'archivos/' + rfc + '/' + mensaje + '/' + empresa, { headers: headers });

  }
  validateArchives(rfc: any, empresa: string): Observable<any> {
    const token = this.getToken(); // <-- JWT sin "Bearer"
    console.log("TOKEN ENVIADO:", token); // Opcional: verifica que no sea null

    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', token); // <-- sin "Bearer"

    return this._http.put(this.url + 'archivos/' + rfc + '/' + empresa, {}, { headers: headers });
  }


  saveUsers(user: Usuario): Observable<any> {
    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());


    return this._http.post(this.url + 'registro', params, { headers: headers });

  }
  updateVendor(user: Proveedor, send: any): Observable<any> {
    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.put(this.url + 'proveedor/' + user._id + '/' + send, params, { headers: headers });
  }
  changePassword(user: Usuario, newPass: any): Observable<any> {
    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.post(this.url + 'cambiar-info/' + newPass, params, { headers: headers });

  }
  forgotPass(usuario: any): Observable<any> {

    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this._http.post(this.url + 'forgot-pass/' + usuario, { headers: headers });

  }

  updateArchives(rfc: string, archivos: { [key: string]: File }, empresa: string): Observable<any> {
    const formData = new FormData();

    for (const key in archivos) {
      if (archivos[key]) {
        formData.append(key, archivos[key]);
      }
    }

    // Obtener token directamente del localStorage
    const token = localStorage.getItem('token'); // o sessionStorage si ahí lo guardas
    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);

    return this._http.post(this.url + 'archivospaUpdate/' + rfc + '/' + empresa, formData, { headers });
  }

  getArchivosOld(rfc: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'get-archive-old/' + rfc, { headers: headers });
  }


  OldArchivo(fileName: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token); // Si necesitas autenticación

    return this._http.get(Global.url + 'archiveOld/' + fileName, {
      headers,
      responseType: 'blob' // Aquí indicamos que la respuesta es un Blob (archivo binario)
    });
  }

  getCheque(id: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.get(this.url + 'cheques/' + id, { headers: headers });
  }

  newCheque(cheque: any): Observable<any> {
    let params = JSON.stringify(cheque);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', this.getToken());
    return this._http.post(this.url + 'cheques/' + cheque.idVendor, params, { headers: headers });
  }

getVendorsWithArchives(): Observable<any> {
  let headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Authorization', this.getToken());

  return this._http.get(this.url + 'vendors-with-archives', { headers });
}
getFechaArchivoPorNombre(nombreArchivo: string): Observable<any> {
  let headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Authorization', this.getToken());

  // Codificamos el nombre del archivo para que la URL sea válida
  const nombreCodificado = encodeURIComponent(nombreArchivo);

  return this._http.get(`${this.url}fecha/${nombreCodificado}`, { headers });
}

toggleFileValidation(rfc: string, fileIndex: number, isValid: boolean, empresa: string): Observable<any> {
    const token = this.getToken(); // getToken() ya te da el token limpio
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + token); // Asegúrate de enviar 'Bearer'

    const body = {
      fileIndex: fileIndex,
      isValid: isValid
    };

    // Apunta al nuevo endpoint que creamos en el backend
    return this._http.put(this.url + 'archives/validate-file/' + rfc + '/' + empresa, body, { headers: headers });
  }
// ...existing code...
validateSingleArchive(rfc: string, archivoKey: string): Observable<any> {
  const token = this.getToken();
  const headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Authorization', token ? 'Bearer ' + token : '');

  // enviar solo el campo de validación que corresponde
  const valField = 'validacion' + archivoKey.replace('archivo', '');
  const body: any = { [valField]: true };

  // Ajusta la URL al endpoint real que tu backend expone para validar un archivo.
  return this._http.put(this.url + 'archivos/validar/' + encodeURIComponent(rfc) + '/' + archivoKey, body, { headers: headers });
}



  submitFeedback(feedbackData: any): Observable<any> {
    let params = JSON.stringify(feedbackData);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this._http.post(this.url + 'feedback', params, { headers: headers });
  }

  submitFeedbackWithImages(formData: FormData): Observable<any> {
    // No establecer Content-Type, dejar que Angular lo maneje automáticamente con boundary
    return this._http.post(this.url + 'feedback', formData);
  }

  crearTicket(ticket: any): Observable<any> {
  let params = JSON.stringify(ticket);
  let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());
    return this._http.post(this.url + 'ticket', params, { headers: headers });
  }

  getMisTickets(): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());
    return this._http.get(this.url + 'mis-tickets', { headers: headers });
  }

  getTicketDetail(id: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());
    return this._http.get(this.url + 'ticket/' + id, { headers: headers });
  }

  getAllTicketsAdmin(filtros: any = {}): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());

    let query = Object.keys(filtros)
      .filter(key => filtros[key])
      .map(key => `${key}=${encodeURIComponent(filtros[key])}`)
      .join('&');

    let url = this.url + 'admin/tickets' + (query ? '?' + query : '');
    return this._http.get(url, { headers: headers });
  }

  responderTicket(id: string, mensaje: string, estatus?: string): Observable<any> {
    let body: any = { mensaje: mensaje };
    if (estatus) body.estatus = estatus;
    let params = JSON.stringify(body);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());
    return this._http.post(this.url + 'admin/ticket/' + id + '/responder', params, { headers: headers });
  }

  cambiarEstatusTicket(id: string, estatus: string, observaciones?: string): Observable<any> {
    let body: any = { estatus: estatus };
    if (observaciones) body.observaciones = observaciones;
    let params = JSON.stringify(body);
    let headers = new HttpHeaders().set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + this.getToken());
    return this._http.put(this.url + 'admin/ticket/' + id + '/estatus', params, { headers: headers });
  }

}
