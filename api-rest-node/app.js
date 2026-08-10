'use strict'
var express = require('express');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
var path = require('path');
var app = express();

// cargar archivo rutas
var project_routes = require('./routes/project');

// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
// ruta base
app.use('/api', project_routes);

// ------------------------------------------------------
// Servir archivos estáticos del frontend (webpack build directo en client/)
app.use(express.static(path.join(__dirname, 'client')));

// Si no se encuentra una ruta en la API, regresar el index.html para el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});
// ------------------------------------------------------

// exportar
module.exports = app;
