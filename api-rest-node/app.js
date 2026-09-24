'use strict'
require('./inject_logger');
var express = require('express');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
var path = require('path');
var app = express();
var ticketRoutes = require('./routes/ticket.routes');

// Cargar archivos de rutas
var project_routes = require('./routes/project');
var workorder_routes = require('./routes/workorder.routes');

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
// Rutas base
app.use('/api', project_routes);
app.use('/api', workorder_routes);
app.use('/api', ticketRoutes);

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
