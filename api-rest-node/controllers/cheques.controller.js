"use strict";
var Vendors = require("../models/vendors");
var cheque = require("../models/cheque");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

var ChequesController = {

  newCheque: async (req, res) => {
    try {
      const vendorId = req.params.id;

      const vendor = await Vendors.findById(vendorId);
      if (!vendor) {
        return res.status(404).send({ message: "Proveedor no encontrado" });
      }

      if (!req.files || !req.files.cheque) {
        return res
          .status(400)
          .send({ message: "No se envió ningún archivo de cheque." });
      }

      const archivoCheque = req.files.cheque;
      const extension = path.extname(archivoCheque.name).toLowerCase();

      if (extension !== ".jpg" || ".jpeg" || ".png") {
        return res.status(400).send({
          message: "Sólo se permiten imagenes con extension .jpeg .jpg .png",
        });
      }

      const hashName =
        crypto
          .createHash("sha256")
          .update(archivoCheque.name + Date.now().toString())
          .digest("hex") + extension;

      const basePath = path.join(__dirname, "../uploads/cheques/");
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
      }

      const savePath = path.join(basePath, hashName);
      await archivoCheque.mv(savePath);

      const nuevoCheque = new cheque({
        idVendor: vendorId,
        concepto: req.body.concepto || "",
        nombre: hashName,
        monto: req.body.monto || 0,
        pago: req.body.pago || "",
        fecha: new Date(),
      });

      await nuevoCheque.save();

      return res.status(200).send({ cheque: nuevoCheque });
    } catch (error) {
      console.error("Error al registrar cheque:", error);
      return res.status(500).send({ message: "Error interno del servidor" });
    }
  },

  getCheques: async (req, res) => {
    try {
      const vendorId = req.params.id;

      const vendor = await Vendors.findById(vendorId);
      if (!vendor) {
        return res.status(404).send({ message: "Proveedor no encontrado" });
      }

      const cheques = await cheque.find({ idVendor: vendorId });

      return res.status(200).send({ cheques });
    } catch (error) {
      console.error("Error al obtener cheques:", error);
      return res.status(500).send({ message: "Error interno del servidor" });
    }
  },

  getChequeImage: async (req, res) => {
    try {
      const chequeId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(chequeId)) {
        return res.status(400).send({ message: "ID de cheque inválido" });
      }

      const chequeDoc = await cheque.findById(chequeId);
      if (!chequeDoc) {
        return res.status(404).send({ message: "Cheque no encontrado" });
      }

      const fileName = chequeDoc.nombre;
      const filePath = path.join(__dirname, "../uploads/cheques", fileName);

      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .send({ message: "Archivo de imagen no encontrado" });
      }

      return res.sendFile(filePath);
    } catch (error) {
      console.error("Error al obtener imagen de cheque:", error);
      return res.status(500).send({ message: "Error interno del servidor" });
    }
  },

};

module.exports = ChequesController;
