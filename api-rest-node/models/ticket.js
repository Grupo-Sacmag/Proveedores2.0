"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ESTATUS_TICKET = ["Abierto", "En Proceso", "Resuelto", "Cerrado"];
var PRIORIDAD_TICKET = ["Baja", "Media", "Alta"];

var TicketSchema = Schema({
  folio: { type: String, required: true, unique: true }, // TCK-2026-00001
  usuario: { type: String, required: true }, // usuario (login) que reporta
  rfc: { type: String, default: "" },
  empresa: { type: String, default: "" },
  correoSolicitante: { type: String, required: true },
  asunto: { type: String, required: true },
  descripcion: { type: String, required: true },
  modulo: { type: String, default: "" }, // pantalla/sección donde ocurrió el problema
  prioridad: { type: String, enum: PRIORIDAD_TICKET, default: "Media" },
  estatus: { type: String, enum: ESTATUS_TICKET, default: "Abierto" },
  asignadoA: { type: String, default: null }, // usuario admin asignado
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
});

TicketSchema.pre("save", function (next) {
  this.fechaActualizacion = new Date();
  next();
});

TicketSchema.pre("findOneAndUpdate", function (next) {
  this.set({ fechaActualizacion: new Date() });
  next();
});

var Ticket = mongoose.model("Ticket", TicketSchema);
Ticket.ESTATUS_TICKET = ESTATUS_TICKET;
Ticket.PRIORIDAD_TICKET = PRIORIDAD_TICKET;

module.exports = Ticket;
