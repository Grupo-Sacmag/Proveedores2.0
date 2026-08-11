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
