"use strict";

// Debe usarse SIEMPRE después de md_auth.ensureAuth, que es quien llena req.user desde el JWT.
exports.ensureAdminPremium = function (req, res, next) {
  if (!req.user || req.user.rol !== "administrador_premium") {
    return res.status(403).send({
      message: "No cuentas con los permisos suficientes para acceder a este recurso.",
    });
  }
  next();
};
