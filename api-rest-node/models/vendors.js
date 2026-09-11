"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Notificacion = require("./notificacion");

var VendorSchema = Schema({
  rfc: String,
  registroPatronal: String,
  razonSocial: String,
  tipoProveedor: String,
  regimenFiscal: String,
  nombreContacto: String,
  correo: String,
  telefono: Number,
  observaciones: String,
  borrado: { type: Boolean, default: false },
  empresa: [String],
  userAlta: String,
  verificado: { type: Boolean, default: false }, //
  userVerifico: String,
  fechaAlta: Date,
  fechaVerificado: Date,
  archivosRequeridos: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }
});

// Middleware post-save
VendorSchema.post("save", async function (doc) {
  try {
    await Notificacion.create({
      texto: `Nuevo proveedor creado: ${doc.razonSocial}`,
      coleccion: "vendors",
      instruccion: "insert",
      usuario: doc.rfc,
      empresa: doc.empresa || []
    });
  } catch (err) {
    console.error("Error creando notificación (Vendor save):", err);
  }
});

VendorSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    try {
      await Notificacion.create({
        texto: `Se actualizó el proveedor: ${doc.razonSocial}`,
        coleccion: "vendors",
        instruccion: "update",
        usuario: doc.rfc,
        empresa: doc.empresa || []
      });
    } catch (err) {
      console.error("Error creando notificación (Vendor update):", err);
    }
  }
});


module.exports = mongoose.model("Vendor", VendorSchema);
