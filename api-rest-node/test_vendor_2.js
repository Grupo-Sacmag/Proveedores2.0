const mongoose = require('mongoose');
const vendorController = require('./controllers/vendor.controller');

mongoose.connect('mongodb://localhost:27017/proveedores', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
    const Vendors = require('./models/vendors');
    const dbVendor = await Vendors.findById('65b2835ed212a01c60d1e281');
    if (!dbVendor) {
        console.log('Vendor not found in DB!');
        process.exit(1);
    }
    
    // Simulate what the frontend does
    let vendorObj = dbVendor.toObject();
    if(vendorObj.rfc) vendorObj.rfc = vendorObj.rfc.toUpperCase();
    if(vendorObj.registroPatronal) vendorObj.registroPatronal = vendorObj.registroPatronal.toUpperCase();
    if(vendorObj.razonSocial) vendorObj.razonSocial = vendorObj.razonSocial.toUpperCase();
    if(vendorObj.nombreContacto) vendorObj.nombreContacto = vendorObj.nombreContacto.toUpperCase();
    if(vendorObj.observaciones) vendorObj.observaciones = vendorObj.observaciones.toUpperCase();

    const req = {
        params: { id: '65b2835ed212a01c60d1e281', send: 'false' },
        body: vendorObj,
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

    try {
        await vendorController.updateVendors(req, res);
    } catch(err) {
        console.log('UNCAUGHT ERROR:', err);
    }
});
