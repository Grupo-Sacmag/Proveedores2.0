'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3000; // coincide con Nginx

mongoose.Promise = global.Promise;

// var user = encodeURIComponent('ContaVendorsDB@');        // Usuario codificado
// var password = encodeURIComponent('velocivieja99@.16');   // Contraseña codificada
// var uri = `mongodb://${user}:${password}@127.0.0.1:27017/proveedores?authSource=admin`;
var uri = 'mongodb://127.0.0.1:27017/proveedores';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
.then(() => {
    console.log("Conexión a la base de datos establecida con éxito...");

    app.listen(port, () => {
        console.log("Servidor corriendo correctamente en la url: localhost:" + port);
    });
})
.catch(err => console.log("Error al conectar MongoDB:", err));