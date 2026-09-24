"use strict";
var nodemailer = require("nodemailer");

// Recomendado: mover estas credenciales a variables de entorno (.env) en cuanto puedas,
// ya que hoy están hardcodeadas también en auth.controller.js.
var MAIL_USER = process.env.MAIL_USER || "sacmag.proveedores@gmail.com";
var MAIL_PASS = process.env.MAIL_PASS || "jvwezvognvounmdl";

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

module.exports = {
  transporter: transporter,
  MAIL_FROM: '"Proveedores Sacmag " <' + MAIL_USER + ">",
  LOGO_ATTACHMENT: {
    filename: "image.png",
    path: __dirname + "/../controllers/logo.png", // mismo logo que ya usa auth.controller.js
    cid: "unique@kreata.ee",
  },
};
