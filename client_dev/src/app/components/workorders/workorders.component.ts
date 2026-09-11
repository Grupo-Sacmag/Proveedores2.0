import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Global } from '../../services/global';
import { WorkorderService } from '../../services/workorder.service';
import { ProjectService } from '../../services/project.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-workorders',
  templateUrl: './workorders.component.html',
  styleUrls: ['./workorders.component.css'],
  providers: [WorkorderService, ProjectService]
})
export class WorkordersComponent implements OnInit {

  get presupuestoActivo(): number {
    if (!this.selectedWorkOrder) return 0;
    if (this.selectedWorkOrder.anexos && this.selectedWorkOrder.anexos.length > 0) {
      return this.selectedWorkOrder.anexos[this.selectedWorkOrder.anexos.length - 1].monto;
    }
    if (this.selectedWorkOrder.costoContrato) {
      return this.selectedWorkOrder.costoContrato;
    }
    return this.selectedWorkOrder.montoTotal || 0;
  }

  get fuentePresupuesto(): string {
    if (!this.selectedWorkOrder) return '';
    if (this.selectedWorkOrder.anexos && this.selectedWorkOrder.anexos.length > 0) {
      return `Anexo #${this.selectedWorkOrder.anexos.length}`;
    }
    if (this.selectedWorkOrder.costoContrato) {
      return 'Contrato Principal';
    }
    return 'Orden de Trabajo';
  }

  get fechaTerminoActiva(): Date | null {
    if (!this.selectedWorkOrder) return null;
    if (this.selectedWorkOrder.anexos && this.selectedWorkOrder.anexos.length > 0) {
      return this.selectedWorkOrder.anexos[this.selectedWorkOrder.anexos.length - 1].fechaTermino;
    }
    if (this.selectedWorkOrder.fechaTerminoContrato) {
      return this.selectedWorkOrder.fechaTerminoContrato;
    }
    return null;
  }

  get totalFacturadoAprobado(): number {
    if (!this.invoices || this.invoices.length === 0) return 0;
    return this.invoices
      .filter(inv => inv.estatusValidacion === 'Aprobada')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  }

  get montoRestante(): number {
    return Math.max(0, this.presupuestoActivo - this.totalFacturadoAprobado);
  }

  get porcentajeEjecutado(): number {
    if (this.presupuestoActivo <= 0) return 0;
    return Math.min(100, Math.round((this.totalFacturadoAprobado / this.presupuestoActivo) * 100));
  }

  get canManageContratoAnexo(): boolean {
    return (
      this.identity &&
      ['administrador', 'administrador_premium', 'usuario', 'proveedor'].includes(this.identity.rol)
    );
  }

