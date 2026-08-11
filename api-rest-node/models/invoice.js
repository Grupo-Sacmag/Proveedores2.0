"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var InvoiceSchema = Schema({
  ordenTrabajoId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  rfcProveedor: { type: String, required: true },
  empresa: { type: String, required: true },
  uuid: { type: String, required: true }, // Folio Fiscal
  subtotal: { type: Number, required: true },
  iva: { type: Number, default: 0 },
  total: { type: Number, required: true },
  moneda: { type: String, required: true },
  fechaEmision: { type: Date, required: true },
  archivoXML: { type: String, required: true },
  archivoPDF: { type: String, required: true },
  estatusValidacion: { type: String, default: 'Pendiente' }, // Pendiente, Aprobada, Rechazada
  observacionesRechazo: { type: String, default: '' },
  fechaCarga: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
