'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fechArchivoSchema = new Schema({
  nombreARC: { type: String, required: true, unique: true },
  fechaUM: { type: Date, required: true },
});
// Evita OverwriteModelError
module.exports = mongoose.models.fechArchivo || mongoose.model('fechArchivo', fechArchivoSchema);
