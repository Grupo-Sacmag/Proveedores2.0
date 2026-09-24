"use strict";
var express = require("express");
var router = express.Router();
var TicketController = require("../controllers/ticket.controller");
var md_auth = require("../middleware/authenticated");
var md_adminPremium = require("../middleware/adminPremium");

// --- Proveedor / usuario ---
router.post("/ticket", md_auth.ensureAuth, TicketController.crearTicket);
router.get("/mis-tickets", md_auth.ensureAuth, TicketController.getMisTickets);
router.get("/ticket/:id", md_auth.ensureAuth, TicketController.getTicketDetail);

// --- Dashboard Admin (solo administrador_premium — Criterio 3) ---
router.get("/admin/tickets", md_auth.ensureAuth, md_adminPremium.ensureAdminPremium, TicketController.getAllTickets);
router.post("/admin/ticket/:id/responder", md_auth.ensureAuth, md_adminPremium.ensureAdminPremium, TicketController.responderTicket);
router.put("/admin/ticket/:id/estatus", md_auth.ensureAuth, md_adminPremium.ensureAdminPremium, TicketController.cambiarEstatus);

module.exports = router;
