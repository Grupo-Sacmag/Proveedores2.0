const mongoose = require('mongoose');
const vendorController = require('./controllers/vendor.controller');

mongoose.connect('mongodb://localhost:27017/proveedores', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    const req = {
        params: { id: '62f6a8d212a95f7f98c6dd1d', send: 'false' },
        body: { 
            archivosRequeridos: [1, 2, 3], 
            rfc: 'cuaf961028ev6', 
            correo: 'test@test.com', 
            registroPatronal: 'SINREGISTRO', 
            razonSocial: 'usuarioprueba', 
            tipoProveedor: 'otros', 
            regimenFiscal: 'fisica', 
            nombreContacto: 'sacmag prueba' 
        },
        user: { rol: 'administrador', correo: 'admin@sacmag.com' }
    };

    const res = {
        status: function(code) {
            console.log('STATUS:', code);
            return this;
        },
        send: function(data) {
            console.log('SEND:', data);
            process.exit(0);
        }
    };

    await vendorController.updateVendors(req, res);
});
