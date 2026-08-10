'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Notificacion = require('./notificacion'); // importante: importar el modelo de notificación

var oldArchive = new Schema({
    rfc: String,
    empresa: String,
    archivo1: [String],
    archivo2: [String],
    archivo3: [String],
    archivo4: [String],
    archivo5: [String],
    archivo6: [String],
    archivo7: [String],
    archivo8: [String],
    archivo9: [String],
    archivo10: [String],
    archivo11: [String],
    archivo12: [String],
    archivo13: [String],
    archivo14: [String],
    archivo15: [String],
    validar: Boolean,
    borrado: Boolean
});

// ----------------------
// HOOKS DE NOTIFICACIÓN
// ----------------------

// Insert
oldArchive.post("save", async function (doc) {
  try {
    await Notificacion.create({
      texto: `Archivos viejos creados para: ${doc.razonSocial}`,
      coleccion: "oldArchives",
      instruccion: "insert",
      usuario: doc.rfc,
      empresa: [] // sin empresa porque no está en este modelo
    });
  } catch (err) {
    console.error("Error creando notificación (oldArchive save):", err);
  }
});

// Update
oldArchive.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    try {
      await Notificacion.create({
        texto: `Se actualizó archivo de: ${doc.razonSocial}`,
        coleccion: "oldArchives",
        instruccion: "update",
        usuario: doc.rfc,
        empresa: [] // igual vacío
      });
    } catch (err) {
      console.error("Error creando notificación (oldArchive update):", err);
    }
  }
});

// Evita OverwriteModelError
module.exports = mongoose.models.oldArchives || mongoose.model('oldArchives', oldArchive);
