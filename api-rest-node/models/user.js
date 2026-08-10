"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Notificacion = require("./notificacion");

var UserSchema = Schema({
  usuario: String,
  password: String,
  correo: String,
  rol: String,
  nombre: String,
  apellidoP: String,
  apellidoM: String,
  rfc: String,
  empresa: String,
  alta: String,
  borrado: Boolean
});

UserSchema.post("save", async function (doc) {
  try {
    await Notificacion.create({
      texto: `Se creó el usuario: ${doc.usuario}`,
      coleccion: "users",
      instruccion: "insert",
      usuario: doc.usuario(),
      empresa: doc.empresa ? [doc.empresa] : []
    });
  } catch (err) {
    console.error("Error creando notificación (User save):", err);
  }
});

UserSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    try {
      await Notificacion.create({
        texto: `Se actualizó el usuario: ${doc.usuario}`,
        coleccion: "users",
        instruccion: "update",
        usuario: doc._id.toString(),
        empresa: doc.empresa ? [doc.empresa] : []
      });
    } catch (err) {
      console.error("Error creando notificación (User update):", err);
    }
  }
});

module.exports = mongoose.model("User", UserSchema);
