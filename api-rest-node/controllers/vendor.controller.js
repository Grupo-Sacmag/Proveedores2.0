"use strict";
var bcrypt = require("bcrypt-nodejs");
var nodemailer = require("nodemailer");
var oldArchives = require("../models/oldArchives");
var Archives = require("../models/archives");
var Vendors = require("../models/vendors");
var Users = require("../models/user");
var moment = require("moment");
const fs = require("fs");
const fsa = require("fs").promises;
const path = require("path");

const nombresArchivosParaCorreo = [
  "Formato requisitado para alta del proveedor",
  "Constancia de situación fiscal SAT",
  "Alta imss registro patronal",
  "Ine representante legal",
  "Acta constitutiva y modificaciones(sólo aplica para persona moral) y poder del representante legal",
  "Comprobante de domicilio del domicilio fiscal vigente",
  "Estado de cuenta con cuenta clabe, sólo caratula",
  "Opinión de cumplimiento de 32D SAT",
  "Opinión de cumplimiento de 32D IMSS",
  "Opinión de cumplimiento de 32D INFONAVIT",
  "Curriculum de la empresa o persona fisica y/o cédula de las personas que realizarán el proyecto",
  "Registro de prestadoras de servicios especializados u obras especializadas (REPSE)",
  "Especificaciones de calibración de equipos y certificaciones en caso de contar con equipo",
  "Código de ética firmado por representante legal",
  "Última declaración anual y estados financieros del año(cualquiera de los últimos 3 meses)"
];

function generarListaHtmlArchivos(archivosRequeridos) {
  const reqs = archivosRequeridos || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  let html = "<ol>";
  reqs.forEach(id => {
    const idx = id - 1;
    if (nombresArchivosParaCorreo[idx]) {
      html += `<li>${nombresArchivosParaCorreo[idx]}</li>`;
    }
  });
  html += "</ol>";
  return html;
}

