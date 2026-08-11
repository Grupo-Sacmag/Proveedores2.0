import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Global } from './global';
import { WorkOrder } from '../models/workorder';
import { Invoice } from '../models/invoice';

@Injectable({
  providedIn: 'root'
})
export class WorkorderService {
  public url: string;

  constructor(private _http: HttpClient) {
    this.url = Global.url;
  }

  // Ordenes de Trabajo
  createWorkOrder(token: any, workOrder: any): Observable<any> {
    let params = JSON.stringify(workOrder);
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.post(this.url + 'workorder', params, { headers: headers });
  }

  getWorkOrders(token: any, rfc: string, empresa: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.get(this.url + 'workorders/' + rfc + '/' + empresa, { headers: headers });
  }

  getAllWorkOrders(token: any, empresa: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.get(this.url + 'workorders/empresa/' + empresa, { headers: headers });
  }

  // Facturas
  getInvoicesByWorkOrder(token: any, workOrderId: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.get(this.url + 'invoices/' + workOrderId, { headers: headers });
  }

  getInvoiceXMLDetails(token: any, invoiceId: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.get(this.url + 'invoice-details/' + invoiceId, { headers: headers });
  }

  uploadInvoice(token: any, workOrderId: string, rfc: string, empresa: string, fileXML: File, filePDF: File): Observable<any> {
    const formData = new FormData();
    formData.append('xml', fileXML, fileXML.name);
    formData.append('pdf', filePDF, filePDF.name);

    // No enviamos Content-Type para que el navegador ponga automáticamente multipart/form-data con el boundary correcto
    let headers = new HttpHeaders().set('Authorization', token);
    return this._http.post(this.url + 'upload-invoice/' + workOrderId + '/' + rfc + '/' + empresa, formData, { headers: headers });
  }

  updateInvoiceStatus(token: any, invoiceId: string, estatus: string, observaciones: string = ''): Observable<any> {
    let params = JSON.stringify({ estatus: estatus, observaciones: observaciones });
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.put(this.url + 'invoice-status/' + invoiceId, params, { headers: headers });
  }

  // === Contratos ===
  uploadContrato(token: any, workOrderId: string, filePDF: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', filePDF, filePDF.name);
    let headers = new HttpHeaders().set('Authorization', token);
    return this._http.post(this.url + 'upload-contrato-wo/' + workOrderId, formData, { headers: headers });
  }

  validateContrato(token: any, workOrderId: string, estatus: string, observaciones: string = ''): Observable<any> {
    let params = JSON.stringify({ estatus: estatus, observaciones: observaciones });
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.put(this.url + 'status-contrato-wo/' + workOrderId, params, { headers: headers });
  }

  requestContratoMod(token: any, workOrderId: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.put(this.url + 'request-mod-contrato-wo/' + workOrderId, {}, { headers: headers });
  }

  approveContratoMod(token: any, workOrderId: string): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json').set('Authorization', token);
    return this._http.put(this.url + 'approve-mod-contrato-wo/' + workOrderId, {}, { headers: headers });
  }
}
