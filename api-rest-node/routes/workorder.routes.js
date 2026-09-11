"use strict";

var express = require("express");
var WorkOrderController = require("../controllers/workorder.controller");
var router = express.Router();
var md_auth = require("../middleware/authenticated");

// Rutas de Ordenes de Trabajo
router.post("/workorder", md_auth.ensureAuth, WorkOrderController.createWorkOrder);
router.get("/workorders/:rfc/:empresa", md_auth.ensureAuth, WorkOrderController.getWorkOrders);
router.get("/workorders/empresa/:empresa", md_auth.ensureAuth, WorkOrderController.getAllWorkOrders);

// Rutas de Facturas
router.get("/invoices/:id", md_auth.ensureAuth, WorkOrderController.getInvoicesByWorkOrder);
router.post("/upload-invoice/:id/:rfc/:empresa", md_auth.ensureAuth, WorkOrderController.uploadInvoice);
router.put("/invoice-status/:id", md_auth.ensureAuth, WorkOrderController.updateInvoiceStatus);
router.get("/invoice-details/:id", md_auth.ensureAuth, WorkOrderController.getInvoiceXMLDetails);
// Rutas de Contratos en ODT
router.post("/upload-contrato-wo/:id", md_auth.ensureAuth, WorkOrderController.uploadContrato);
router.post("/upload-anexo-wo/:id", md_auth.ensureAuth, WorkOrderController.uploadAnexo);
router.put("/status-contrato-wo/:id", md_auth.ensureAuth, WorkOrderController.validateContrato);
router.put("/request-mod-contrato-wo/:id", md_auth.ensureAuth, WorkOrderController.requestContratoMod);
router.put("/approve-mod-contrato-wo/:id", md_auth.ensureAuth, WorkOrderController.approveContratoMod);

module.exports = router;
