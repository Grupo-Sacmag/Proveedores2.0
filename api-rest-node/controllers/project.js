"use strict";
var bcrypt = require("bcrypt-nodejs");

var nodemailer = require("nodemailer");
var oldArchives = require("../models/oldArchives");
var Archives = require("../models/archives");
var Vendors = require("../models/vendors");
var Users = require("../models/user");
var jwt = require("../services/jwt");
const fs = require("fs"); // Para usar existsSync, renameSync, etc.
const fsa = require("fs").promises; // Para usar async/await: copyFile, mkdir, etc.
var archiver = require("archiver");
var moment = require("moment");
var cheque = require("../models/cheque");
var fechArchivo = require("../models/fechArchivo");

const crypto = require("crypto"); // Para usar randomBytes
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

var controller = {
  //método para loguear usuario
  login: function (req, res) {
    var params = req.body;
    var login = new Users();
    login.usuario = params.usuario;
    login.password = params.password;
    Users.findOne(
      { usuario: login.usuario.toLowerCase(), borrado: false },
      (err, user) => {
        if (err)
          return res.status(500).send({ message: "Error en la petición" });
        if (user) {
          bcrypt.compare(login.password, user.password, (err, check) => {
            if (check) {
              if (params.gettoken) {
                // generar el token
                const token = jwt.createToken(user);

                // mostrarlo en consola
                console.log("✅ Token generado:", token);

                // devolverlo al cliente
                return res.status(200).send({
                  token: token,
                });
              } else {
                //devolver datos del usuario
                user.password = undefined;
                return res.status(200).send({ user });
              }
            } else {
              return res
                .status(404)
                .send({ message: "El usuario no se ha podido identificar" });
            }
          });
        } else {
          return res
            .status(404)
            .send({ message: "¡El usuario no se ha podido identificar!" });
        }
      }
    );
  },
  //Obtener datos del Usuario
  getUSer: function (req, res) {
    var user = new Users();
    var projectId = req.params.id;
    if (projectId == null)
      return res.status(404).send({ message: "El usuario no existe" });
    Users.findById(projectId, (err, user) => {
      if (err)
        return res.status(500).send({ message: "Error al buscar el usuario" });
      if (!user)
        return res.status(404).send({ message: "El usuario no existe" });
      user.password = undefined;
      return res.status(200).send({
        user,
      });
    });
  },
  //guardar usuarios para login
  saveUsersLogin: async function (req, res) {
    var login = new Users();
    var params = req.body;
    var correoP = "desarrollo.conta@grupo-sacmag.com.mx";
    var pass = "";
    var respuesta = "";
    var rol_usuario = req.user.rol;
    if (rol_usuario == "administrador") {
      if (
        params.usuario &&
        params.correo &&
        params.rol &&
        params.nombre &&
        params.apellidoM &&
        params.apellidoP &&
        params.rfc &&
        params.empresa
      ) {
        try {
          const userFind = await Users.find({
            $or: [
              { usuario: params.usuario.toLowerCase() },
              { rfc: params.rfc.toLowerCase() },
            ],
          }).exec();
          if (userFind != "") {
            return res.status(500).send({ message: "Ya existe el usuario" });
          } else {
            if (params.rol != "administrador") {
              pass = "";
              var characters =
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              for (var i = 0; i < 8; i++) {
                pass += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
            } else {
              pass = params.password.trim();
            }
            const hashedPassword = await new Promise((resolve, reject) => {
              bcrypt.hash(pass, null, null, function (err, hash) {
                if (err) reject(err);
                resolve(hash);
              });
            });
            login.usuario = params.usuario.toLowerCase().trim();
            login.password = hashedPassword;
            login.correo = params.correo.toLowerCase().trim();
            login.rol = params.rol.toLowerCase().trim();
            login.nombre = params.nombre.toLowerCase().trim();
            login.apellidoP = params.apellidoP.toLowerCase().trim();
            login.apellidoM = params.apellidoM.toLowerCase().trim();
            login.rfc = params.rfc.toLowerCase().trim();
            login.empresa = params.empresa.toLowerCase().trim();
            login.borrado = false;
            var saveInformation = await login.save();
            saveInformation.password = undefined;
            var contentHtml = `
                            <img src="cid:unique@kreata.ee">
                            <h1>Proveedores Sacmag</h1>
                            <h4>Datos del Usuario Para Entrar Al Sistema</h4>
                            <a href="https://proveedores-grupo-sacmag.com.mx/" target="_blank" >Click aquí para entrar al Sitio Web</a>
                            <ul>
                                <li>Bienvenid@ a la plafaroma ${params.nombre
                                  .toLowerCase()
                                  .trim()}</li>
                                <li>Usuario: ${params.usuario
                                  .toLowerCase()
                                  .trim()}</li>
                                <li>Contraseña ${pass}</li>
                                <br>
                                <br>
                                <p>No responder correo<p>
                            </ul>
                            `;
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true, // true for 465, false for other ports
              auth: {
                user: "sacmag.proveedores@gmail.com", // generated ethereal user
                pass: "jvwezvognvounmdl", // generated ethereal password
              },
            });
            // send mail with defined transport object
            let info = await transporter.sendMail({
              from: '"Proveedores Sacmag " <sacmag.proveedores@gmail.com>', // sender address
              to: `${correoP} , ${params.correo.toLowerCase().trim()}`, // list of receivers
              subject: "Accesos para entrar a la plataforma de Proveedores", // Subject line
              html: contentHtml, // html body
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee", //same cid value as in the html img src
                },
              ],
            });
            console.log("Mensaje enviado", info.envelope);
            return res.status(200).send({
              user: saveInformation,
            });
          }
        } catch (error) {
          console.log("Ocurrió un error");
          return res.status(500).send({ message: "Ocurrió un error " + error });
        }
      } else {
        return res
          .status(500)
          .send({ message: "Completa los campos faltantes del formulario" });
      }
    } else {
      return res
        .status(500)
        .send({ message: "No cuentas con los permisos suficientes" });
    }
  },
  saveArchives: async function (req, res) {
    try {
      const rfc = req.params.rfc?.toLowerCase().trim();
      const empresa = req.params.empresa?.toLowerCase().trim();
      const rol_usuario = req.user?.rol;

      if (rol_usuario !== "administrador" && rol_usuario !== "proveedor") {
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
          .status(409) // Código 409: conflicto porque ya existe registro
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

      // Guardar archivos y registro en la base de datos
      try {
        await nuevoRegistro.save();
      } catch (error) {
        return res
          .status(500)
          .send({ message: "Error al guardar archivos.", error });
      }

      // Configurar nodemailer y enviar correo (capturamos error sin afectar respuesta)
      try {
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true, // true para 465
          auth: {
            user: "sacmag.proveedores@gmail.com",
            pass: "jvwezvognvounmdl",
          },
          tls: {
            rejectUnauthorized: false, // Evita error certificado autofirmado
          },
        });

        // Busca el proveedor por RFC
        const vendor = await Vendors.findOne({ rfc });
        const vendorId = vendor ? vendor._id : "";

        let destinatarios = ["desarrollo.conta@grupo-sacmag.com.mx"];
        //Aqui es posible Agregar mas empresas y envio de correo a empresas con este mismo objetivo
        if (
          vendor &&
          String(vendor.empresa).toLowerCase().trim() === "sacmag"
        ) {
          destinatarios.push("rosaaaaddsfd.sanchez@grupo-sacmag.com.mx");
        }

        // console.log("Empresa del vendor:", vendor?.empresa);
        // console.log("Destinatarios finales:", destinatarios);

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
        // No detenemos el flujo, solo logueamos el error
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
    const path_file = path.join(__dirname, "../uploads", file); // ✅ Ruta correcta
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
              "../uploads", // Ajusta si tu carpeta uploads está en otro lado
              hashedFileName
            );

            if (fs.existsSync(absolutePath)) {
              const nombreArchivo = getNombreArchivo(i);
              const fileName = `${i}.${nombreArchivo}.pdf`;

              archive.file(absolutePath, {
                name: `${rfcFolder}/${fileName}`,
              });
            } else {
              console
                .warn
                //`⚠️ Archivo no encontrado: ${absolutePath} para RFC ${rfcFolder}`
                ();
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

      // Buscar si el proveedor existe
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

            // Estructura de subcarpeta interna "Descargas" solicitada por el usuario
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
      // 1. Buscar si existe el expediente específico para la empresa solicitada
      let project = await Archives.findOne({ rfc: projectrfc, empresa: empresaSolicitada }).exec();

      if (!project) {
        // 2. Si no existe, buscamos el expediente legacy (sin empresa o con empresa "todas")
        const queryLegacy = {
          rfc: projectrfc,
          $or: [
            { empresa: { $exists: false } },
            { empresa: 'todas' }
          ]
        };
        const legacyProject = await Archives.findOne(queryLegacy).exec();

        if (legacyProject) {
          // 3. Obtener el proveedor de la colección de Vendors para ver sus empresas actuales
          const vendor = await Vendors.findOne({ rfc: projectrfc }).exec();
          
          if (vendor && vendor.empresa && vendor.empresa.length > 0) {
            const rawEmpresas = Array.isArray(vendor.empresa) ? vendor.empresa : [vendor.empresa];
            const realEmpresas = rawEmpresas
              .map(e => String(e || '').toLowerCase().trim())
              .filter(e => e !== '' && e !== 'todas');

            if (realEmpresas.length > 0) {
              // Migrar: crear una copia del expediente legacy/todas para cada empresa del perfil de vendor
              for (let emp of realEmpresas) {
                const checkExist = await Archives.findOne({ rfc: projectrfc, empresa: emp }).exec();
                if (!checkExist) {
                  const clonedArchive = new Archives({
                    rfc: projectrfc,
                    empresa: emp,
                    archivo1: legacyProject.archivo1,
                    archivo2: legacyProject.archivo2,
                    archivo3: legacyProject.archivo3,
                    archivo4: legacyProject.archivo4,
                    archivo5: legacyProject.archivo5,
                    archivo6: legacyProject.archivo6,
                    archivo7: legacyProject.archivo7,
                    archivo8: legacyProject.archivo8,
                    archivo9: legacyProject.archivo9,
                    archivo10: legacyProject.archivo10,
                    archivo11: legacyProject.archivo11,
                    archivo12: legacyProject.archivo12,
                    archivo13: legacyProject.archivo13,
                    archivo14: legacyProject.archivo14,
                    archivo15: legacyProject.archivo15,
                    validacion1: legacyProject.validacion1,
                    validacion2: legacyProject.validacion2,
                    validacion3: legacyProject.validacion3,
                    validacion4: legacyProject.validacion4,
                    validacion5: legacyProject.validacion5,
                    validacion6: legacyProject.validacion6,
                    validacion7: legacyProject.validacion7,
                    validacion8: legacyProject.validacion8,
                    validacion9: legacyProject.validacion9,
                    validacion10: legacyProject.validacion10,
                    validacion11: legacyProject.validacion11,
                    validacion12: legacyProject.validacion12,
                    validacion13: legacyProject.validacion13,
                    validacion14: legacyProject.validacion14,
                    validacion15: legacyProject.validacion15,
                    validar: legacyProject.validar,
                    borrado: legacyProject.borrado
                  });
                  await clonedArchive.save();
                }
              }
              // Si el expediente original era legacy o "todas", y el perfil del vendor ya no tiene "todas",
              // eliminamos el registro original para evitar duplicados.
              if (!rawEmpresas.map(e => String(e).toLowerCase().trim()).includes('todas')) {
                await Archives.deleteOne({ _id: legacyProject._id });
              }
              
              // Volver a buscar el expediente de la empresa solicitada
              project = await Archives.findOne({ rfc: projectrfc, empresa: empresaSolicitada }).exec();
            } else {
              // Si el perfil solo tiene 'todas', nos aseguramos de que el expediente legacy tenga empresa: 'todas'
              if (!legacyProject.empresa) {
                legacyProject.empresa = 'todas';
                project = await legacyProject.save();
              } else {
                project = legacyProject;
              }
            }
          } else {
            // Fallback general si no hay vendor
            legacyProject.empresa = empresaSolicitada;
            project = await legacyProject.save();
          }
        }
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

    if (rol_usuario !== "administrador" && rol_usuario !== "usuario") {
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

      // CORREGIDO: Usamos deleteMany (no remove)
      const archivesRemoved = await Archives.deleteMany({
        rfc: projectRfc.toLowerCase().trim(),
        empresa: empresa.toLowerCase().trim()
      });

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
          /* tls: {
          rejectUnauthorized: false, // CLAVE para evitar error del certificado
        },*/
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
        // No cortamos el flujo si el correo falla
      }

      return res.status(200).send({ archives: archivesRemoved });
    } catch (error) {
      console.error("Error en rechazo:", error);
      return res.status(500).send({ message: "Ocurrió un error", error });
    }
  },

  getVendors: function (req, res) {
    var rol_usuario = req.user.rol;
    var empresa = req.params.empresa.toLowerCase().trim();
    if (rol_usuario === "administrador") {
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
    if (vendorrfc == null)
      return res.status(404).send({ message: "Error al buscar proveedor" });
    Vendors.findOne({ rfc: vendorrfc.toLowerCase() }, (err, vendor) => {
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
    if (rol_usuario == "administrador" || rol_usuario == "usuario") {
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
          }).exec();
          if (resProv == "") {
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
            //vendor.verificado = false;
            vendor.fechaAlta = moment();
            login.usuario = params.rfc.toLowerCase().trim();
            login.password = hashedPassword;
            login.correo = params.correo.toLowerCase().trim();
            login.rol = "proveedor";
            login.nombre = params.razonSocial.toLowerCase().trim();
            login.apellidoP = "";
            login.apellidoM = "";
            login.rfc = params.rfc.toLowerCase().trim();
            login.alta = userAlta.toLowerCase().trim();
            login.borrado = false;
            var saveInformation = await login.save();
            saveInformation.password = undefined;
            var vendorInformation = await vendor.save();
            var contentHtml = `
                <img src="cid:unique@kreata.ee">
                <h1>Proveedores Sacmag</h1>
                 <h2>Bienvenid@ a la plafaroma ${params.razonSocial}</h2>
                  
                    <br>
                    <h4>Datos del Usuario Para Entrar Al Sistema</h4>
                    <a href="https://proveedores-grupo-sacmag.com.mx/" target="_blank" >Click aquí para entrar al Sitio Web</a>

                    <ul>
                   
                    <br>
                    <li><b>Usuario: ${params.rfc.toLowerCase().trim()}</b></li>
                    <li><b>Contraseña ${pass}</b></li>
                </ul>
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
              secure: true, // true for 465, false for other ports
              auth: {
                user: "sacmag.proveedores@gmail.com", // generated ethereal user
                pass: "jvwezvognvounmdl", // generated ethereal password
              } /*tls: {
                      rejectUnauthorized: false,
                    },*/,
            });
            // send mail with defined transport object
            let info = await transporter.sendMail({
              from: '"Proveedores sacmag " <sacmag.proveedores@gmail.com>', // sender address
              to: `${correoP} , ${params.correo
                .toLowerCase()
                .trim()} , ${emailUser}`, // list of receivers
              subject: "Accesos para entrar a la plataforma de Proveedores", // Subject line
              html: contentHtml, // html body
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee", //same cid value as in the html img src
                },
              ],
            });
            console.log("Mensaje enviado", info.envelope);
            return res.status(200).send({
              vendor: vendorInformation,
              user: saveInformation,
            });
          } else {
            const resProv = await Vendors.updateOne(
              { rfc: params.rfc.toLowerCase().trim() },
              { $addToSet: { empresa: params.empresa } }
            ).exec();
            if (req.user.empresa == "sacmag") {
              const SEARCHARCHIVE = await Archives.findOne({
                rfc: params.rfc.toLowerCase().trim(),
              });
              if (SEARCHARCHIVE == null) {
                return res
                  .status(200)
                  .send({ message: "Se ingresó correctamente el Proveedor" });
              } else {
                var addArchives = [];
                if (SEARCHARCHIVE.archivo1)
                  addArchives.push(SEARCHARCHIVE.archivo1);
                if (SEARCHARCHIVE.archivo2)
                  addArchives.push(SEARCHARCHIVE.archivo2);
                if (SEARCHARCHIVE.archivo3)
                  addArchives.push(SEARCHARCHIVE.archivo3);
                if (SEARCHARCHIVE.archivo4)
                  addArchives.push(SEARCHARCHIVE.archivo4);
                if (SEARCHARCHIVE.archivo5)
                  addArchives.push(SEARCHARCHIVE.archivo5);
                if (SEARCHARCHIVE.archivo6)
                  addArchives.push(SEARCHARCHIVE.archivo6);
                if (SEARCHARCHIVE.archivo7)
                  addArchives.push(SEARCHARCHIVE.archivo7);
                if (SEARCHARCHIVE.archivo8)
                  addArchives.push(SEARCHARCHIVE.archivo8);
                if (SEARCHARCHIVE.archivo9)
                  addArchives.push(SEARCHARCHIVE.archivo9);
                if (SEARCHARCHIVE.archivo10)
                  addArchives.push(SEARCHARCHIVE.archivo10);
                if (SEARCHARCHIVE.archivo11)
                  addArchives.push(SEARCHARCHIVE.archivo11);
                if (SEARCHARCHIVE.archivo12)
                  addArchives.push(SEARCHARCHIVE.archivo12);
                if (SEARCHARCHIVE.archivo13)
                  addArchives.push(SEARCHARCHIVE.archivo13);
                if (SEARCHARCHIVE.archivo14)
                  addArchives.push(SEARCHARCHIVE.archivo14);
                if (SEARCHARCHIVE.archivo15)
                  addArchives.push(SEARCHARCHIVE.archivo15);
                for (var i = 0; i < addArchives.length; i++) {
                  await fsa.copyFile(
                    `./../../proveedores Web Subida/api-rest-node/uploads/${addArchives[i]}`,
                    `./uploads/${addArchives[i]}`,
                    (err) => {
                      if (err) {
                        console.log("Error Found:", err);
                      } else {
                        console.log("\nFile Contents of copied_file:");
                      }
                    }
                  );
                }
                return res.status(200).send({ vendor: resProv });
              }
            } else {
              return res.status(200).send({ vendor: resProv });
            }
          }
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
    var projectId = req.params.id;
    var send = req.params.send;
    var update = req.body;
    var rol_usuario = req.user.rol;
    var emailUser = req.user.correo;
    var correoP = "desarrollo.conta.davila@grupo-sacmag.com.mx";
    if (
      rol_usuario == "administrador" ||
      rol_usuario == "proveedor"
    ) {
      if (
        update.rfc &&
        update.correo &&
        update.registroPatronal &&
        update.razonSocial &&
        update.tipoProveedor &&
        update.regimenFiscal &&
        update.nombreContacto &&
        update.telefono
      ) {
        update.rfc = update.rfc.toLowerCase().trim();
        update.correo = update.correo.toLowerCase().trim();
        update.registroPatronal = update.registroPatronal.toLowerCase().trim();
        update.razonSocial = update.razonSocial.toLowerCase().trim();
        update.tipoProveedor = update.tipoProveedor.toLowerCase().trim();
        update.regimenFiscal = update.regimenFiscal.toLowerCase().trim();
        update.nombreContacto = update.nombreContacto.toLowerCase().trim();
        if (update.observaciones) {
          update.observaciones = update.observaciones.toLowerCase().trim();
        }
        try {
          const projectUpdated = await Vendors.findByIdAndUpdate(
            projectId,
            update,
            { new: true }
          );
          const userUpdated = await Users.updateOne(
            { rfc: update.rfc },
            { $set: { razonSocial: update.razonSocial, correo: update.correo } }
          );
          if (Boolean(send) == true) {
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
              secure: true, // true for 465, false for other ports
              auth: {
                user: "sacmag.proveedores@gmail.com", // generated ethereal user
                pass: "jvwezvognvounmdl", // generated ethereal password
              },
            });
            // send mail with defined transport object
            let info = await transporter.sendMail({
              from: '"Proveedores Sacmag " <sacmag.proveedores@gmail.com>', // sender address
              to: `${correoP} , ${update.correo} , ${emailUser}`, // list of receivers
              subject: "Accesos para entrar a la plataforma de Proveedores", // Subject line
              html: contentHtml, // html body
              attachments: [
                {
                  filename: "image.png",
                  path: __dirname + "/logo.png",
                  cid: "unique@kreata.ee", //same cid value as in the html img src
                },
              ],
            });
            console.log("Mensaje enviado", info.envelope);
          }

          return res.status(200).send({ project: projectUpdated });
        } catch (error) {
          res.status(500).send({ message: "Ocurrió un error: " + error });
        }
      } else {
        res.status(500).send({ message: "Llena los campos requeridos" });
      }
    } else {
      res.status(500).send({ message: "No tienes permisos suficientes" });
    }
  },

  validateVendor: function (req, res) {
    var projectRfc = req.params.rfc;
    var empresa = req.params.empresa;
    /* var rol_usuario = req.user.rol;
        if (rol_usuario == "administrador" || rol_usuario == "usuario") { */

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
          Vendors.updateOne(
            { rfc: projectRfc.toLowerCase() },
            { verificado: true },
            async (err, vendorUpdate) => {
              if (err)
                return res
                  .status(500)
                  .send({ message: "Error al actualizar el proveedor" });
              if (!vendorUpdate)
                return res
                  .status(404)
                  .send({ message: "Error al actualizar el proveedor" });

              // Enviar correo al proveedor
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
                    /* tls: {
                      rejectUnauthorized: false,
                    },*/
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
    /* } else {
                res.status(500).send({ message: 'No tienes permisos suficientes' });
            } */
  },
  changePassword: async function (req, res) {
    var newPass = req.params.newPass;
    var params = req.body;

    if (params.rfc && params.correo && newPass) {
      try {
        params.rfc = params.rfc.trim().toLowerCase();
        params.correo = params.correo.trim().toLowerCase();
        if (params.password) params.password = params.password.trim();
        newPass = newPass.trim();
        const userFound = await Users.findOne({
          rfc: params.rfc,
          correo: params.correo,
        });

        if (userFound == null) {
          return res.status(500).send({
            message:
              "Ocurrió un error: La información proporcionada es incorrecta",
          });
        }
        if (params.password) {
          const passwordCompare = await new Promise((resolve, reject) => {
            bcrypt.compare(
              params.password,
              userFound.password,
              function (err, check) {
                if (err) reject(err);
                resolve(check);
              }
            );
          });
          if (passwordCompare) {
            const hashedPassword = await new Promise((resolve, reject) => {
              bcrypt.hash(newPass, null, null, function (err, hash) {
                if (err) reject(err);
                resolve(hash);
              });
            });
            const userUpdated = await Users.updateOne(
              { rfc: params.rfc },
              { $set: { password: hashedPassword } }
            );
            return res.status(200).send({ userUpdated });
          } else {
            return res.status(500).send({
              message: "Ocurrió un error: La información no coincide",
            });
          }
        } else {
          const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash(newPass, null, null, function (err, hash) {
              if (err) reject(err);
              resolve(hash);
            });
          });
          const userUpdated = await Users.updateOne(
            { rfc: params.rfc },
            { $set: { password: hashedPassword } }
          );
          return res.status(200).send({ userUpdated });
        }
      } catch (error) {
        return res.status(500).send({ message: "Ocurrió un error: " + error });
      }
    } else {
      return res.status(500).send({ message: "Llena los campos requeridos" });
    }
  },
  forgotPass: async function (req, res) {
    var usuario = req.params.usuario;
    try {
      const userFound = await Users.findOne({
        usuario: usuario.trim().toLowerCase(),
      });
      if (userFound == null)
        return res.status(500).send({
          message:
            "Ocurrió un error: La información proporcionada es incorrecta",
        });
      userFound.password = undefined;
      var correo = userFound.correo;
      //<a href="https://proveedores-grupo-sacmag.com.mx/api/" target="_blank" >Click aquí para recuperar contraseña</a>
      var contentHtml = `
                <img src="cid:unique@kreata.ee">
                <h1>Proveedores Sacmag - Ingeniería y Supervisión</h1>
                <a href="https://proveedores-grupo-sacmag.com.mx/recuperar-info/${userFound.rfc.toUpperCase()}/${userFound.correo.toUpperCase()}" target="_blank" >Click aquí para recuperar contraseña</a>
                <br>
                <br>
                <p>Correo enviado automáticamente, no responder correo<p>
                `;

      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: "sacmag.proveedores@gmail.com", // generated ethereal user
          pass: "jvwezvognvounmdl", // generated ethereal password
        },
      });
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Proveedores Sacmag " <sacmag.proveedores@gmail.com>', // sender address
        to: `${userFound.correo}`, // list of receivers
        subject: "Cambio de contraseña", // Subject line
        html: contentHtml, // html body
        attachments: [
          {
            filename: "image.png",
            path: __dirname + "/logo.png",
            cid: "unique@kreata.ee", //same cid value as in the html img src
          },
        ],
      });
      console.log("Mensaje enviado", info.envelope);

      return res.status(200).send({ correo });
    } catch (error) {
      return res.status(500).send({ message: "Ocurrió un error: " + error });
    }
  },

  getArchiveOld: async (req, res) => {
    try {
      // Extraer el RFC del parámetro de la ruta
      const rfc = req.params.rfc?.toLowerCase();

      // Verificar si el RFC está presente
      if (!rfc) {
        return res.status(400).send({ message: "Falta el parámetro RFC." });
      }

      // Buscar el archivo en la base de datos usando el RFC
      const archivoDb = await oldArchives.findOne({ rfc });

      // Si no se encuentran archivos para el RFC
      if (!archivoDb) {
        return res
          .status(404)
          .send({ message: "No se encontraron archivos para este RFC." });
      }

      // Crear un objeto para almacenar los archivos organizados
      const archivosOrganizados = {};

      // Iterar a través de los 15 posibles archivos
      for (let i = 1; i <= 15; i++) {
        const key = `archivo${i}`;
        const archivos = archivoDb[key];
        const archivosValidos = [];

        // Si la propiedad de archivos existe y es un array
        if (Array.isArray(archivos)) {
          // Iterar sobre los archivos para verificar su existencia
          for (const nombreArchivo of archivos) {
            const pathArchivo = path.join(
              __dirname,
              "../uploads/old",
              nombreArchivo
            );

            // Verificar si el archivo existe en el sistema de archivos
            if (fs.existsSync(pathArchivo)) {
              // Almacenar la ruta del archivo
              const rutaArchivo = `/uploads/old/${nombreArchivo}`;
              archivosValidos.push({
                ruta: rutaArchivo,
              });
            }
          }
        }

        // Solo agregar a la respuesta aquellos archivos que sean válidos
        if (archivosValidos.length > 0) {
          archivosOrganizados[key] = archivosValidos;
        }
      }

      // Si no hay archivos válidos en la base de datos
      if (Object.keys(archivosOrganizados).length === 0) {
        return res.status(404).send({
          message: "No se encontraron archivos válidos para este RFC.",
        });
      }

      // Devolver la respuesta con los archivos organizados
      return res.status(200).send({ archivos: archivosOrganizados });
    } catch (error) {
      console.error("Error al obtener archivos:", error);
      return res.status(500).send({ message: "Error interno del servidor." });
    }
  },

  getVendorsWithArchives: async function (req, res) {
    try {
      const empresa = req.user.empresa; // ya viene en el token

      if (!empresa) {
        return res
          .status(400)
          .send({ message: "No se encontró la empresa en el token" });
      }

      // Si la empresa es 'todas', no filtramos por empresa
      const query = { borrado: false };
      if (empresa !== "todas") {
        query.empresa = empresa;
      }

      // Solo vendors según la empresa o todos si es 'todas'
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

  ArchiveOld: function (req, res) {
    const file = req.params.file; // El nombre del archivo (por ejemplo, '5.pdf')
    const path_file = path.join(__dirname, "../uploads/old/", file); // Construir la ruta completa

    console.log("Ruta del archivo:", path_file); // Asegúrate de que la ruta sea correcta

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
      return res.sendFile(path_file); // Enviar el archivo al frontend
    });
  },

  newCheque: async (req, res) => {
    try {
      const vendorId = req.params.id;

      // Verifica existencia del proveedor
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

      // Crear el nuevo cheque
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

      // Buscar vendor
      const vendor = await Vendors.findById(vendorId);
      if (!vendor) {
        return res.status(404).send({ message: "Proveedor no encontrado" });
      }

      // Buscar cheques que tengan ese vendorId como idVendor
      const cheques = await cheque.find({ idVendor: vendorId });

      return res.status(200).send({ cheques });
    } catch (error) {
      console.error("Error al obtener cheques:", error);
      return res.status(500).send({ message: "Error interno del servidor" });
    }
  },

updateArchives: async (req, res) => {
    try {
      const rfc = req.params.rfc?.toLowerCase(); // Normaliza el RFC a minúsculas
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

      // Asegura que la carpeta 'old' exista
      if (!fs.existsSync(oldDir)) {
        await fsa.mkdir(oldDir);
      }

      // Obtén (o crea) el documento de oldArchives
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
        const extension = path.extname(archivoSubido.name); // Ejemplo: .pdf
        const hashName =
          crypto
            .createHash("sha256")
            .update(archivoSubido.name + Date.now().toString()) // Nombre original + timestamp
            .digest("hex") + extension;

        const newFilePath = path.join(basePath, hashName);
        const oldFileName = archivoDb[archivoKey];

        if (oldFileName) {
          const oldFilePath = path.join(basePath, oldFileName);
          const backupPath = path.join(oldDir, oldFileName);

          if (fs.existsSync(oldFilePath)) {
            // Copiar a carpeta old
            await fsa.copyFile(oldFilePath, backupPath);

            // Registrar el nombre en el arreglo del campo correspondiente
            if (!Array.isArray(oldArchive[archivoKey])) {
              oldArchive[archivoKey] = [];
            }
            oldArchive[archivoKey].push(oldFileName);

            // Eliminar original
            await fsa.unlink(oldFilePath);
          }
        }

        // Guardar el nuevo archivo
        await archivoSubido.mv(newFilePath);

        // Actualizar el campo en archivoDb
        archivoDb[archivoKey] = hashName;

        // --- INICIO DE LA MODIFICACIÓN (LÓGICA 'null') ---
        // Resetea la validación a 'pendiente' (null) y limpia el motivo
        const validacionKey = `validacion${archivoKey.replace('archivo', '')}`;
        const motivoKey = `motivo${archivoKey.replace('archivo', '')}`;
        
        archivoDb[validacionKey] = null; // Vuelve a 'pendiente'
        archivoDb[motivoKey] = '';      // Limpia el motivo de rechazo anterior
        // --- FIN DE LA MODIFICACIÓN ---
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

  getChequeImage: async (req, res) => {
    try {
      const chequeId = req.params.id;

      // Validar que el ID sea un ObjectId válido
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

  getFechaArchivoPorNombre: async (req, res) => {
    try {
      // Decodificamos el nombre del archivo por si Angular lo envía URL-encoded
      const nombreArchivo = decodeURIComponent(req.params.nombre).trim();
      const archivo = await fechArchivo.findOne({
        nombreARC: { $regex: `^${nombreArchivo}$`, $options: "i" },
      });

      if (!archivo) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }
      console.log("nombreArchivo recibido: cabezones", nombreArchivo);

      // Formatear la fecha local YYYY-MM-DD sin afectar por zona horaria
      const fechaUM = archivo.fechaUM; // Este es el Date real de Mongo
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
  const { fileIndex, isValid } = req.body; // Ej: { "fileIndex": 7, "isValid": true }
  const rol_usuario = req.user.rol;

  // Lista de nombres de archivos según índice
  const fileNames = [
    null, // posición 0 para ignorar
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

  // 1. Verificación de Permisos
  if (rol_usuario !== "administrador" && rol_usuario !== "usuario") {
    return res
      .status(403)
      .send({ message: "No tienes permisos suficientes" });
  }

  // 2. Validación de la Petición
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
    // 3. Actualización dinámica del campo 'validacionX'
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

    // ------------------------------
    // 3.1 Envío de correo al RECHAZAR un archivo
    // ------------------------------
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

    // ------------------------------
    // 4. Lógica de validación general automática
    // ------------------------------
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

    // 5. Sincronizar la bandera principal 'validar' y Vendors.verificado
    if (hasFiles && allValid && updatedArchive.validar !== true) {
      updatedArchive.validar = true;
      await updatedArchive.save();

      await Vendors.updateOne({ rfc: rfc }, { verificado: true });

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

      // CASO B: Se desvalidó un archivo y la bandera general estaba en true
    } else if (!allValid && updatedArchive.validar === true) {
      updatedArchive.validar = false;
      await updatedArchive.save();

      await Vendors.updateOne({ rfc: rfc }, { verificado: false });
    }

    // 6. Respuesta exitosa
    return res.status(200).send({
      message: `Archivo ${fileIndex} actualizado a ${isValid}.`,
      archive: updatedArchive,
    });
  } catch (error) {
    console.error("Error en toggleFileValidation:", error);
    return res.status(500).send({ message: "Error en el servidor", error });
  }
},

saveFeedback: function (req, res) {
  var params = req.body;
  var correoP = "desarrollo.conta@grupo-sacmag.com.mx";

  // Validar datos básicos
  if (!params.reportType || !params.subject || !params.description) {
    return res.status(400).send({
      message: "Por favor completa los campos requeridos: reportType, subject, description"
    });
  }

  // Validar imágenes (1 a 3)
  let images = req.files && req.files.images ? req.files.images : [];
  if (!Array.isArray(images)) {
    images = [images];
  }

  if (images.length > 3) {
    return res.status(400).send({
      message: "Puedes mandar de una a tres imágenes máximo"
    });
  }

  // Crear carpeta para este feedback específico
  const feedbackDir = './uploads/feedback';
  if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const feedbackFolderPath = path.join(feedbackDir, `feedback_${timestamp}`);
  
  if (!fs.existsSync(feedbackFolderPath)) {
    fs.mkdirSync(feedbackFolderPath, { recursive: true });
  }

  // Procesar y guardar imágenes
  let savedImages = [];
  if (images.length > 0) {
    images.forEach((image, index) => {
      try {
        const ext = path.extname(image.name);
        const imageName = `image_${index + 1}${ext}`;
        const imagePath = path.join(feedbackFolderPath, imageName);
        image.mv(imagePath);
        savedImages.push(imageName);
        console.log('✅ Imagen guardada:', imageName);
      } catch (err) {
        console.error('Error guardando imagen:', err);
      }
    });
  }

  // Crear objeto de retroalimentación
  var feedbackData = {
    reportType: params.reportType,
    subject: params.subject,
    description: params.description,
    module: params.module || 'sin especificar',
    email: params.email || 'no proporcionado',
    timestamp: params.timestamp || new Date(),
    userAgent: params.userAgent || 'desconocido',
    ipAddress: req.ip || req.connection.remoteAddress,
    imagenes: savedImages.length > 0 ? savedImages : 'sin imágenes'
  };

  // Registrar en consola
  console.log('📝 Nuevo reporte de feedback recibido:', feedbackData);

  // Guardar en archivo JSON
  const fileName = `feedback_${timestamp}.json`;
  const filePath = path.join(feedbackFolderPath, fileName);

  fs.writeFileSync(filePath, JSON.stringify(feedbackData, null, 2));

  // Configurar transporte de email
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "sacmag.proveedores@gmail.com",
      pass: "jvwezvognvounmdl"
    }
  });

  // Preparar adjuntos con las imágenes
  let attachments = [];
  if (savedImages.length > 0) {
    savedImages.forEach((imageName) => {
      attachments.push({
        filename: imageName,
        path: path.join(feedbackFolderPath, imageName)
      });
    });
  }

  // Enviar reporte al equipo de desarrollo
  let reportHtml = `
    <h2>Nuevo Reporte de Feedback</h2>
    <p><strong>Tipo:</strong> ${params.reportType}</p>
    <p><strong>Asunto:</strong> ${params.subject}</p>
    <p><strong>Módulo:</strong> ${params.module || 'No especificado'}</p>
    <p><strong>Email del Usuario:</strong> ${params.email || 'No proporcionado'}</p>
    <p><strong>Descripción:</strong></p>
    <p>${params.description}</p>
    <p><strong>Imágenes:</strong> ${savedImages.length > 0 ? savedImages.length + ' imagen(es) adjunta(s)' : 'Sin imágenes'}</p>
    <hr/>
    <p><strong>IP:</strong> ${req.ip || req.connection.remoteAddress}</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
  `;

  let reportOptions = {
    from: '"TICKET Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
    to: correoP,
    subject: 'Nuevo Reporte de Feedback - ' + params.subject,
    html: reportHtml,
    attachments: attachments
  };

  transporter.sendMail(reportOptions, function(error, info) {
    if (error) {
      console.log('Error enviando reporte al equipo:', error);
    } else {
      console.log('Reporte de feedback enviado a:', correoP);
    }
  });

  // Enviar email de confirmación si se proporciona email
  if (params.email && params.email.trim()) {
    try {
      var mailOptions = {
        from: '" Proveedores Sacmag" <sacmag.proveedores@gmail.com>',
        to: params.email,
        subject: 'Reporte recibido - ' + params.subject,
        html: `
          <h2>Gracias por tu retroalimentación</h2>
          <p>Hemos recibido tu reporte con el siguiente contenido:</p>
          <hr/>
          <p><strong>Tipo:</strong> ${params.reportType}</p>
          <p><strong>Asunto:</strong> ${params.subject}</p>
          <p><strong>Módulo:</strong> ${params.module || 'No especificado'}</p>
          <p><strong>Descripción:</strong></p>
          <p>${params.description}</p>
          <p><strong>Imágenes adjuntas:</strong> ${savedImages.length}</p>
          <hr/>
          <br>
          <p>Nos pondremos en contacto si es necesario obtener más información.</p>
          <p>Saludos,<br/>Equipo de desarrollo de Proveedores Sacmag</p>

          <p>Mensaje enviado automáticamente, por favor no responder a este correo.</p>
        `
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log('Error enviando email de confirmación:', error);
        } else {
          console.log('Email de confirmación enviado a:', params.email);
        }
      });
    } catch (mailErr) {
      console.error('Error configurando email de confirmación:', mailErr);
    }
  }

  // Respuesta exitosa
  return res.status(200).send({
    message: 'Reporte de feedback registrado correctamente. Puedes mandar de una a tres imágenes.',
    feedbackId: timestamp,
    feedback: feedbackData,
    imagesSaved: savedImages
  });
},


};

module.exports = controller;
