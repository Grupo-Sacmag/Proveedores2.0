'use strict'
var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secret_proveedores_sacmag_angular_node';
exports.ensureAuth = function(req, res, next) {

    /* var tok = req.headers.authorization;
    console.log(req.headers); */
    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'La petición no tiene la cabecera de autenticación' });
    }
   var token = req.headers.authorization.replace('Bearer ', '');

    try {
        var payload = jwt.decode(token, secret);
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                message: 'El token ha expirado'
            })
        }
    } catch (ex) {
        return res.status(401).send({
            message: 'El token no es válido, vuelva a iniciar sesion, TOKEN: ' + token
        })
    }
    req.user = payload;
    next();

}