var VendorController = {

  getVendors: function (req, res) {
    var rol_usuario = req.user.rol;
    var empresa = req.params.empresa.toLowerCase().trim();
    if (rol_usuario === "administrador" || rol_usuario === "administrador_premium") {
      empresa = req.user.empresa.toLowerCase().trim();
    }
    if (rol_usuario != "proveedor") {
      if (empresa == "todas") {
        Vendors.find({})
          .sort({ razonSocial: 1 })
          .exec((err, vendors) => {
            if (err)
              return res
                .status(500)
                .send({ message: "Error al devolver los datos" });
            if (!vendors || vendors == "")
              return res
                .status(404)
                .send({ message: "No hay Proveedores que mostrar" });
            return res.status(200).send({ vendors });
          });
      } else {
        Vendors.find({ empresa: { $all: [empresa.toLowerCase().trim()] } })
          .sort({ razonSocial: 1 })
          .exec((err, vendors) => {
            if (err)
              return res
                .status(500)
                .send({ message: "Error al devolver los datos" });
            if (!vendors || vendors == "")
              return res
                .status(404)
                .send({ message: "No hay Proveedores que mostrar" });
            return res.status(200).send({ vendors });
          });
      }
    }
  },

  getVendor: function (req, res) {
    var vendorId = req.params.id;
    var rol_usuario = req.user.rol;

    if (vendorId == null)
      return res.status(404).send({ message: "Error al buscar proveedor" });
    Vendors.findById(vendorId, (err, vendor) => {
      if (err)
        return res.status(500).send({ message: "El proveedor no existe" });
      if (!vendor)
        return res.status(404).send({ message: "El proveedor no existe" });
      return res.status(200).send({ vendor });
    });
  },

  getVendorRfc: function (req, res) {
    var vendorrfc = req.params.rfc.toLowerCase().trim();
    var rol_usuario = req.user.rol;
    var empresa_usuario = req.user.empresa ? req.user.empresa.toLowerCase().trim() : null;

    if (vendorrfc == null)
      return res.status(404).send({ message: "Error al buscar proveedor" });

    let query = { rfc: vendorrfc.toLowerCase() };
    if (rol_usuario === 'proveedor' && empresa_usuario) {
       query.empresa = empresa_usuario;
    }

    Vendors.findOne(query, (err, vendor) => {
      if (err)
        return res.status(500).send({ message: "El proveedor no existe" });
      if (!vendor)
        return res.status(404).send({ message: "El proveedor no existe" });
      return res.status(200).send({ vendor });
    });
  },

  saveVendor: async function (req, res) {
    var login = new Users();
    var params = req.body;
    var pass = "";
    var correoP = "desarrollo.conta@grupo-sacmag.com.mx";
    var rol_usuario = req.user.rol;
    var emailUser = req.user.correo;
    var userAlta = req.user.usuario;
    if (rol_usuario == "administrador" || rol_usuario == "administrador_premium" || rol_usuario == "usuario") {
      if (
        params.rfc &&
        params.registroPatronal &&
        params.razonSocial &&
        params.tipoProveedor &&
        params.regimenFiscal &&
        params.nombreContacto &&
        params.correo &&
        params.empresa
      ) {
        try {
          const resProv = await Vendors.find({
            rfc: params.rfc.toLowerCase().trim(),
            empresa: params.empresa.toLowerCase().trim()
          }).exec();
          
          if (resProv != "") {
             return res.status(500).send({
               message: "El proveedor ya está registrado para la empresa " + params.empresa,
             });
          }

          var characters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          for (var i = 0; i < 8; i++) {
            pass += characters.charAt(
              Math.floor(Math.random() * characters.length)
            );
          }
          const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash(pass, null, null, function (err, hash) {
              if (err) reject(err);
              resolve(hash);
            });
          });
          var vendor = new Vendors();
          vendor.rfc = params.rfc.toLowerCase().trim();
          vendor.registroPatronal = params.registroPatronal
            .toLowerCase()
            .trim();
          vendor.razonSocial = params.razonSocial.toLowerCase().trim();
          vendor.tipoProveedor = params.tipoProveedor.toLowerCase().trim();
          vendor.regimenFiscal = params.regimenFiscal.toLowerCase().trim();
          vendor.nombreContacto = params.nombreContacto.toLowerCase().trim();
          vendor.correo = params.correo.toLowerCase().trim();
          vendor.telefono = params.telefono;
          vendor.empresa = params.empresa.toLowerCase().trim();
          vendor.userAlta = userAlta.toLowerCase().trim();
          if (params.archivosRequeridos && Array.isArray(params.archivosRequeridos)) {
            vendor.archivosRequeridos = params.archivosRequeridos;
          }
          if (params.observaciones != null) {
            if (params.observaciones.trim() != "")
              vendor.observaciones = params.observaciones
                .toLowerCase()
                .trim();
          } else {
            vendor.observaciones = "";
          }
          vendor.borrado = false;
          vendor.fechaAlta = moment();

          // Generar nombre de usuario único
          let baseUsername = params.rfc.toLowerCase().trim();
          let finalUsername = baseUsername;
          const userExist = await Users.find({ usuario: baseUsername }).exec();
          if (userExist != "") {
             finalUsername = baseUsername + "_" + params.empresa.toLowerCase().trim();
          }

          login.usuario = finalUsername;
          login.password = hashedPassword;
          login.correo = params.correo.toLowerCase().trim();
          login.rol = "proveedor";
          login.nombre = params.razonSocial.toLowerCase().trim();
          login.apellidoP = "";
          login.apellidoM = "";
          login.rfc = params.rfc.toLowerCase().trim();
          login.alta = userAlta.toLowerCase().trim();
          login.borrado = false;
          login.empresa = params.empresa.toLowerCase().trim(); // Guardamos empresa en el JWT

          var saveInformation = await login.save();
          saveInformation.password = undefined;
          var vendorInformation = await vendor.save();
          var contentHtml = `
              <img src="cid:unique@kreata.ee">
              <h1>Proveedores Sacmag</h1>
               <h2>Bienvenid@ a la plataforma ${params.razonSocial}</h2>
                
                  <br>
                  <h4>Datos del Usuario Para Entrar Al Sistema (${params.empresa.toUpperCase()})</h4>
                  <a href="https://proveedores-grupo-sacmag.com.mx/" target="_blank" >Click aquí para entrar al Sitio Web</a>

                  <ul>
                 
                  <br>
                  <li><b>Usuario: ${finalUsername}</b></li>
                  <li><b>Contraseña ${pass}</b></li>
              <ul>
                  <br>
                  <br>
                  <h4>Archivos a enviar</h4>
                  ${generarListaHtmlArchivos(vendor.archivosRequeridos)}
                  
                  <h4>Notas</h4>
                  <ol>
                  <li>Todos los campos son requeridos</li>
                  <li>Sólo puedes subir archivos pdf y con un peso máximo de 5 MB por archivo</li>
                  <li>En caso de que algún archivo no aplique, subir un archivo PDF con nombre "No aplica" vacío</li>
                  </ol>
                  
                  <br><br><br><br><br><br>
                  <p>Recuerda subir todos tus archivos al sistema para validarte como proveedor autorizado</p>
                  <h5>Correo enviado automáticamente, no responder correo<h5>
              
              `;
          let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: "sacmag.proveedores@gmail.com",
              pass: "jvwezvognvounmdl",
            },
          });
          let info = await transporter.sendMail({
            from: '"Proveedores Sacmag " <sacmag.proveedores@gmail.com>',
            to: `${correoP} , ${params.correo
              .toLowerCase()
              .trim()} , ${emailUser}`,
            subject: "Accesos para entrar a la plataforma de Proveedores (" + params.empresa.toUpperCase() + ")",
            html: contentHtml,
            attachments: [
              {
                filename: "image.png",
                path: __dirname + "/logo.png",
                cid: "unique@kreata.ee",
              },
            ],
          });
          console.log("Mensaje enviado", info.envelope);
          return res.status(200).send({
            vendor: vendorInformation,
            user: saveInformation,
          });

        } catch (error) {
          console.log("Ocurrió un error al registrar Proveedor " + error);
          return res.status(500).send({
            message:
              "Este proveedor ya existe en otra empresa, pero se acaba de registrar para la empresa actual.",
          });
        }
      } else {
        return res
          .status(500)
          .send({ message: "Completa los campos faltantes" });
      }
    } else {
      return res
        .status(500)
        .send({ message: "No cuentas con los permisos suficientes" });
    }
  },

  updateVendors: async function (req, res) {
    try {
      var projectId = req.params.id;
      var send = req.params.send;
      var update = req.body;
      var rol_usuario = req.user.rol;
      var emailUser = req.user.correo;
      var correoP = "desarrollo.conta.davila@grupo-sacmag.com.mx";
      if (
        rol_usuario == "administrador" ||
        rol_usuario == "administrador_premium" ||
        rol_usuario == "proveedor"
      ) {
        if (
          update.archivosRequeridos ||
          (update.rfc &&
            update.correo &&
            update.registroPatronal &&
            update.razonSocial &&
            update.tipoProveedor &&
            update.regimenFiscal &&
            update.nombreContacto)
        ) {
          if (update.rfc) update.rfc = String(update.rfc).toLowerCase().trim();
          if (update.correo) update.correo = String(update.correo).toLowerCase().trim();
          if (update.registroPatronal) update.registroPatronal = String(update.registroPatronal).toLowerCase().trim();
          if (update.razonSocial) update.razonSocial = String(update.razonSocial).toLowerCase().trim();
          if (update.tipoProveedor) update.tipoProveedor = String(update.tipoProveedor).toLowerCase().trim();
          if (update.regimenFiscal) update.regimenFiscal = String(update.regimenFiscal).toLowerCase().trim();
          if (update.nombreContacto) update.nombreContacto = String(update.nombreContacto).toLowerCase().trim();
          if (update.observaciones) {
            update.observaciones = String(update.observaciones).toLowerCase().trim();
          }
          try {
            const oldVendor = await Vendors.findById(projectId);
            const oldRfc = oldVendor ? oldVendor.rfc : null;

            const projectUpdated = await Vendors.findByIdAndUpdate(
              projectId,
              update,
              { new: true }
            );

            if (oldRfc && update.rfc && oldRfc.toLowerCase() !== update.rfc.toLowerCase()) {
              await Users.updateMany(
                { rfc: oldRfc.toLowerCase() },
                { $set: { rfc: update.rfc.toLowerCase(), usuario: update.rfc.toLowerCase(), razonSocial: update.razonSocial, correo: update.correo } }
              );
              await Archives.updateMany(
                { rfc: oldRfc.toLowerCase() },
                { $set: { rfc: update.rfc.toLowerCase() } }
              );
            } else {
              await Users.updateOne(
                { rfc: update.rfc },
                { $set: { razonSocial: update.razonSocial, correo: update.correo } }
              );
            }
          if (send === 'true' || send === true) {
            var pass = "";
            var characters =
              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            for (var i = 0; i < 8; i++) {
              pass += characters.charAt(
                Math.floor(Math.random() * characters.length)
              );
            }
            const hashedPassword = await new Promise((resolve, reject) => {
              bcrypt.hash(pass, null, null, function (err, hash) {
                if (err) reject(err);
                resolve(hash);
              });
            });
            const UpdateUserVendor = await Users.updateOne(
              { rfc: update.rfc },
              { $set: { password: hashedPassword } }
            );
            var contentHtml = `
                        <img src="cid:unique@kreata.ee">
                        <h1>Proveedores Sacmag</h1>
                        <br><br>
                        <h2>Proveedor Actualizado.</h2>
                        <h4>Datos del Usuario Para Entrar Al Sistema</h4>
                        <a href="https://proveedores-grupo-sacmag.com.mx/" target="_blank" >Click aquí para entrar al Sitio Web</a>
                        <h5>Nuevo Proveedor de ${update.empresa}</h5>
                        <ul>

                            <li><b>Usuario: ${update.rfc}</b></li>
                            <li><b>Contraseña ${pass}</b></li>
                        </ul>
                        <br>
                        <br>
                        <h4>Archivos a enviar</h4>
                        ${generarListaHtmlArchivos(update.archivosRequeridos)}
                    
                        <h4>Notas</h4>
                        <ol>
                        <li>Todos los campos son requeridos</li>
                        <li>Sólo puedes subir archivos pdf y con un peso máximo de 2 MB por archivo</li>
                        <li>En caso de que algún archivo no aplique, subir un archivo PDF con nombre "No aplica" vacío</li>
                        </ol>
                    
                        <br><br><br><br><br><br>
                        <p>Recuerda subir todos tus archivos al sistema para validarte como proveedor autorizado</p>
                        <p>Correo enviado automáticamente, no responder correo<p>
                            `;

            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              auth: {
                user: "sacmag.proveedores@gmail.com",
                pass: "jvwezvognvounmdl",
              },
            });
            let info = await transporter.sendMail({
              from: '"Proveedores Sacmag " <sacmag.proveedores@gmail.com>',
              to: `${correoP} , ${update.correo} , ${emailUser}`,
              subject: "Accesos para entrar a la plataforma de Proveedores",
              html: contentHtml,
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee",
                },
              ],
            });
            console.log("Mensaje enviado", info.envelope);
          }

          return res.status(200).send({ project: projectUpdated });
          } catch (error) {
            res.status(500).send({ message: "Ocurrió un error BD: " + error });
          }
        } else {
          res.status(500).send({ message: "Llena los campos requeridos" });
        }
      } else {
        res.status(500).send({ message: "No tienes permisos suficientes" });
      }
    } catch (globalError) {
      console.error("Error Global en updateVendors:", globalError);
      res.status(500).send({ message: "Error interno: " + globalError.message });
    }
  },

  getVendorsWithArchives: async function (req, res) {
    try {
      const empresa = req.user.empresa;

      if (!empresa) {
        return res
          .status(400)
          .send({ message: "No se encontró la empresa en el token" });
      }

      const query = { borrado: false };
      if (empresa !== "todas") {
        query.empresa = empresa;
      }

      const vendors = await Vendors.find(query).lean();

      const rfcs = vendors.map((v) => v.rfc.toLowerCase().trim());
      const archives = await Archives.find({
        rfc: { $in: rfcs },
        borrado: false,
      }).lean();

      const archivesMap = {};
      archives.forEach((a) => {
        archivesMap[(a.rfc || "").toLowerCase().trim()] = a;
      });

      const result = vendors.map((vendor) => {
        const rfcKey = (vendor.rfc || "").toLowerCase().trim();
        return { vendor, archive: archivesMap[rfcKey] || null };
      });

      return res.status(200).send({ vendorsWithArchives: result });
    } catch (error) {
      console.error("Error en getVendorsWithArchives:", error);
      return res.status(500).send({ message: "Error interno del servidor." });
    }
  },

  saveFeedback: function (req, res) {
    var params = req.body;
    var correoP = "desarrollo.conta@grupo-sacmag.com.mx";

    if (!params.reportType || !params.subject || !params.description) {
      return res.status(400).send({
        message: "Por favor completa los campos requeridos: reportType, subject, description"
      });
    }

    let images = req.files && req.files.images ? req.files.images : [];
    if (!Array.isArray(images)) {
      images = [images];
    }

    if (images.length > 3) {
      return res.status(400).send({
        message: "Puedes mandar de una a tres imágenes máximo"
      });
    }

    const feedbackDir = "./uploads/feedback";
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const feedbackFolderPath = path.join(feedbackDir, `feedback_${timestamp}`);

    if (!fs.existsSync(feedbackFolderPath)) {
      fs.mkdirSync(feedbackFolderPath, { recursive: true });
    }

    let savedImages = [];
    if (images.length > 0) {
      images.forEach((image, index) => {
        try {
          const ext = path.extname(image.name);
          const imageName = `image_${index + 1}${ext}`;
          const imagePath = path.join(feedbackFolderPath, imageName);
          image.mv(imagePath);
          savedImages.push(imageName);
          console.log("✅ Imagen guardada:", imageName);
        } catch (err) {
          console.error("Error guardando imagen:", err);
        }
      });
    }

    var feedbackData = {
      reportType: params.reportType,
      subject: params.subject,
      description: params.description,
      module: params.module || "sin especificar",
      userName: params.userName || "Ambos de la cuenta",
      email: params.email || "no proporcionado",
      timestamp: params.timestamp || new Date(),
      userAgent: params.userAgent || "desconocido",
      ipAddress: req.ip || req.connection.remoteAddress,
      imagenes: savedImages.length > 0 ? savedImages : "sin imágenes"
    };

    console.log("📝 Nuevo reporte de feedback recibido:", feedbackData);

    const fileName = `feedback_${timestamp}.json`;
    const filePath = path.join(feedbackFolderPath, fileName);

    fs.writeFileSync(filePath, JSON.stringify(feedbackData, null, 2));

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "sacmag.proveedores@gmail.com",
        pass: "jvwezvognvounmdl"
      }
    });

    let attachments = [];
    if (savedImages.length > 0) {
      savedImages.forEach((imageName) => {
        attachments.push({
          filename: imageName,
          path: path.join(feedbackFolderPath, imageName)
        });
      });
    }

    const folioSeguimiento = `SACMAG-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    let reportHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; color: #333333; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <!-- Header Dark Blue -->
          <div style="background-color: #1a237e; color: #ffffff; padding: 40px 30px;">
              <p style="font-size: 12px; margin: 0 0 10px 0; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase;">
                  SISTEMA DE TICKET<span style="background-color: #ffeb3b; color: #1a237e; padding: 0 2px;">S -</span> GRUPO SACMAG
              </p>
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; font-family: 'Times New Roman', Times, serif;">
                  Nuevo <span style="background-color: #ffeb3b; color: #1a237e; padding: 0 5px; font-weight: bold;">Ticket</span> Recibido
              </h1>
          </div>
          
          <!-- Subheader Folio -->
          <div style="background-color: #e8eaf6; padding: 20px 30px;">
              <p style="font-size: 12px; margin: 0 0 5px 0; color: #7986cb; letter-spacing: 1px; font-weight: bold;">FOLIO DE SEGUIMIENTO</p>
              <h2 style="margin: 0; font-size: 24px; color: #1a237e; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">
                  ${folioSeguimiento}
              </h2>
          </div>

          <!-- Details Grid -->
          <div style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                      <td width="50%" valign="top" style="padding-bottom: 20px;">
                          <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">REPORTADO POR</p>
                          <p style="margin: 0; font-size: 15px; color: #333333;">${params.userName || "No proporcionado"}</p>
                          <a href="mailto:${params.email}" style="color: #1976d2; font-size: 13px; text-decoration: none;">${params.email || "No proporcionado"}</a>
                      </td>
                      <td width="50%" valign="top" style="padding-bottom: 20px;">
                          <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">MÓDULO / APLICACIÓN</p>
                          <p style="margin: 0; font-size: 15px; color: #333333;">${params.module || "No especificado"}</p>
                      </td>
                  </tr>
                  <tr>
                      <td width="50%" valign="top">
                          <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">TIPO DE REPORTE</p>
                          <p style="margin: 0; font-size: 15px; color: #ff6b00; font-weight: bold;">${params.reportType}</p>
                      </td>
                      <td width="50%" valign="top">
                          <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">FECHA</p>
                          <p style="margin: 0; font-size: 15px; color: #333333;">${new Date().toLocaleString()}</p>
                      </td>
                  </tr>
              </table>

              <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 30px;" />

              <p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">PROBLEMA REPORTADO</p>
              <div style="background-color: #fafafa; border-left: 4px solid #1a237e; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #333333;">${params.subject}</p>
                  <p style="margin: 0; font-size: 14px; color: #555555; white-space: pre-wrap;">${params.description}</p>
              </div>
              
              <p style="font-size: 13px; color: #777777;">
                  <span style="font-size: 16px; margin-right: 5px;">📎</span> ${savedImages.length > 0 ? "Las capturas de pantalla se adjuntan a este correo." : "Sin imágenes adjuntas."}
              </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                  Mensaje automático — Sistema de <span style="background-color: #ffeb3b; color: #000; padding: 0 2px;">Ticket</span>s - Grupo SACMAG
              </p>
          </div>
      </div>
    `;

    let reportOptions = {
      from: '"TICKET Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
      to: correoP,
      subject: "Nuevo Reporte de Feedback - " + params.subject,
      html: reportHtml,
      attachments: attachments
    };

    transporter.sendMail(reportOptions, function(error, info) {
      if (error) {
        console.log("Error enviando reporte al equipo:", error);
      } else {
        console.log("Reporte de feedback enviado a:", correoP);
      }
    });

    if (params.email && params.email.trim()) {
      try {
        var mailOptions = {
          from: '" Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
          to: params.email,
          subject: "Reporte recibido - " + params.subject,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; color: #333333; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <!-- Header Dark Blue -->
                <div style="background-color: #1a237e; color: #ffffff; padding: 40px 30px;">
                    <p style="font-size: 12px; margin: 0 0 10px 0; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase;">
                        SISTEMA DE TICKET<span style="background-color: #ffeb3b; color: #1a237e; padding: 0 2px;">S -</span> GRUPO SACMAG
                    </p>
                    <h1 style="margin: 0; font-size: 28px; font-weight: normal; font-family: 'Times New Roman', Times, serif;">
                        Ticket Recibido <span style="background-color: #ffeb3b; color: #1a237e; padding: 0 5px; font-weight: bold;">Exitosamente</span>
                    </h1>
                </div>
                
                <!-- Subheader Folio -->
                <div style="background-color: #e8eaf6; padding: 20px 30px;">
                    <p style="font-size: 12px; margin: 0 0 5px 0; color: #7986cb; letter-spacing: 1px; font-weight: bold;">TU FOLIO DE SEGUIMIENTO</p>
                    <h2 style="margin: 0; font-size: 24px; color: #1a237e; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">
                        \${folioSeguimiento}
                    </h2>
                </div>

                <!-- Details Grid -->
                <div style="padding: 30px;">
                    <h3 style="color: #333; margin-top: 0;">Hola, \${params.userName || "Usuario"}</h3>
                    <p style="font-size: 15px; color: #555; line-height: 1.5; margin-bottom: 30px;">
                        Hemos recibido tu reporte de manera exitosa. Nuestro equipo de soporte lo revisará a la brevedad y se pondrá en contacto contigo de ser necesario a este correo.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #fafafa; border: 1px solid #eeeeee; padding: 15px;">
                        <tr>
                            <td width="50%" valign="top" style="padding-bottom: 15px;">
                                <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">ASUNTO</p>
                                <p style="margin: 0; font-size: 14px; color: #333333; font-weight: bold;">\${params.subject}</p>
                            </td>
                            <td width="50%" valign="top" style="padding-bottom: 15px;">
                                <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">MÓDULO</p>
                                <p style="margin: 0; font-size: 14px; color: #333333;">\${params.module || "No especificado"}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" valign="top">
                                <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">TIPO DE REPORTE</p>
                                <p style="margin: 0; font-size: 14px; color: #ff6b00; font-weight: bold;">\${params.reportType}</p>
                            </td>
                        </tr>
                    </table>
                    
                    <p style="font-size: 13px; color: #777777;">Si deseas agregar más información, por favor responde a este correo manteniendo el folio en el asunto.</p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                        Mensaje automático — Sistema de <span style="background-color: #ffeb3b; color: #000; padding: 0 2px;">Ticket</span>s - Grupo SACMAG
                    </p>
                </div>
            </div>
          `
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log("Error enviando email de confirmación:", error);
          } else {
            console.log("Email de confirmación enviado a:", params.email);
          }
        });
      } catch (mailErr) {
        console.error("Error configurando email de confirmación:", mailErr);
      }
    }

    return res.status(200).send({
      message: "Reporte de feedback registrado correctamente. Puedes mandar de una a tres imágenes.",
      feedbackId: timestamp,
      feedback: feedbackData,
      imagesSaved: savedImages
    });
  },

};

module.exports = VendorController;