  filtrarNumeroProyecto(event: any) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 5);
      this.newOT.numeroProyecto = input.value;
    }
  }

  public identity: any;
  public token: any;
  public rfc: string = '';
  public empresa: string = '';
  public vendor: any = null;
  public workOrders: any[] = [];
  public selectedWorkOrder: any = null;
  public invoices: any[] = [];
  public url: string;
  
  // Para creación de OT
  public showCreateOT: boolean = false;
  public newOT = { folio: '', numeroProyecto: '', descripcion: '', montoTotal: null };

  // Archivos para upload
  public fileXML: File | null = null;
  public filePDF: File | null = null;
  public isUploading: boolean = false;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _workorderService: WorkorderService,
    private _projectService: ProjectService
  ) {
    this.identity = this._projectService.getIdentity();
    this.token = this._projectService.getToken();
    this.url = Global.url;
  }

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.rfc = params['rfc'];
      this.empresa = params['empresa'];
      this.getVendor();
      this.getWorkOrders();
    });
  }

  getVendor() {
    this._projectService.getVendorRfc(this.rfc).subscribe(
      (response: any) => {
        if (response.vendor) {
          this.vendor = response.vendor;
        }
      },
      (error: any) => console.log(<any>error)
    );
  }

  getWorkOrders() {
    this._workorderService.getWorkOrders(this.token, this.rfc, this.empresa).subscribe(
      (response: any) => {
        if (response.workOrders) {
          this.workOrders = response.workOrders;
        }
      },
      (error: any) => console.log(<any>error)
    );
  }

  selectWorkOrder(wo: any) {
    this.selectedWorkOrder = wo;
    this.getInvoices(wo._id);
  }

  getInvoices(woId: string) {
    this._workorderService.getInvoicesByWorkOrder(this.token, woId).subscribe(
      (response: any) => {
        if (response.invoices) {
          this.invoices = response.invoices;
        }
      },
      (error: any) => console.log(<any>error)
    );
  }

  // Creación de OT
  createWorkOrder() {
    const folio = (this.newOT.folio || '').toString().trim().toUpperCase();
    const numeroProyecto = (this.newOT.numeroProyecto || '').toString().trim();
    const descripcion = (this.newOT.descripcion || '').toString().trim().toUpperCase();
    const monto = parseFloat(<any>this.newOT.montoTotal);

    if (!folio) {
      Swal.fire('Atención', 'El folio de la orden de trabajo es obligatorio.', 'warning');
      return;
    }
    if (!numeroProyecto || !/^\d{1,5}$/.test(numeroProyecto)) {
      Swal.fire('Atención', 'El número de proyecto es obligatorio, debe ser numérico y tener máximo 5 dígitos.', 'warning');
      return;
    }
    if (!descripcion) {
      Swal.fire('Atención', 'La descripción del trabajo es obligatoria.', 'warning');
      return;
    }
    if (descripcion.length > 210) {
      Swal.fire('Atención', 'La descripción no puede exceder los 210 caracteres.', 'warning');
      return;
    }
    if (isNaN(monto) || monto <= 0) {
      Swal.fire('Atención', 'El monto inicial / tope debe ser un número positivo mayor a 0.', 'warning');
      return;
    }

    const ot = {
      folio: folio,
      numeroProyecto: numeroProyecto,
      descripcion: descripcion,
      montoTotal: monto,
      rfcProveedor: this.rfc,
      empresa: this.empresa
    };

    this._workorderService.createWorkOrder(this.token, ot).subscribe(
      (response: any) => {
        Swal.fire('Éxito', 'Orden de trabajo creada correctamente.', 'success');
        this.getWorkOrders();
        this.showCreateOT = false;
        this.newOT = { folio: '', numeroProyecto: '', descripcion: '', montoTotal: null };
      },
      (error: any) => {
        Swal.fire('Error', error.error?.message || 'No se pudo crear la Orden.', 'error');
        console.log(error);
      }
    );
  }

  // Subida de Factura
  fileChangeEventXML(fileInput: any) {
    this.fileXML = <File>fileInput.target.files[0];
  }
  fileChangeEventPDF(fileInput: any) {
    this.filePDF = <File>fileInput.target.files[0];
  }

  uploadInvoice() {
    if (!this.fileXML || !this.filePDF) {
      Swal.fire('Aviso', 'Debes seleccionar tanto el archivo XML como el PDF.', 'warning');
      return;
    }
    this.isUploading = true;
    this._workorderService.uploadInvoice(this.token, this.selectedWorkOrder._id, this.rfc, this.empresa, this.fileXML, this.filePDF).subscribe(
      (response: any) => {
        this.isUploading = false;
        Swal.fire('Éxito', 'Factura procesada y guardada correctamente.', 'success');
        this.getInvoices(this.selectedWorkOrder._id);
        this.fileXML = null;
        this.filePDF = null;
      },
      error => {
        this.isUploading = false;
        Swal.fire('Error', error.error.message || 'Error al procesar la factura.', 'error');
      }
    );
  }

  // Aprobación (Solo admins)
  changeStatus(invoice: any, status: string) {
    Swal.fire({
      title: '¿Observaciones?',
      input: 'text',
      inputPlaceholder: 'Motivo del rechazo (si aplica)',
      showCancelButton: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._workorderService.updateInvoiceStatus(this.token, invoice._id, status, result.value || '').subscribe(
          (response: any) => {
            Swal.fire('Actualizado', 'El estatus ha cambiado a ' + status, 'success');
            this.getInvoices(this.selectedWorkOrder._id);
          },
          (error: any) => Swal.fire('Error', 'No se pudo actualizar', 'error')
        );
      }
    });
  }

  // Visualizador de detalles XML
  viewInvoiceDetails(invoice: any) {
    Swal.fire({
      title: 'Leyendo XML...',
      text: 'Extrayendo conceptos e impuestos, por favor espera.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this._workorderService.getInvoiceXMLDetails(this.token, invoice._id).subscribe(
      (response: any) => {
        const d = response.detalles;
        
        // Construir tabla de conceptos
        let conceptosHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 15px; text-align: left;">
            <thead>
              <tr style="background-color: #f3f4f6; color: #374151;">
                <th style="padding: 10px; font-size: 15px; border-bottom: 2px solid #e5e7eb; width: 10%;">Cant.</th>
                <th style="padding: 10px; font-size: 15px; border-bottom: 2px solid #e5e7eb; width: 50%;">Descripción</th>
                <th style="padding: 10px; font-size: 15px; border-bottom: 2px solid #e5e7eb; width: 20%;">V. Unitario</th>
                <th style="padding: 10px; font-size: 15px; border-bottom: 2px solid #e5e7eb; width: 20%;">Importe</th>
              </tr>
            </thead>
            <tbody>
        `;

        d.conceptos.forEach((c: any) => {
          conceptosHtml += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-size: 15px;">${c.cantidad}</td>
              <td style="padding: 12px; font-size: 15px; white-space: normal; line-height: 1.5;">${c.descripcion}</td>
              <td style="padding: 12px; font-size: 15px;">$${parseFloat(c.valorUnitario).toFixed(2)}</td>
              <td style="padding: 12px; font-size: 15px; font-weight: bold;">$${parseFloat(c.importe).toFixed(2)}</td>
            </tr>
          `;
        });
        conceptosHtml += `</tbody></table>`;

        // Construir lista de impuestos (Traslados y Retenciones)
        let impuestosHtml = '';
        if (d.impuestos.listaTraslados && d.impuestos.listaTraslados.length > 0) {
          impuestosHtml += `<div style="margin-bottom: 10px;"><strong style="color: #047857;">Traslados:</strong><ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">`;
          d.impuestos.listaTraslados.forEach((t: any) => {
            impuestosHtml += `<li>Impuesto ${t.impuesto} (${t.tipoFactor} ${parseFloat(t.tasaOCuota || 0) * 100}%): <strong>$${parseFloat(t.importe).toFixed(2)}</strong></li>`;
          });
          impuestosHtml += `</ul></div>`;
        }
        
        if (d.impuestos.listaRetenciones && d.impuestos.listaRetenciones.length > 0) {
          impuestosHtml += `<div style="margin-bottom: 10px;"><strong style="color: #b91c1c;">Retenciones:</strong><ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">`;
          d.impuestos.listaRetenciones.forEach((r: any) => {
            impuestosHtml += `<li>Impuesto ${r.impuesto}: <strong>$${parseFloat(r.importe).toFixed(2)}</strong></li>`;
          });
          impuestosHtml += `</ul></div>`;
        }

        if (!impuestosHtml) {
          impuestosHtml = `<div style="font-size: 13px; color: #6b7280;">No se desglosan impuestos.</div>`;
        }

        const htmlContent = `
          <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; color: #1f2937;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 15px; background: #eff6ff; border-radius: 6px;">
              <div style="width: 48%;">
                <h4 style="margin: 0 0 5px 0; color: #1e40af; font-size: 15px;">Emisor</h4>
                <strong>${d.emisor.nombre}</strong><br>
                RFC: ${d.emisor.rfc}<br>
                Régimen: ${d.emisor.regimenFiscal}
              </div>
              <div style="width: 48%;">
                <h4 style="margin: 0 0 5px 0; color: #1e40af; font-size: 15px;">Receptor</h4>
                <strong>${d.receptor.nombre}</strong><br>
                RFC: ${d.receptor.rfc}<br>
                Uso CFDI: ${d.receptor.usoCFDI}
              </div>
            </div>

            <h4 style="margin: 20px 0 5px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Conceptos Facturados</h4>
            <div style="max-height: 350px; overflow-y: auto; padding-right: 5px;">
              ${conceptosHtml}
            </div>

            <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
              
              <div style="width: 50%; background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #374151;">Desglose de Impuestos</h4>
                ${impuestosHtml}
              </div>

              <div style="width: 45%; background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>SubTotal:</span> <strong>$${parseFloat(d.totales.subTotal).toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Descuento:</span> <strong>$${parseFloat(d.totales.descuento).toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #047857;">
                  <span>Total Trasladados:</span> <strong>$${parseFloat(d.impuestos.totalTrasladados).toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #b91c1c;">
                  <span>Total Retenidos:</span> <strong>$${parseFloat(d.impuestos.totalRetenidos).toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #e5e7eb; font-size: 18px;">
                  <span><strong>Total:</strong></span> <strong style="color: #b91c1c;">$${parseFloat(d.totales.total).toFixed(2)} ${d.totales.moneda}</strong>
                </div>
              </div>

            </div>
          </div>
        `;

        Swal.fire({
          title: 'Detalles del CFDI',
          html: htmlContent,
          width: '1000px', // Hacemos el modal mucho más ancho (80% del 1200px o casi pantalla completa)
          showCloseButton: true,
          showConfirmButton: false
        });
      },
      error => {
        Swal.fire('Error', 'No se pudo leer el XML original. Puede que esté dañado.', 'error');
      }
    );
  }

  // === Contratos ODT ===
  public fileContrato: File | null = null;
  public isUploadingContrato: boolean = false;
  public newContratoCosto: number | null = null;
  public newContratoFecha: string = '';

  fileChangeEventContrato(fileInput: any) {
    this.fileContrato = <File>fileInput.target.files[0];
  }

  uploadContrato() {
    if (!this.fileContrato || !this.newContratoCosto || !this.newContratoFecha) {
      Swal.fire('Aviso', 'Debes seleccionar el archivo PDF, el monto y la fecha de término.', 'warning');
      return;
    }
    this.isUploadingContrato = true;
    this._workorderService.uploadContrato(this.token, this.selectedWorkOrder._id, this.fileContrato, this.newContratoCosto, this.newContratoFecha).subscribe(
      (response: any) => {
        this.isUploadingContrato = false;
        Swal.fire('Éxito', 'Contrato subido correctamente. En espera de validación.', 'success');
        this.selectedWorkOrder.estatusContrato = response.workOrder.estatusContrato;
        this.selectedWorkOrder.archivoContrato = response.workOrder.archivoContrato;
        this.selectedWorkOrder.costoContrato = response.workOrder.costoContrato;
        this.selectedWorkOrder.fechaTerminoContrato = response.workOrder.fechaTerminoContrato;
        this.fileContrato = null;
        this.newContratoCosto = null;
        this.newContratoFecha = '';
      },
      error => {
        this.isUploadingContrato = false;
        Swal.fire('Error', error.error.message || 'Error al subir el contrato.', 'error');
      }
    );
  }

  promptUploadAnexo() {
    Swal.fire({
      title: 'Agregar Anexo al Contrato',
      html: `
        <div style="text-align: left; margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: bold; color: #4b5563;">Archivo PDF del Anexo (Obligatorio):</label>
          <input type="file" id="swal-file-pdf" class="swal2-input" accept=".pdf" style="margin-top: 5px; padding: 6px;">
        </div>
        <div style="text-align: left; margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: bold; color: #4b5563;">Archivo XML de Presupuesto/Soporte (Opcional):</label>
          <input type="file" id="swal-file-xml" class="swal2-input" accept=".xml" style="margin-top: 5px; padding: 6px;">
        </div>
        <div style="text-align: left; margin-bottom: 12px;">
          <label style="font-size: 12px; font-weight: bold; color: #4b5563;">Nuevo Presupuesto ($) (Puede ser mayor o menor):</label>
          <input type="number" id="swal-monto" class="swal2-input" placeholder="Ej. 15000" style="margin-top: 5px;">
        </div>
        <div style="text-align: left;">
          <label style="font-size: 12px; font-weight: bold; color: #4b5563;">Fecha Estimada de Término:</label>
          <input type="date" id="swal-fecha" class="swal2-input" style="margin-top: 5px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Subir Anexo',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const filePdfInput = document.getElementById('swal-file-pdf') as HTMLInputElement;
        const filePdf = filePdfInput.files ? filePdfInput.files[0] : null;
        
        const fileXmlInput = document.getElementById('swal-file-xml') as HTMLInputElement;
        const fileXml = fileXmlInput.files ? fileXmlInput.files[0] : null;

        const monto = (document.getElementById('swal-monto') as HTMLInputElement).value;
        const fecha = (document.getElementById('swal-fecha') as HTMLInputElement).value;
        
        if (!filePdf) {
          Swal.showValidationMessage('El archivo PDF del anexo es obligatorio.');
          return false;
        }
        if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
          Swal.showValidationMessage('El nuevo presupuesto debe ser un número positivo mayor a 0.');
          return false;
        }
        if (!fecha) {
          Swal.showValidationMessage('La fecha estimada de término es obligatoria.');
          return false;
        }
        return { filePdf, fileXml, monto: parseFloat(monto), fecha };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.uploadAnexo(result.value.filePdf, result.value.monto, result.value.fecha, result.value.fileXml);
      }
    });
  }

  uploadAnexo(file: File, monto: number, fechaTermino: string, fileXML?: File | null) {
    Swal.fire({ title: 'Subiendo anexo...', allowOutsideClick: false });
    Swal.showLoading();
    this._workorderService.uploadAnexo(this.token, this.selectedWorkOrder._id, file, monto, fechaTermino, fileXML).subscribe(
      (response: any) => {
        Swal.fire('Éxito', 'Anexo subido correctamente.', 'success');
        this.selectedWorkOrder.anexos = response.workOrder.anexos;
      },
      error => {
        Swal.fire('Error', error.error?.message || 'Error al subir el anexo', 'error');
      }
    );
  }

  validateContrato(estatus: string) {
    let title = estatus === 'Aprobado' ? '¿Aprobar Contrato?' : '¿Rechazar Contrato?';
    Swal.fire({
      title: title,
      input: estatus === 'Rechazado' ? 'text' : undefined,
      inputPlaceholder: 'Motivo del rechazo',
      showCancelButton: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        if (estatus === 'Rechazado' && !result.value) {
          Swal.fire('Error', 'Debes ingresar un motivo de rechazo', 'error');
          return;
        }
        this._workorderService.validateContrato(this.token, this.selectedWorkOrder._id, estatus, result.value || '').subscribe(
          (response: any) => {
            Swal.fire('Actualizado', 'El contrato fue ' + estatus, 'success');
            this.selectedWorkOrder.estatusContrato = response.workOrder.estatusContrato;
            this.selectedWorkOrder.observacionesContrato = response.workOrder.observacionesContrato;
          },
          error => Swal.fire('Error', 'No se pudo validar el contrato', 'error')
        );
      }
    });
  }

  requestContratoMod() {
    Swal.fire({
      title: '¿Solicitar modificación?',
      text: 'Se enviará una solicitud al administrador para que te permita subir un nuevo contrato.',
      icon: 'question',
      showCancelButton: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._workorderService.requestContratoMod(this.token, this.selectedWorkOrder._id).subscribe(
          (response: any) => {
            Swal.fire('Éxito', 'Solicitud enviada correctamente', 'success');
            this.selectedWorkOrder.estatusContrato = response.workOrder.estatusContrato;
          },
          error => Swal.fire('Error', 'No se pudo enviar la solicitud', 'error')
        );
      }
    });
  }

  approveContratoMod() {
    Swal.fire({
      title: '¿Autorizar modificación?',
      text: 'El proveedor podrá subir un nuevo archivo de contrato.',
      icon: 'warning',
      showCancelButton: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this._workorderService.approveContratoMod(this.token, this.selectedWorkOrder._id).subscribe(
          (response: any) => {
            Swal.fire('Éxito', 'Modificación autorizada. El proveedor ya puede subir el archivo.', 'success');
            this.selectedWorkOrder.estatusContrato = response.workOrder.estatusContrato;
          },
          error => Swal.fire('Error', 'No se pudo autorizar', 'error')
        );
      }
    });
  }

  goBack() {
    if (this.identity && this.identity.rol === 'proveedor') {
      this._router.navigate(['/archivos']);
    } else if (this.vendor && this.vendor._id) {
      this._router.navigate(['/proveedor', this.vendor._id]);
    } else {
      this._router.navigate(['/proveedores']);
    }
  }
}
