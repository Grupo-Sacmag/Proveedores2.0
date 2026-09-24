"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TIPO_MENSAJE = ["CREACION", "RESPUESTA", "CAMBIO_ESTATUS"];

var TicketMessageSchema = Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
  folioTicket: { type: String, required: true }, // redundante a propósito: permite filtrar sin populate
  tipo: { type: String, enum: TIPO_MENSAJE, required: true },
  remitente: { type: String, required: true },
  destinatarios: [{ type: String }],
  asunto: { type: String, required: true },
  cuerpoHtml: { type: String, required: true },
  cuerpoTexto: { type: String, default: "" },
  autor: { type: String, default: "sistema" }, // usuario/admin que generó el mensaje
  fecha: { type: Date, default: Date.now },
  enviado: { type: Boolean, default: false }, // true solo si Nodemailer confirmó el envío
  errorEnvio: { type: String, default: null },
});

module.exports = mongoose.model("TicketMessage", TicketMessageSchema);
