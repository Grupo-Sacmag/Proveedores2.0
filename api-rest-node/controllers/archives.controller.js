"use strict";
var nodemailer = require("nodemailer");
var oldArchives = require("../models/oldArchives");
var Archives = require("../models/archives");
var Vendors = require("../models/vendors");
var Users = require("../models/user");
var archiver = require("archiver");
var fechArchivo = require("../models/fechArchivo");
const fs = require("fs");
const fsa = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

var ArchivesController = {

  saveArchives: async function (req, res) {
    try {
      const rfc = req.params.rfc?.toLowerCase().trim();
      const empresa = req.params.empresa?.toLowerCase().trim();
      const rol_usuario = req.user?.rol;

      if (rol_usuario !== "administrador" && rol_usuario !== "administrador_premium" && rol_usuario !== "proveedor") {
        return res
          .status(403)
          .send({ message: "No tienes permisos para realizar esta acción." });
      }

      if (!rfc || !empresa || !req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .send({ message: "Faltan datos requeridos: RFC, empresa y archivos." });
      }

      const existingArchive = await Archives.findOne({ rfc, empresa });
      if (existingArchive) {
        return res
          .status(409)
          .send({ message: "Archivos ya fueron enviados para este RFC y empresa." });
      }

      const basePath = path.join(__dirname, "..", "uploads");
      const archivosSubidos = Object.keys(req.files).filter((key) =>
        /^archivo([1-9]|1[0-5])$/.test(key)
      );

      if (archivosSubidos.length === 0) {
        return res.status(400).send({
          message:
            "No se encontraron campos válidos de archivo (archivo1 a archivo15).",
        });
      }

      const nuevoRegistro = new Archives({ rfc, empresa });

      for (const archivoKey of archivosSubidos) {
        const archivoSubido = req.files[archivoKey];
        const extension = path.extname(archivoSubido.name);
        const hashName =
          crypto
            .createHash("sha256")
            .update(archivoSubido.name + Date.now().toString())
            .digest("hex") + extension;

        const savePath = path.join(basePath, hashName);
        await archivoSubido.mv(savePath);

        nuevoRegistro[archivoKey] = hashName;
      }

      try {
        await nuevoRegistro.save();
      } catch (error) {
        return res
          .status(500)
          .send({ message: "Error al guardar archivos.", error });
      }

      try {
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "sacmag.proveedores@gmail.com",
            pass: "jvwezvognvounmdl",
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const vendor = await Vendors.findOne({ rfc });
        const vendorId = vendor ? vendor._id : "";

        let destinatarios = ["desarrollo.conta@grupo-sacmag.com.mx"];
        if (
          vendor &&
          String(vendor.empresa).toLowerCase().trim() === "sacmag"
        ) {
          destinatarios.push("rosaaaaddsfd.sanchez@grupo-sacmag.com.mx");
        }

        let info = await transporter.sendMail({
          from: '"Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
          to: destinatarios,
          subject: `Archivos recibidos para RFC: ${rfc.toUpperCase()}`,
          html: `
          <img src="cid:unique@kreata.ee">
          <h1>Proveedores Sacmag</h1>
          <p>Se han recibido archivos para el RFC: <b>${rfc.toUpperCase()}</b></p>
          <p>Por favor, ingrese a la plataforma para validarlos.</p>           
          <p>
            Click aquí para ir a la página ➜ 
            <a href="https://proveedores-grupo-sacmag.com.mx/proveedor/${vendorId}">
              https://proveedores-grupo-sacmag.com.mx/proveedor/${vendorId}
            </a>
          </p>
          <p>Correo enviado automáticamente, no responder.</p>
        `,
          attachments: [
            {
              filename: "image.png",
              path: __dirname + "/logo.png",
              cid: "unique@kreata.ee",
            },
          ],
        });

        console.log("Correo de aceptación enviado", info.envelope);
      } catch (correoError) {
        console.error("Error enviando correo:", correoError);
      }

      return res.status(200).send({
        message: "Archivos guardados correctamente.",
        archivo: nuevoRegistro,
      });
    } catch (error) {
      console.error("Error al guardar archivos:", error);
      return res.status(500).send({ message: "Error en el servidor.", error });
    }
  },

  getArchive: function (req, res) {
    const file = req.params.file;
    const path_file = path.join(__dirname, "../uploads", file);
    console.log(path_file);

    fs.stat(path_file, (err, stats) => {
      if (err) {
        if (err.code === "ENOENT") {
          return res.status(500).send({
            message: "No existe la información",
          });
        }
        return res.status(500).send({
          message: "Error al verificar el archivo",
        });
      }

      return res.sendFile(path_file);
    });
  },

  getAllArchives: async function (req, res) {
    try {
      const allArchives = await Archives.find({ borrado: false });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Todos-los-RFCs.zip"
      );
      res.setHeader("Content-Type", "application/zip");

      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      archive.on("error", function (err) {
        throw err;
      });

      archive.pipe(res);

      const getNombreArchivo = (numero) => {
        const nombres = [
          "Formato-Requisitado-Alta-Proveedor",
          "Constancia-Situacion-Fiscal",
          "Alta-Imss-Registro-Patronal",
          "Ine-Representante-Legal",
          "Acta-Constitutiva-Y-Modificaciones",
          "Comprobante-Domicilio",
          "Estado-Cuenta-Clabe",
          "Opinion-Cumplimiento-SAT",
          "Opinion-Cumplimiento-IMSS",
          "Opinion-Cumplimiento-INFONAVIT",
          "Curriculum",
          "REPSE",
          "Calibracion-Y-Certificaciones-Equipo",
          "Codigo-De-Etica",
          "Ultima-Declaracion-Anual",
        ];
        return nombres[numero - 1] || `Documento-${numero}`;
      };

      for (const record of allArchives) {
        const rfcFolder = record.rfc?.toUpperCase().trim() || "SIN-RFC";

        for (let i = 1; i <= 15; i++) {
          const fieldName = `archivo${i}`;
          const hashedFileName = record[fieldName];

          if (hashedFileName) {
            const absolutePath = path.resolve(
              __dirname,
              "../uploads",
              hashedFileName
            );

            if (fs.existsSync(absolutePath)) {
              const nombreArchivo = getNombreArchivo(i);
              const fileName = `${i}.${nombreArchivo}.pdf`;

              archive.file(absolutePath, {
                name: `${rfcFolder}/${fileName}`,
              });
            } else {
              console.warn();
            }
          }
        }
      }

      archive.finalize();
    } catch (err) {
      console.error("❌ ERROR al procesar archivos:", err);
      return res
        .status(500)
        .send({ message: "Error al procesar los archivos." });
    }
  },

  getVendorZip: async function (req, res) {
    try {
      const rfc = req.params.rfc?.toLowerCase().trim();
      const empresa = req.params.empresa?.toLowerCase().trim();
      if (!rfc || !empresa) {
        return res.status(400).send({ message: "Falta el RFC o la empresa del proveedor." });
      }

      const record = await Archives.findOne({ rfc, empresa });

      if (!record) {
        return res.status(404).send({ message: "No se encontraron archivos cargados para este proveedor y empresa." });
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${rfc.toUpperCase()}_documentos.zip`
      );
      res.setHeader("Content-Type", "application/zip");

      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      archive.on("error", function (err) {
        throw err;
      });

      archive.pipe(res);

      const getNombreArchivo = (numero) => {
        const nombres = [
          "Formato-Requisitado-Alta-Proveedor",
          "Constancia-Situacion-Fiscal",
          "Alta-Imss-Registro-Patronal",
          "Ine-Representante-Legal",
          "Acta-Constitutiva-Y-Modificaciones",
          "Comprobante-Domicilio",
          "Estado-Cuenta-Clabe",
          "Opinion-Cumplimiento-SAT",
          "Opinion-Cumplimiento-IMSS",
          "Opinion-Cumplimiento-INFONAVIT",
          "Curriculum",
          "REPSE",
          "Calibracion-Y-Certificaciones-Equipo",
          "Codigo-De-Etica",
          "Ultima-Declaracion-Anual",
        ];
        return nombres[numero - 1] || `Documento-${numero}`;
      };

      for (let i = 1; i <= 15; i++) {
        const fieldName = `archivo${i}`;
        const hashedFileName = record[fieldName];

        if (hashedFileName) {
          const absolutePath = path.resolve(__dirname, "../uploads", hashedFileName);

          if (fs.existsSync(absolutePath)) {
            const nombreArchivo = getNombreArchivo(i);
            const fileName = `${i}.${nombreArchivo}.pdf`;

            archive.file(absolutePath, {
              name: `Descargas/${fileName}`,
            });
          }
        }
      }

      archive.finalize();
    } catch (err) {
      console.error("❌ ERROR al procesar zip de proveedor:", err);
      return res.status(500).send({ message: "Error al generar el archivo ZIP." });
    }
  },

  getArchivesRfc: async function (req, res) {
    const projectrfc = req.params.rfc?.toLowerCase().trim();
    const empresaSolicitada = req.params.empresa?.toLowerCase().trim();

    if (!projectrfc || !empresaSolicitada) {
      return res.status(404).send({ message: "Los archivos no existen" });
    }

    try {
      let project = await Archives.findOne({ rfc: projectrfc, empresa: empresaSolicitada }).exec();

      if (!project) {
        // [MODIFICACIÓN]: Antes aquí se buscaban expedientes "legacy" (sin empresa) 
        // y se clonaban para la nueva empresa automáticamente. 
        // Se eliminó esta lógica para cumplir la regla de negocio:
        // CADA EMPRESA DEBE TENER SU EXPEDIENTE AISLADO. Si no existe, devuelve 404 para que inicie en 0%.
      }

      if (!project) {
        return res.status(404).send({ message: "Los archivos no existen para esta empresa." });
      }

      return res.status(200).send({ archives: project });

    } catch (err) {
      console.error("Error en getArchivesRfc:", err);
      return res.status(500).send({ message: "Error interno al buscar los archivos." });
    }
  },

  refuseArchives: async function (req, res) {
    const projectRfc = req.params.rfc;
    const empresa = req.params.empresa;
    const mensaje = req.params.mensaje?.toLowerCase().trim();
    const rol_usuario = req.user.rol;

    if (rol_usuario !== "administrador" && rol_usuario !== "administrador_premium" && rol_usuario !== "usuario") {
      return res
        .status(403)
        .send({ message: "No tienes permisos suficientes" });
    }

    try {
      const vendorSearch = await Vendors.findOne({
        rfc: projectRfc.toLowerCase().trim(),
      });
      if (!vendorSearch) {
        return res.status(404).send({ message: "Proveedor no encontrado" });
      }

      const userAlta = await Users.findOne({
        usuario: vendorSearch.userAlta?.toLowerCase().trim(),
      });

      // Ya no borramos los archivos
      // const archivesRemoved = await Archives.deleteMany({
      //   rfc: projectRfc.toLowerCase().trim(),
      //   empresa: empresa.toLowerCase().trim()
      // });
      const archivesRemoved = []; // Dejamos esto vacío para que no rompa el return

      await Vendors.updateOne(
        { rfc: projectRfc.toLowerCase() },
        { verificado: false }
      );

      const contentHtml = `
      <img src="cid:unique@kreata.ee">
      <h1>Proveedores Sacmag</h1>
      <a href="https://proveedores-grupo-sacmag.com.mx/" target="_blank">Click aquí para entrar al Sitio Web</a>
      <br><br>
      <h4>Rechazo de archivos</h4>
      <p>Buen día, debido a: <b>${mensaje}</b> fueron rechazados los archivos subidos al sistema. 
      Deberás subir correctamente la documentación para la validación.</p>
      <p>Correo enviado automáticamente, no responder.</p>
    `;

      try {
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "sacmag.proveedores@gmail.com",
            pass: "jvwezvognvounmdl",
          },
        });

        const mailOptions = {
          from: '"Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
          to: `${vendorSearch.correo}, ${userAlta?.correo}`,
          subject: `Archivos Rechazados ${vendorSearch.razonSocial.toUpperCase()}`,
          html: contentHtml,
          attachments: [
            {
              filename: "image.png",
              path: __dirname + "/logo.png",
              cid: "unique@kreata.ee",
            },
          ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de rechazo enviado:", info.envelope);
      } catch (mailErr) {
        console.error("Error enviando correo:", mailErr);
      }

      return res.status(200).send({ archives: archivesRemoved });
    } catch (error) {
      console.error("Error en rechazo:", error);
      return res.status(500).send({ message: "Ocurrió un error", error });
    }
  },

  validateVendor: function (req, res) {
    var projectRfc = req.params.rfc;
    var empresa = req.params.empresa;

    Archives.updateOne(
      { rfc: projectRfc.toLowerCase().trim(), empresa: empresa.toLowerCase().trim() },
      { validar: true },
      (err, archivesUpdate) => {
        if (err)
          return res
            .status(500)
            .send({ message: "No se han podido borrar los archivos" });
        if (!archivesUpdate)
          return res
            .status(404)
            .send({ message: "Error al borrar los archivos" });
        if (archivesUpdate) {
          const userValidador = req.user ? req.user.usuario : "admin";
          Vendors.updateOne(
            { rfc: projectRfc.toLowerCase() },
            { verificado: true, userVerifico: userValidador, fechaVerificado: new Date() },
            async (err, vendorUpdate) => {
              if (err)
                return res
                  .status(500)
                  .send({ message: "Error al actualizar el proveedor" });
              if (!vendorUpdate)
                return res
                  .status(404)
                  .send({ message: "Error al actualizar el proveedor" });

              try {
                const vendor = await Vendors.findOne({
                  rfc: projectRfc.toLowerCase(),
                });
                if (vendor && vendor.correo) {
                  let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                      user: "sacmag.proveedores@gmail.com",
                      pass: "jvwezvognvounmdl",
                    },
                  });

                  const contentHtml = `
                    <img src="cid:unique@kreata.ee">
                    <h1>Proveedores Sacmag</h1>
                    <p>¡Tus archivos han sido validados exitosamente!</p>
                    <p>Ya eres proveedor autorizado en la plataforma.</p>
                    <p>Correo enviado automáticamente, no responder.</p>
                  `;

                  await transporter.sendMail({
                    from: '"Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
                    to: vendor.correo,
                    subject: "Validación exitosa de archivos",
                    html: contentHtml,
                    attachments: [
                      {
                        filename: "image.png",
                        path: __dirname + "/logo.png",
                        cid: "unique@kreata.ee",
                      },
                    ],
                  });
                }
              } catch (mailErr) {
                console.error("Error enviando correo de validación:", mailErr);
              }

              return res.status(200).send({
                archives: archivesUpdate,
              });
            }
          );
        }
      }
    );
  },

  getArchiveOld: async (req, res) => {
    try {
      const rfc = req.params.rfc?.toLowerCase();

      if (!rfc) {
        return res.status(400).send({ message: "Falta el parámetro RFC." });
      }

      const archivoDb = await oldArchives.findOne({ rfc });

      if (!archivoDb) {
        return res
          .status(404)
          .send({ message: "No se encontraron archivos para este RFC." });
      }

      const archivosOrganizados = {};

      for (let i = 1; i <= 15; i++) {
        const key = `archivo${i}`;
        const archivos = archivoDb[key];
        const archivosValidos = [];

        if (Array.isArray(archivos)) {
          for (const nombreArchivo of archivos) {
            const pathArchivo = path.join(
              __dirname,
              "../uploads/old",
              nombreArchivo
            );

            if (fs.existsSync(pathArchivo)) {
              const rutaArchivo = `/uploads/old/${nombreArchivo}`;
              archivosValidos.push({
                ruta: rutaArchivo,
              });
            }
          }
        }

        if (archivosValidos.length > 0) {
          archivosOrganizados[key] = archivosValidos;
        }
      }

      if (Object.keys(archivosOrganizados).length === 0) {
        return res.status(404).send({
          message: "No se encontraron archivos válidos para este RFC.",
        });
      }

      return res.status(200).send({ archivos: archivosOrganizados });
    } catch (error) {
      console.error("Error al obtener archivos:", error);
      return res.status(500).send({ message: "Error interno del servidor." });
    }
  },

  ArchiveOld: function (req, res) {
    const file = req.params.file;
    const path_file = path.join(__dirname, "../uploads/old/", file);

    console.log("Ruta del archivo:", path_file);

    fs.stat(path_file, (err, stats) => {
      if (err) {
        if (err.code === "ENOENT") {
          return res.status(404).send({
            message: "No se encontró el archivo",
          });
        }
        return res.status(500).send({
          message: "Error al verificar el archivo",
        });
      }
      return res.sendFile(path_file);
    });
  },

  updateArchives: async (req, res) => {
    try {
      const rfc = req.params.rfc?.toLowerCase();
      const empresa = req.params.empresa?.toLowerCase().trim();

      if (!rfc || !empresa || !req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .send({ message: "Faltan datos requeridos: RFC, empresa y archivo." });
      }

      const archivoDb = await Archives.findOne({ rfc, empresa });
      if (!archivoDb) {
        return res
          .status(404)
          .send({ message: "Archivo no encontrado para este RFC y empresa." });
      }

      const basePath = path.join(__dirname, "..", "uploads");
      const oldDir = path.join(basePath, "old");

      if (!fs.existsSync(oldDir)) {
        await fsa.mkdir(oldDir);
      }

      let oldArchive = await oldArchives.findOne({ rfc, empresa });
      if (!oldArchive) {
        oldArchive = new oldArchives({ rfc, empresa });
      }

      const archivosSubidos = Object.keys(req.files).filter((key) =>
        /^archivo([1-9]|1[0-5])$/.test(key)
      );

      if (archivosSubidos.length === 0) {
        return res.status(400).send({
          message:
            "No se encontraron campos válidos de archivo (archivo1 a archivo15).",
        });
      }

      for (const archivoKey of archivosSubidos) {
        const archivoSubido = req.files[archivoKey];
        const extension = path.extname(archivoSubido.name);
        const hashName =
          crypto
            .createHash("sha256")
            .update(archivoSubido.name + Date.now().toString())
            .digest("hex") + extension;

        const newFilePath = path.join(basePath, hashName);
        const oldFileName = archivoDb[archivoKey];

        if (oldFileName) {
          const oldFilePath = path.join(basePath, oldFileName);
          const backupPath = path.join(oldDir, oldFileName);

          if (fs.existsSync(oldFilePath)) {
            await fsa.copyFile(oldFilePath, backupPath);

            if (!Array.isArray(oldArchive[archivoKey])) {
              oldArchive[archivoKey] = [];
            }
            oldArchive[archivoKey].push(oldFileName);

            await fsa.unlink(oldFilePath);
          }
        }

        await archivoSubido.mv(newFilePath);

        archivoDb[archivoKey] = hashName;

        const validacionKey = `validacion${archivoKey.replace("archivo", "")}`;
        const motivoKey = `motivo${archivoKey.replace("archivo", "")}`;
        
        archivoDb[validacionKey] = null;
        archivoDb[motivoKey] = "";
      }

      await archivoDb.save();
      await oldArchive.save();

      res.status(200).send({
        message: "Archivos actualizados exitosamente.",
        archivo: archivoDb,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error en el servidor." });
    }
  },

  getFechaArchivoPorNombre: async (req, res) => {
    try {
      const nombreArchivo = decodeURIComponent(req.params.nombre).trim();
      const archivo = await fechArchivo.findOne({
        nombreARC: { $regex: `^${nombreArchivo}$`, $options: "i" },
      });

      if (!archivo) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }
      console.log("nombreArchivo recibido: cabezones", nombreArchivo);

      const fechaUM = archivo.fechaUM;
      const fechaFormateada = `${fechaUM.getFullYear()}-${(
        fechaUM.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${fechaUM.getDate().toString().padStart(2, "0")}`;

      return res.json({
        nombre: archivo.nombreARC,
        fecha: fechaFormateada,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  },

  toggleFileValidation: async function (req, res) {
    const rfc = req.params.rfc?.toLowerCase().trim();
    const empresa = req.params.empresa?.toLowerCase().trim();
    const { fileIndex, isValid } = req.body;
    const rol_usuario = req.user.rol;

    const fileNames = [
      null,
      "Formato-Requisitado-Alta-Proveedor",
      "Constancia-Situacion-Fiscal",
      "Alta-Imss-Registro-Patronal",
      "Ine-Representante-Legal",
      "Acta-Constitutiva-Y-Modificaciones",
      "Comprobante-Domicilio",
      "Estado-Cuenta-Clabe",
      "Opinion-Cumplimiento-SAT",
      "Opinion-Cumplimiento-IMSS",
      "Opinion-Cumplimiento-INFONAVIT",
      "Curriculum",
      "REPSE",
      "Calibracion-Y-Certificaciones-Equipo",
      "Codigo-De-Etica",
      "Ultima-Declaracion-Anual",
    ];

    if (rol_usuario !== "administrador" && rol_usuario !== "administrador_premium" && rol_usuario !== "usuario") {
      return res
        .status(403)
        .send({ message: "No tienes permisos suficientes" });
    }

    if (!rfc) {
      return res.status(400).send({ message: "Falta el RFC" });
    }
    if (
      !fileIndex ||
      fileIndex < 1 ||
      fileIndex > 15 ||
      typeof isValid !== "boolean"
    ) {
      return res.status(400).send({
        message:
          "Datos de 'fileIndex' (1-15) o 'isValid' (boolean) incorrectos.",
      });
    }

    try {
      const fieldToUpdate = `validacion${fileIndex}`;
      const updateQuery = { $set: { [fieldToUpdate]: isValid } };

      const updatedArchive = await Archives.findOneAndUpdate(
        { rfc: rfc, empresa: empresa },
        updateQuery,
        { new: true }
      );

      if (!updatedArchive) {
        return res
          .status(404)
          .send({ message: "No se encontraron archivos para ese RFC y empresa." });
      }

      if (isValid === false) {
        const vendor = await Vendors.findOne({ rfc });
        if (vendor && vendor.correo) {
          try {
            const rejectedFileName = fileNames[fileIndex];

            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              auth: {
                user: "sacmag.proveedores@gmail.com",
                pass: "jvwezvognvounmdl",
              },
            });

            const contentHtml = `
              <img src="cid:unique@kreata.ee">
              <h1>Proveedores Sacmag</h1>
              <br>
              <p>Uno de tus documentos ha sido <b>rechazado</b>.</p>
              <p><strong>Documento:</strong> ${rejectedFileName}</p>
              <p>Por favor ingresa a la plataforma y actualizalo.</p>
              <p>Correo enviado automáticamente, no responder.</p>
            `;

            await transporter.sendMail({
              from: '"Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
              to: vendor.correo,
              subject: `Documento Rechazado: ${rejectedFileName}`,
              html: contentHtml,
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee",
                },
              ],
            });

            console.log(
              `Correo de rechazo enviado a ${vendor.correo} por archivo: ${rejectedFileName}`
            );
          } catch (mailErr) {
            console.error("Error enviando correo de rechazo:", mailErr);
          }
        }
      }

      let allValid = true;
      let hasFiles = false;

      for (let i = 1; i <= 15; i++) {
        const fileField = `archivo${i}`;
        const validField = `validacion${i}`;

        if (updatedArchive[fileField]) {
          hasFiles = true;
          if (updatedArchive[validField] !== true) {
            allValid = false;
            break;
          }
        }
      }

      if (hasFiles && allValid && updatedArchive.validar !== true) {
        updatedArchive.validar = true;
        await updatedArchive.save();

        const userValidador = req.user ? req.user.usuario : "admin";
        await Vendors.updateOne(
          { rfc: rfc },
          { verificado: true, userVerifico: userValidador, fechaVerificado: new Date() }
        );

        const vendor = await Vendors.findOne({ rfc: rfc });
        if (vendor && vendor.correo) {
          try {
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              auth: {
                user: "sacmag.proveedores@gmail.com",
                pass: "jvwezvognvounmdl",
              },
            });
            const contentHtml = `
                  <img src="cid:unique@kreata.ee">
                  <h1>Proveedores Sacmag</h1>
                  <br>
                  
                  <p>¡Tus archivos han sido validados exitosamente!</p>
                  <p>Ya eres proveedor autorizado en la plataforma.</p>
                  <p>Correo enviado automáticamente, no responder.</p>
                `;
            await transporter.sendMail({
              from: '"Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
              to: vendor.correo,
              subject: "Validación exitosa de archivos",
              html: contentHtml,
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee",
                },
              ],
            });
            console.log(
              "Correo de validación completa enviado a:",
              vendor.correo
            );
          } catch (mailErr) {
            console.error("Error enviando correo de validación:", mailErr);
          }
        }

      } else if (!allValid && updatedArchive.validar === true) {
        updatedArchive.validar = false;
        await updatedArchive.save();

        await Vendors.updateOne(
          { rfc: rfc },
          { verificado: false, userVerifico: null, fechaVerificado: null }
        );
      }

      return res.status(200).send({
        message: `Archivo ${fileIndex} actualizado a ${isValid}.`,
        archive: updatedArchive,
      });
    } catch (error) {
      console.error("Error en toggleFileValidation:", error);
      return res.status(500).send({ message: "Error en el servidor", error });
    }
  },

};

module.exports = ArchivesController;
