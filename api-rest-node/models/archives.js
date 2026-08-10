"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Notificacion = require("./notificacion");

var ArchivessSchema = Schema({
  rfc: String,
  empresa: String,
  archivo1: String,
  archivo2: String,
  archivo3: String,
  archivo4: String,
  archivo5: String,
  archivo6: String,
  archivo7: String,
  archivo8: String,
  archivo9: String,
  archivo10: String,
  archivo11: String,
  archivo12: String,
  archivo13: String,
  archivo14: String,
  archivo15: String,
  validacion1: { type: Boolean, default: null },
  validacion2: { type: Boolean, default: null },
  validacion3: { type: Boolean, default: null },
  validacion4: { type: Boolean, default: null },
  validacion5: { type: Boolean, default: null },
  validacion6: { type: Boolean, default: null },
  validacion7: { type: Boolean, default: null },
  validacion8: { type: Boolean, default: null },
  validacion9: { type: Boolean, default: null },
  validacion10: { type: Boolean, default: null },
  validacion11: { type: Boolean, default: null },
  validacion12: { type: Boolean, default: null },
  validacion13: { type: Boolean, default: null },
  validacion14: { type: Boolean, default: null },
  validacion15: { type: Boolean, default: null },
  validar: { type: Boolean, default: false },
  borrado: { type: Boolean, default: false },
});

// Middleware 
ArchivessSchema.post("save", async function (doc) {
  try {
    await Notificacion.create({
      texto: `El proveedor ${doc.rfc} ha subido sus archivos.`,
      coleccion: "archives",
      instruccion: "insert",
      usuario: doc.usuario,
      empresa: []   // Aquí vacío porque Archive no trae empresa
    });
  } catch (err) {
    console.error("Error creando notificación (Archive save):", err);
  }
});

ArchivessSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    try {
      await Notificacion.create({
        texto: `El proveedor ${doc.rfc} ha modificado sus archivos.`,
        coleccion: "archives",
        instruccion: "update",
        usuario: doc.usuario,
        empresa: [], // Igual vacío
      });
    } catch (err) {
      console.error("Error creando notificación (Archive update):", err);
    }
  }
});

module.exports = mongoose.model("Archive", ArchivessSchema);
