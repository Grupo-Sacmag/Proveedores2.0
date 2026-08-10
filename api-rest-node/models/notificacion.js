"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var NotificationSchema = Schema({
  texto: String,
  empresa: [String],
  coleccion: String,
  instruccion: String,
  usuario: String,
  leido: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now },
    
});

module.exports = mongoose.model("Notificacion", NotificationSchema);
