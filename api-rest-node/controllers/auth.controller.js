"use strict";
var bcrypt = require("bcrypt-nodejs");
var Users = require("../models/user");
var jwt = require("../services/jwt");

const mailer = require("../services/mailer");
const supplierEmailTemplates = require("../services/emailTemplates/supplierEmailTemplates");

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
            const correoTemplate = supplierEmailTemplates.emailCredencialesUsuario({
              usuario: params.usuario.toLowerCase().trim(),
              nombre:
              `${params.nombre} ${params.apellidoP}`,
              empresa: params.empresa,
              password: pass,
            });
            await mailer.sendMail({
              to: `${correoP}, ${params.correo.toLowerCase().trim()}`,
              subject: correoTemplate.subject,
              html: correoTemplate.html,
              text: correoTemplate.text,
            });
            console.log(`Credenciales enviadas a ${params.correo.toLowerCase().trim()}`
          );
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
  const usuario = req.params.usuario;

  try {
    const userFound = await Users.findOne({
      usuario: usuario.trim().toLowerCase(),
    });

    if (userFound == null) {
      return res.status(500).send({
        message:
          "Ocurrió un error: La información proporcionada es incorrecta",
      });
    }

    userFound.password = undefined;

    const correo = userFound.correo;

    const urlRecuperacion =
      `https://proveedores-grupo-sacmag.com.mx/recuperar-info/${userFound.rfc.toUpperCase()}/${userFound.correo.toUpperCase()}`;

    const correoTemplate =
      supplierEmailTemplates.emailRecuperacionPassword({
        usuario: userFound.usuario,
        urlRecuperacion,
      });

    await mailer.sendMail({
      to: userFound.correo,
      subject: correoTemplate.subject,
      html: correoTemplate.html,
      text: correoTemplate.text,
    });

    console.log(
      `Correo de recuperación enviado a ${userFound.correo}`
    );

    return res.status(200).send({
      correo,
    });

  } catch (error) {
    return res.status(500).send({
      message: "Ocurrió un error: " + error,
    });
  }
},
};

module.exports = AuthController;
