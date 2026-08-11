"use strict";

var WorkOrder = require("../models/workorder");
var Invoice = require("../models/invoice");
var { XMLParser } = require("fast-xml-parser");
var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
var https = require("https");

function verificarFacturaSAT(rfcEmisor, rfcReceptor, total, uuid) {
  return new Promise((resolve, reject) => {
    // Formato exacto requerido por el SAT
    const expresion = `?re=${rfcEmisor}&rr=${rfcReceptor}&tt=${total}&id=${uuid}`;
    const soapBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soapenv:Header/><soapenv:Body><tem:Consulta><tem:expresion><![CDATA[${expresion}]]></tem:expresion></tem:Consulta></soapenv:Body></soapenv:Envelope>`;

    const options = {
      hostname: 'consultaqr.facturaelectronica.sat.gob.mx',
      port: 443,
      path: '/ConsultaCFDIService.svc',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(soapBody),
        'SOAPAction': 'http://tempuri.org/IConsultaCFDIService/Consulta'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const estadoMatch = data.match(/<a:Estado>(.*?)<\/a:Estado>/);
        const estado = estadoMatch ? estadoMatch[1] : 'Desconocido';
        resolve(estado);
      });
    });

    req.on('error', (e) => reject(e));
    req.write(soapBody);
    req.end();
  });
}

var controller = {
  // Crear una nueva Orden de Trabajo
  createWorkOrder: async function (req, res) {
    try {
      var params = req.body;
      var rol_usuario = req.user.rol;

      if (!params.folio || !params.rfcProveedor || !params.empresa || !params.descripcion) {
        return res.status(400).send({ message: "Faltan campos obligatorios" });
      }

      var newWorkOrder = new WorkOrder({
        folio: params.folio.toUpperCase().trim(),
        rfcProveedor: params.rfcProveedor.toLowerCase().trim(),
        empresa: params.empresa.toLowerCase().trim(),
        descripcion: params.descripcion,
        montoTotal: params.montoTotal || 0,
        estatus: 'Activa'
      });

      var workOrderStored = await newWorkOrder.save();
      return res.status(200).send({ workOrder: workOrderStored });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al guardar la orden de trabajo" });
    }
  },

  // Obtener las órdenes de trabajo de un proveedor por empresa
  getWorkOrders: async function (req, res) {
    try {
      var rfc = req.params.rfc.toLowerCase().trim();
      var empresa = req.params.empresa.toLowerCase().trim();

      var workOrders = await WorkOrder.find({ rfcProveedor: rfc, empresa: empresa }).sort('-fechaCreacion');
      return res.status(200).send({ workOrders });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener las órdenes de trabajo" });
    }
  },

  // Obtener todas las órdenes de trabajo de una empresa (Para Administradores)
  getAllWorkOrders: async function (req, res) {
    try {
      var empresa = req.params.empresa.toLowerCase().trim();
      var workOrders = await WorkOrder.find({ empresa: empresa }).sort('-fechaCreacion');
      return res.status(200).send({ workOrders });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener todas las órdenes de trabajo" });
    }
  },

  // Obtener facturas de una orden de trabajo
  getInvoicesByWorkOrder: async function (req, res) {
    try {
      var workOrderId = req.params.id;
      var invoices = await Invoice.find({ ordenTrabajoId: workOrderId }).sort('-fechaCarga');
      return res.status(200).send({ invoices });
    } catch (err) {
      return res.status(500).send({ message: "Error al obtener las facturas" });
    }
  },

  // Subir factura (XML y PDF)
  uploadInvoice: async function (req, res) {
    try {
      var workOrderId = req.params.id;
      var rfc = req.params.rfc.toLowerCase().trim();
      var empresa = req.params.empresa.toLowerCase().trim();

      if (!req.files || !req.files.xml || !req.files.pdf) {
        return res.status(400).send({ message: "Debe enviar tanto el archivo XML como el PDF." });
      }

      var archivoXML = req.files.xml;
      var archivoPDF = req.files.pdf;

      if (path.extname(archivoXML.name).toLowerCase() !== '.xml') {
        return res.status(400).send({ message: "El primer archivo debe ser un XML válido." });
      }
      if (path.extname(archivoPDF.name).toLowerCase() !== '.pdf') {
        return res.status(400).send({ message: "El segundo archivo debe ser un PDF válido." });
      }

      // Parsea el XML
      var xmlData = fs.readFileSync(archivoXML.tempFilePath, 'utf8');
      var parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
      var jObj = parser.parse(xmlData);

      // Extraer info de CFDI
      var cfdiComprobante = jObj["cfdi:Comprobante"];
      if (!cfdiComprobante) {
        return res.status(400).send({ message: "El XML no parece ser un CFDI válido." });
      }

      var cfdiEmisor = cfdiComprobante["cfdi:Emisor"];
      var cfdiReceptor = cfdiComprobante["cfdi:Receptor"];
      var cfdiComplemento = cfdiComprobante["cfdi:Complemento"];
      var timbreFiscal = cfdiComplemento ? cfdiComplemento["tfd:TimbreFiscalDigital"] : null;

      if (!cfdiEmisor || !cfdiEmisor["@_Rfc"]) {
        return res.status(400).send({ message: "El XML no contiene información del Emisor." });
      }

      var rfcEmisor = cfdiEmisor["@_Rfc"].toLowerCase().trim();
      if (rfcEmisor !== rfc) {
        return res.status(400).send({ message: "El RFC del Emisor en el XML no coincide con tu perfil de proveedor." });
      }

      var uuid = timbreFiscal ? timbreFiscal["@_UUID"] : "SIN-UUID-" + Date.now();
      var subtotal = parseFloat(cfdiComprobante["@_SubTotal"] || 0);
      var total = parseFloat(cfdiComprobante["@_Total"] || 0);
      var moneda = cfdiComprobante["@_Moneda"] || "MXN";
      var fechaEmision = new Date(cfdiComprobante["@_Fecha"]);

      // Calcular IVA
      var iva = 0;
      var cfdiImpuestos = cfdiComprobante["cfdi:Impuestos"];
      if (cfdiImpuestos && cfdiImpuestos["@_TotalImpuestosTrasladados"]) {
        iva = parseFloat(cfdiImpuestos["@_TotalImpuestosTrasladados"]);
      }

      // ----------------------------------------------------
      // INTEGRACIÓN SAT: Verificar estatus oficial en línea
      // ----------------------------------------------------
      var rfcReceptor = cfdiReceptor ? cfdiReceptor["@_Rfc"] : "";
      var rfcEmisorOriginal = cfdiEmisor["@_Rfc"]; // Sin toLowerCase para mandarlo tal cual al SAT
      var totalParaSAT = cfdiComprobante["@_Total"]; // String original exacto
      
      try {
        const estatusSAT = await verificarFacturaSAT(rfcEmisorOriginal, rfcReceptor, totalParaSAT, uuid);
        
        if (estatusSAT === 'Cancelado') {
          return res.status(400).send({ message: "Rechazada: La factura aparece como CANCELADA en el SAT." });
        } else if (estatusSAT === 'No Encontrado') {
          return res.status(400).send({ message: "Rechazada: La factura NO EXISTE en los servidores del SAT o los montos/RFC fueron alterados." });
        } else if (estatusSAT !== 'Vigente') {
          // Si el estado es otro ("Desconocido" o algo raro), lo permitimos pasar pero podríamos marcarlo
          console.log("SAT respondió con estatus inusual:", estatusSAT);
        }
      } catch (satError) {
        // Si el SAT no responde (timeout, caída de sistema), rechazamos por seguridad (como lo pidió el usuario).
        console.error("Error al consultar el SAT:", satError);
        return res.status(500).send({ message: "El servidor del SAT no responde. Intenta subir tu factura más tarde." });
      }
      // ----------------------------------------------------

      // Validar si la factura ya existe
      var checkInvoice = await Invoice.findOne({ uuid: uuid });
      if (checkInvoice) {
        return res.status(400).send({ message: "Esta factura ya fue cargada anteriormente en el sistema." });
      }

      // Guardar archivos
      const basePath = path.join(__dirname, "../uploads");
      
      const xmlHashName = crypto.createHash("sha256").update(archivoXML.name + Date.now().toString()).digest("hex") + ".xml";
      const pdfHashName = crypto.createHash("sha256").update(archivoPDF.name + Date.now().toString()).digest("hex") + ".pdf";

      await archivoXML.mv(path.join(basePath, xmlHashName));
      await archivoPDF.mv(path.join(basePath, pdfHashName));

      // Guardar registro
      var newInvoice = new Invoice({
        ordenTrabajoId: workOrderId,
        rfcProveedor: rfc,
        empresa: empresa,
        uuid: uuid,
        subtotal: subtotal,
        iva: iva,
        total: total,
        moneda: moneda,
        fechaEmision: fechaEmision,
        archivoXML: xmlHashName,
        archivoPDF: pdfHashName,
        estatusValidacion: 'Pendiente'
      });

      var invoiceStored = await newInvoice.save();
      return res.status(200).send({ invoice: invoiceStored, message: "Factura cargada correctamente." });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al procesar la factura XML." });
    }
  },

  // Cambiar estatus de la factura (Aprobar / Rechazar)
  updateInvoiceStatus: async function (req, res) {
    try {
      var invoiceId = req.params.id;
      var estatus = req.body.estatus; // 'Aprobada' o 'Rechazada'
      var observaciones = req.body.observaciones || "";

      var updated = await Invoice.findByIdAndUpdate(invoiceId, { estatusValidacion: estatus, observacionesRechazo: observaciones }, { new: true });
      return res.status(200).send({ invoice: updated });
    } catch (err) {
      return res.status(500).send({ message: "Error al actualizar el estatus de la factura" });
    }
  },

  // === MÓDULO DE CONTRATOS EN ODT ===

  // Subir contrato (PDF)
  uploadContrato: async function (req, res) {
    try {
      var workOrderId = req.params.id;

      if (!req.files || !req.files.pdf) {
        return res.status(400).send({ message: "Debe enviar el archivo PDF del contrato." });
      }

      var archivoPDF = req.files.pdf;

      if (path.extname(archivoPDF.name).toLowerCase() !== '.pdf') {
        return res.status(400).send({ message: "El archivo debe ser un PDF válido." });
      }

      // Validar si la ODT está en un estado permitido para subir contrato
      var wo = await WorkOrder.findById(workOrderId);
      if (!wo) return res.status(404).send({ message: "Orden de trabajo no encontrada." });
      
      if (wo.estatusContrato !== 'Sin Contrato' && wo.estatusContrato !== 'En Modificación' && wo.estatusContrato !== 'Rechazado') {
        return res.status(400).send({ message: "El contrato no se puede subir en el estado actual: " + wo.estatusContrato });
      }

      // Guardar archivo
      const basePath = path.join(__dirname, "../uploads");
      const pdfHashName = crypto.createHash("sha256").update(archivoPDF.name + Date.now().toString()).digest("hex") + ".pdf";

      await archivoPDF.mv(path.join(basePath, pdfHashName));

      // Actualizar ODT
      var updated = await WorkOrder.findByIdAndUpdate(workOrderId, {
        archivoContrato: pdfHashName,
        estatusContrato: 'Pendiente de Validación',
        observacionesContrato: ''
      }, { new: true });

      return res.status(200).send({ workOrder: updated, message: "Contrato subido correctamente." });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al subir el contrato." });
    }
  },

  // Validar contrato (Admin)
  validateContrato: async function (req, res) {
    try {
      var workOrderId = req.params.id;
      var estatus = req.body.estatus; // 'Aprobado' o 'Rechazado'
      var observaciones = req.body.observaciones || "";

      if (estatus !== 'Aprobado' && estatus !== 'Rechazado') {
        return res.status(400).send({ message: "Estatus no válido." });
      }

      var updated = await WorkOrder.findByIdAndUpdate(workOrderId, {
        estatusContrato: estatus,
        observacionesContrato: observaciones
      }, { new: true });

      return res.status(200).send({ workOrder: updated });
    } catch (err) {
      return res.status(500).send({ message: "Error al validar el contrato." });
    }
  },

  // Solicitar modificación (Proveedor)
  requestContratoMod: async function (req, res) {
    try {
      var workOrderId = req.params.id;

      var wo = await WorkOrder.findById(workOrderId);
      if (wo.estatusContrato !== 'Aprobado') {
        return res.status(400).send({ message: "Solo se puede solicitar modificar un contrato Aprobado." });
      }

      var updated = await WorkOrder.findByIdAndUpdate(workOrderId, {
        estatusContrato: 'Solicitud de Modificación'
      }, { new: true });

      return res.status(200).send({ workOrder: updated });
    } catch (err) {
      return res.status(500).send({ message: "Error al solicitar modificación." });
    }
  },

  // Aprobar solicitud de modificación (Admin)
  approveContratoMod: async function (req, res) {
    try {
      var workOrderId = req.params.id;

      var wo = await WorkOrder.findById(workOrderId);
      if (wo.estatusContrato !== 'Solicitud de Modificación') {
        return res.status(400).send({ message: "El contrato no tiene una solicitud pendiente." });
      }

      var updated = await WorkOrder.findByIdAndUpdate(workOrderId, {
        estatusContrato: 'En Modificación'
      }, { new: true });

      return res.status(200).send({ workOrder: updated });
    } catch (err) {
      return res.status(500).send({ message: "Error al aprobar modificación." });
    }
  },

  // Obtener detalles completos del XML
  getInvoiceXMLDetails: async function(req, res) {
    try {
      var invoiceId = req.params.id;
      var invoice = await Invoice.findById(invoiceId);
      if (!invoice) return res.status(404).send({ message: "Factura no encontrada." });

      var xmlPath = path.join(__dirname, "../uploads", invoice.archivoXML);
      if (!fs.existsSync(xmlPath)) {
        return res.status(404).send({ message: "El archivo XML físico no se encontró en el servidor." });
      }

      var xmlData = fs.readFileSync(xmlPath, 'utf8');
      var parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
      var jObj = parser.parse(xmlData);

      var cfdiComprobante = jObj["cfdi:Comprobante"];
      if (!cfdiComprobante) return res.status(400).send({ message: "XML inválido" });

      var emisor = cfdiComprobante["cfdi:Emisor"] || {};
      var receptor = cfdiComprobante["cfdi:Receptor"] || {};
      var conceptosRaw = cfdiComprobante["cfdi:Conceptos"] ? cfdiComprobante["cfdi:Conceptos"]["cfdi:Concepto"] : [];
      var impuestos = cfdiComprobante["cfdi:Impuestos"] || {};

      // Normalizar conceptos (si es solo un concepto, fast-xml-parser lo devuelve como objeto y no array)
      var conceptos = Array.isArray(conceptosRaw) ? conceptosRaw : [conceptosRaw];
      
      var conceptosLimpios = conceptos.map(c => ({
        claveProdServ: c["@_ClaveProdServ"],
        cantidad: c["@_Cantidad"],
        unidad: c["@_Unidad"] || c["@_ClaveUnidad"],
        descripcion: c["@_Descripcion"],
        valorUnitario: c["@_ValorUnitario"],
        importe: c["@_Importe"]
      }));

      var trasladosRaw = impuestos["cfdi:Traslados"] ? impuestos["cfdi:Traslados"]["cfdi:Traslado"] : [];
      var retencionesRaw = impuestos["cfdi:Retenciones"] ? impuestos["cfdi:Retenciones"]["cfdi:Retencion"] : [];
      
      var traslados = (Array.isArray(trasladosRaw) ? trasladosRaw : [trasladosRaw]).filter(t => t).map(t => ({
        impuesto: t["@_Impuesto"],
        tipoFactor: t["@_TipoFactor"],
        tasaOCuota: t["@_TasaOCuota"],
        importe: t["@_Importe"]
      }));

      var retenciones = (Array.isArray(retencionesRaw) ? retencionesRaw : [retencionesRaw]).filter(r => r).map(r => ({
        impuesto: r["@_Impuesto"],
        importe: r["@_Importe"]
      }));

      var detalles = {
        emisor: {
          rfc: emisor["@_Rfc"],
          nombre: emisor["@_Nombre"],
          regimenFiscal: emisor["@_RegimenFiscal"]
        },
        receptor: {
          rfc: receptor["@_Rfc"],
          nombre: receptor["@_Nombre"],
          usoCFDI: receptor["@_UsoCFDI"]
        },
        conceptos: conceptosLimpios,
        impuestos: {
          totalTrasladados: impuestos["@_TotalImpuestosTrasladados"] || 0,
          totalRetenidos: impuestos["@_TotalImpuestosRetenidos"] || 0,
          listaTraslados: traslados,
          listaRetenciones: retenciones
        },
        totales: {
          subTotal: cfdiComprobante["@_SubTotal"],
          descuento: cfdiComprobante["@_Descuento"] || 0,
          total: cfdiComprobante["@_Total"],
          moneda: cfdiComprobante["@_Moneda"]
        }
      };

      return res.status(200).send({ detalles });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al leer el XML." });
    }
  }
};

module.exports = controller;
