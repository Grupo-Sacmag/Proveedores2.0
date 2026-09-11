"use strict";
var bcrypt = require("bcrypt-nodejs");
var nodemailer = require("nodemailer");
var Users = require("../models/user");
var jwt = require("../services/jwt");

var AuthController = {

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
                const token = jwt.createToken(user);
                console.log("✅ Token generado:", token);
                return res.status(200).send({
                  token: token,
                });
              } else {
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

  saveUsersLogin: async function (req, res) {
    var login = new Users();
    var params = req.body;
    var correoP = "desarrollo.conta@grupo-sacmag.com.mx";
    var pass = "";
    var respuesta = "";
    var rol_usuario = req.user.rol;
    if (rol_usuario == "administrador" || rol_usuario == "administrador_premium") {
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
            if (params.rol != "administrador" && params.rol != "administrador_premium") {
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
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; color: #333333; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                  <!-- Header Dark Blue -->
                  <div style="background-color: #1a237e; color: #ffffff; padding: 40px 30px; text-align: center;">
                      <p style="font-size: 12px; margin: 0 0 10px 0; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase;">
                          PORTAL DE PROVEEDORE<span style="background-color: #ffeb3b; color: #1a237e; padding: 0 2px;">S -</span> GRUPO SACMAG
                      </p>
                      <h1 style="margin: 0; font-size: 28px; font-weight: normal; font-family: 'Times New Roman', Times, serif;">
                          Nuevas <span style="background-color: #ffeb3b; color: #1a237e; padding: 0 5px; font-weight: bold;">Credenciales</span> de Acceso
                      </h1>
                  </div>
                  
                  <!-- Subheader Folio -->
                  <div style="background-color: #e8eaf6; padding: 20px 30px;">
                      <p style="font-size: 12px; margin: 0 0 5px 0; color: #7986cb; letter-spacing: 1px; font-weight: bold;">USUARIO ASIGNADO</p>
                      <h2 style="margin: 0; font-size: 24px; color: #1a237e; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">
                          ${params.usuario.toLowerCase().trim()}
                      </h2>
                  </div>

                  <!-- Details Grid -->
                  <div style="padding: 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                          <tr>
                              <td width="50%" valign="top" style="padding-bottom: 20px;">
                                  <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">NOMBRE ASIGNADO</p>
                                  <p style="margin: 0; font-size: 15px; color: #333333;">${params.nombre.toUpperCase()} ${params.apellidoP.toUpperCase()}</p>
                              </td>
                              <td width="50%" valign="top" style="padding-bottom: 20px;">
                                  <p style="font-size: 11px; margin: 0 0 5px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">EMPRESA</p>
                                  <p style="margin: 0; font-size: 15px; color: #333333;">${params.empresa.toUpperCase()}</p>
                              </td>
                          </tr>
                      </table>

                      <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 30px;" />

                      <p style="font-size: 11px; margin: 0 0 10px 0; color: #9e9e9e; font-weight: bold; letter-spacing: 1px;">CONTRASEÑA TEMPORAL</p>
                      <div style="background-color: #fafafa; border-left: 4px solid #1a237e; padding: 15px; margin-bottom: 20px;">
                          <p style="margin: 0; font-size: 20px; color: #ff6b00; font-weight: bold; font-family: monospace;">${pass}</p>
                      </div>
                      
                      <div style="text-align: center; margin-top: 30px;">
                          <a href="https://proveedores-grupo-sacmag.com.mx/" style="display: inline-block; background-color: #1a237e; color: #ffffff; text-decoration: none; padding: 12px 25px; font-weight: bold; border-radius: 4px; font-size: 14px;">Ingresar al Portal</a>
                      </div>
                  </div>

                  <!-- Footer -->
                  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                          Mensaje automático — Portal de Proveedores - Grupo SACMAG
                      </p>
                  </div>
              </div>
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
              to: `${correoP} , ${params.correo.toLowerCase().trim()}`,
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

  changePassword: async function (req, res) {
    var newPass = req.params.newPass;
    var params = req.body;

    if (params.rfc && params.correo && newPass) {
      try {
        params.rfc = params.rfc.trim().toLowerCase();
        params.correo = params.correo.trim().toLowerCase();
        if (params.password) params.password = params.password.trim();
        newPass = newPass.trim();
        const query = {
          rfc: params.rfc,
          correo: params.correo,
        };
        if (params.empresa && params.empresa.trim().toLowerCase() !== "todas") {
          query.empresa = params.empresa.trim().toLowerCase();
        }

        const userFound = await Users.findOne(query);

        if (userFound == null) {
          return res.status(404).send({
            message:
              "Ocurrió un error: Los datos ingresados (Correo, RFC/CURP o Empresa) no coinciden.",
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
              { _id: userFound._id },
              { $set: { password: hashedPassword } }
            );
            return res.status(200).send({ userUpdated });
          } else {
            return res.status(500).send({
              message: "Ocurrió un error: La contraseña actual no coincide.",
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
            { _id: userFound._id },
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
      var contentHtml = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; color: #333333; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                  <!-- Header Dark Blue -->
                  <div style="background-color: #1a237e; color: #ffffff; padding: 40px 30px; text-align: center;">
                      <p style="font-size: 12px; margin: 0 0 10px 0; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase;">
                          PORTAL DE PROVEEDORE<span style="background-color: #ffeb3b; color: #1a237e; padding: 0 2px;">S -</span> GRUPO SACMAG
                      </p>
                      <h1 style="margin: 0; font-size: 28px; font-weight: normal; font-family: 'Times New Roman', Times, serif;">
                          Recuperación de <span style="background-color: #ffeb3b; color: #1a237e; padding: 0 5px; font-weight: bold;">Contraseña</span>
                      </h1>
                  </div>
                  
                  <!-- Subheader Folio -->
                  <div style="background-color: #e8eaf6; padding: 20px 30px;">
                      <p style="font-size: 12px; margin: 0 0 5px 0; color: #7986cb; letter-spacing: 1px; font-weight: bold;">CUENTA SOLICITANTE</p>
                      <h2 style="margin: 0; font-size: 24px; color: #1a237e; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">
                          ${userFound.usuario.toLowerCase().trim()}
                      </h2>
                  </div>

                  <!-- Details Grid -->
                  <div style="padding: 30px;">
                      <p style="font-size: 15px; color: #555; line-height: 1.5; margin-bottom: 25px;">Hemos recibido una solicitud para recuperar la contraseña vinculada a este usuario. Si no fuiste tú, puedes ignorar este correo de forma segura.</p>

                      <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                          <a href="https://proveedores-grupo-sacmag.com.mx/recuperar-info/${userFound.rfc.toUpperCase()}/${userFound.correo.toUpperCase()}" style="display: inline-block; background-color: #1a237e; color: #ffffff; text-decoration: none; padding: 12px 25px; font-weight: bold; border-radius: 4px; font-size: 14px;">Reestablecer Contraseña</a>
                      </div>
                  </div>

                  <!-- Footer -->
                  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                          Mensaje automático — Portal de Proveedores - Grupo SACMAG
                      </p>
                  </div>
              </div>
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
        to: `${userFound.correo}`,
        subject: "Cambio de contraseña",
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

      return res.status(200).send({ correo });
    } catch (error) {
      return res.status(500).send({ message: "Ocurrió un error: " + error });
    }
  },

};

module.exports = AuthController;
