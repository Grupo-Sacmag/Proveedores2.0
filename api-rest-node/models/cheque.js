'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ChequesSchema = Schema({
        idVendor: String,
        concepto: String,
        nombre: String,
        monto: Number,
        pago: String,
        fecha: Date,

    })
    //Pasa el nombre a minuscula y lo pluraliza
module.exports = mongoose.model('Cheque', ChequesSchema);