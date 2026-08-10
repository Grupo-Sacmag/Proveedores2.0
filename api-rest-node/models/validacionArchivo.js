"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Notificacion = require("./notificacion");

var ArchivessSchema = Schema({
  //RFC para vincular los archivos con su validacion correcta.
  rfc: String,
  //Si archivo 'n' se valida, validacion 'n' cambia de false a true
  validacion1: { type: Boolean, default: false },
  validacion2: { type: Boolean, default: false },
  validacion3: { type: Boolean, default: false },
  validacion4: { type: Boolean, default: false },
  validacion5: { type: Boolean, default: false },
  validacion6: { type: Boolean, default: false },
  validacion7: { type: Boolean, default: false },
  validacion8: { type: Boolean, default: false },
  validacion9: { type: Boolean, default: false },
  validacion10: { type: Boolean, default: false },
  validacion11: { type: Boolean, default: false },
  validacion12: { type: Boolean, default: false },
  validacion13: { type: Boolean, default: false },
  validacion14: { type: Boolean, default: false },
  validacion15: { type: Boolean, default: false },
  //SI TODOS LOS ARCHIVOS ESTÁN CORRECTOS, CAMBIA A TRUE, (En el frontend cambia de color)
  aceptarArchivos: { type: Boolean, default: false }, 
});

module.exports = mongoose.model("Archive", ArchivessSchema);
