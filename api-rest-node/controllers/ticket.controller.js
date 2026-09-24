"use strict";
var Ticket = require("../models/ticket");
var TicketMessage = require("../models/ticketMessage");
var mailer = require("../services/mailer");
var templates = require("../services/ticketEmailTemplates");

// --- Utilidades internas ---

async function generarFolioTicket() {
  var anio = new Date().getFullYear();
  var count = await Ticket.countDocuments({ folio: new RegExp("^TCK-" + anio + "-") });
  var siguiente = (count + 1).toString().padStart(5, "0");
  return "TCK-" + anio + "-" + siguiente;
}

/**
 * Envía un correo y, pase lo que pase con el envío, deja SIEMPRE un registro
 * en TicketMessage (Criterio técnico: "ningún correo procesado debe quedar
 * flotante o sin asociar al ticket").
 */
async function enviarYRegistrarMensaje({ ticket, tipo, destinatarios, asunto, html, autor }) {
  var mensaje = new TicketMessage({
    ticketId: ticket._id,
    folioTicket: ticket.folio,
    tipo: tipo,
    remitente: mailer.MAIL_FROM,
    destinatarios: destinatarios,
    asunto: asunto,
    cuerpoHtml: html,
    autor: autor || "sistema",
  });

  try {
    await mailer.transporter.sendMail({
      from: mailer.MAIL_FROM,
      to: destinatarios.join(", "),
      subject: asunto,
      html: html,
      attachments: [mailer.LOGO_ATTACHMENT],
    });
    mensaje.enviado = true;
  } catch (err) {
    console.error("Error enviando correo de ticket " + ticket.folio + ":", err);
    mensaje.enviado = false;
    mensaje.errorEnvio = err.message || String(err);
  }

  await mensaje.save();
  return mensaje;
}

var controller = {
  // Proveedor/usuario levanta un ticket
  crearTicket: async function (req, res) {
    try {
      var params = req.body;
      var usuarioAuth = req.user;

      if (!params.asunto || !params.descripcion) {
        return res.status(400).send({ message: "Asunto y descripción son obligatorios." });
      }

      var folio = await generarFolioTicket();

      var nuevoTicket = new Ticket({
        folio: folio,
        usuario: usuarioAuth.usuario,
        rfc: usuarioAuth.rfc || "",
        empresa: usuarioAuth.empresa || params.empresa || "",
        correoSolicitante: usuarioAuth.correo,
        asunto: params.asunto.toString().trim(),
        descripcion: params.descripcion.toString().trim(),
        modulo: (params.modulo || "").toString().trim(),
        prioridad: params.prioridad || "Media",
      });

      var ticketGuardado = await nuevoTicket.save();

      // Notificación al equipo (correo interno) + confirmación al solicitante.
      // Ajusta este correo interno al buzón real que deba recibir las alertas.
      var correoInterno = "desarrollo.conta@grupo-sacmag.com.mx";
      var notifAdmin = templates.emailNuevoTicketAdmin(ticketGuardado);
      var notifSolicitante = templates.emailConfirmacionSolicitante(ticketGuardado);

      await enviarYRegistrarMensaje({
        ticket: ticketGuardado,
        tipo: "CREACION",
        destinatarios: [correoInterno],
        asunto: notifAdmin.subject,
        html: notifAdmin.html,
        autor: usuarioAuth.usuario,
      });

      await enviarYRegistrarMensaje({
        ticket: ticketGuardado,
        tipo: "CREACION",
        destinatarios: [ticketGuardado.correoSolicitante],
        asunto: notifSolicitante.subject,
        html: notifSolicitante.html,
        autor: "sistema",
      });

      return res.status(200).send({ ticket: ticketGuardado });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al crear el ticket." });
    }
  },

  // Tickets propios del usuario autenticado
  getMisTickets: async function (req, res) {
    try {
      var tickets = await Ticket.find({ usuario: req.user.usuario }).sort("-fechaCreacion");
      return res.status(200).send({ tickets: tickets });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener tus tickets." });
    }
  },

  // Detalle de un ticket + su hilo de mensajes (dueño del ticket o admin_premium)
  getTicketDetail: async function (req, res) {
    try {
      var ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).send({ message: "Ticket no encontrado." });

      var esDueno = ticket.usuario === req.user.usuario;
      var esAdmin = req.user.rol === "administrador_premium";
      if (!esDueno && !esAdmin) {
        return res.status(403).send({ message: "No tienes acceso a este ticket." });
      }

      var mensajes = await TicketMessage.find({ ticketId: ticket._id }).sort("fecha");
      return res.status(200).send({ ticket: ticket, mensajes: mensajes });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener el detalle del ticket." });
    }
  },

  // Dashboard admin: listado con filtros (Criterio 4). Ruta ya protegida por ensureAdminPremium.
  getAllTickets: async function (req, res) {
    try {
      var filtro = {};
      if (req.query.estatus) filtro.estatus = req.query.estatus;
      if (req.query.empresa) filtro.empresa = req.query.empresa.toLowerCase();
      if (req.query.usuario) filtro.usuario = req.query.usuario.toLowerCase();
      if (req.query.desde || req.query.hasta) {
        filtro.fechaCreacion = {};
        if (req.query.desde) filtro.fechaCreacion.$gte = new Date(req.query.desde);
        if (req.query.hasta) filtro.fechaCreacion.$lte = new Date(req.query.hasta);
      }

      var tickets = await Ticket.find(filtro).sort("-fechaCreacion");
      return res.status(200).send({ tickets: tickets });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener los tickets." });
    }
  },

  // Admin responde un ticket
  responderTicket: async function (req, res) {
    try {
      var ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).send({ message: "Ticket no encontrado." });

      var mensajeAdmin = (req.body.mensaje || "").toString().trim();
      if (!mensajeAdmin) return res.status(400).send({ message: "El mensaje no puede estar vacío." });

      if (req.body.estatus && Ticket.ESTATUS_TICKET.includes(req.body.estatus)) {
        ticket.estatus = req.body.estatus;
        await ticket.save();
      }

      var correo = templates.emailRespuestaTicket(ticket, mensajeAdmin, req.user.usuario);
      var mensajeGuardado = await enviarYRegistrarMensaje({
        ticket: ticket,
        tipo: "RESPUESTA",
        destinatarios: [ticket.correoSolicitante],
        asunto: correo.subject,
        html: correo.html,
        autor: req.user.usuario,
      });

      return res.status(200).send({ ticket: ticket, mensaje: mensajeGuardado });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al responder el ticket." });
    }
  },

  // Admin cambia el estatus sin necesariamente escribir una respuesta larga
  cambiarEstatus: async function (req, res) {
    try {
      var nuevoEstatus = req.body.estatus;
      if (!Ticket.ESTATUS_TICKET.includes(nuevoEstatus)) {
        return res.status(400).send({ message: "Estatus no válido." });
      }

      var ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).send({ message: "Ticket no encontrado." });

      var estatusAnterior = ticket.estatus;
      ticket.estatus = nuevoEstatus;
      await ticket.save();

      var correo = templates.emailCambioEstatusTicket(ticket, estatusAnterior, req.body.observaciones);
      var mensajeGuardado = await enviarYRegistrarMensaje({
        ticket: ticket,
        tipo: "CAMBIO_ESTATUS",
        destinatarios: [ticket.correoSolicitante],
        asunto: correo.subject,
        html: correo.html,
        autor: req.user.usuario,
      });

      return res.status(200).send({ ticket: ticket, mensaje: mensajeGuardado });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al cambiar el estatus del ticket." });
    }
  },
};

module.exports = controller;
