"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var WorkOrderSchema = Schema({
  folio: { type: String, required: true },
  numeroProyecto: { type: String, default: '' },
  rfcProveedor: { type: String, required: true },
  empresa: { type: String, required: true },
  descripcion: { type: String, required: true },
  montoTotal: { type: Number, default: 0 },
  estatus: { type: String, default: 'Activa' }, // Activa, Completada, Cancelada
  fechaCreacion: { type: Date, default: Date.now },
  
  // Campos del Contrato
  archivoContrato: { type: String, default: null },
  estatusContrato: { type: String, default: 'Sin Contrato' }, // 'Sin Contrato', 'Pendiente de Validación', 'Aprobado', 'Rechazado', 'Solicitud de Modificación', 'En Modificación'
  observacionesContrato: { type: String, default: null },
  costoContrato: { type: Number, default: 0 },
  fechaTerminoContrato: { type: Date, default: null },

  // Anexos
  anexos: [{
    archivoAnexo: { type: String, required: true },
    archivoXML: { type: String, default: null },
    monto: { type: Number, required: true },
    fechaTermino: { type: Date, required: true },
    fechaSubida: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model("WorkOrder", WorkOrderSchema);
