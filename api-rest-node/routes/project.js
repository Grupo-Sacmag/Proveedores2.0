'use strict'
var express = require('express');
var AuthController = require('../controllers/auth.controller');
var VendorController = require('../controllers/vendor.controller');
var ArchivesController = require('../controllers/archives.controller');
var ChequesController = require('../controllers/cheques.controller');
var router = express.Router();
var md_auth = require('../middleware/authenticated');

// rutas - Auth
router.post('/login', AuthController.login);
router.post('/registro', md_auth.ensureAuth, AuthController.saveUsersLogin);
router.get('/usuario/:id', md_auth.ensureAuth, AuthController.getUSer);
router.post('/cambiar-info/:newPass', AuthController.changePassword);
router.post('/forgot-pass/:usuario', AuthController.forgotPass);

// rutas - Archives (Expedientes)
router.post('/subir-archivos/:rfc/:empresa', ArchivesController.saveArchives);
router.get('/archivos/:file', ArchivesController.getArchive);
router.get('/archivos-old/:file', ArchivesController.getArchiveOld);
router.get('/obtener-archivos/:rfc/:empresa', md_auth.ensureAuth, ArchivesController.getArchivesRfc);
router.get('/get-archive-old/:rfc', ArchivesController.getArchiveOld);
router.get('/archiveOld/:file', ArchivesController.ArchiveOld);
router.get('/fecha/:nombre', ArchivesController.getFechaArchivoPorNombre);
// ✅ SOLO UNA ruta para validar archivos
router.put('/archivos/:rfc/:empresa', md_auth.ensureAuth, ArchivesController.validateVendor);
router.get("/descargar-todos",  md_auth.ensureAuth, ArchivesController.getAllArchives);
router.get('/descargar-proveedor-zip/:rfc/:empresa', md_auth.ensureAuth, ArchivesController.getVendorZip);
router.post('/archivospaUpdate/:rfc/:empresa', ArchivesController.updateArchives);
// ✅ Se Validan los archivos 1 x 1 con esta ruta
router.put('/archives/validate-file/:rfc/:empresa', md_auth.ensureAuth, ArchivesController.toggleFileValidation);
router.delete('/archivos/:rfc/:mensaje/:empresa', md_auth.ensureAuth, ArchivesController.refuseArchives);
router.get('/proveedor-archives/:rfc', md_auth.ensureAuth, ArchivesController.getAllArchives);

// rutas - Vendors (Proveedores)
router.post('/subir-proveedor', md_auth.ensureAuth, VendorController.saveVendor);
router.put('/proveedor/:id/:send', md_auth.ensureAuth, VendorController.updateVendors);
router.get('/proveedor/:id', md_auth.ensureAuth, VendorController.getVendor);
router.get('/proveedores/:empresa', md_auth.ensureAuth, VendorController.getVendors);
router.get('/proveedorauth/:rfc', md_auth.ensureAuth, VendorController.getVendorRfc);
router.get('/vendors-with-archives', md_auth.ensureAuth, VendorController.getVendorsWithArchives);
router.post('/feedback', VendorController.saveFeedback);

// rutas - Cheques
router.post("/cheques/:id", ChequesController.newCheque);
router.get("/cheques/:id", ChequesController.getCheques);
router.get('/cheque/image/:id', ChequesController.getChequeImage);


module.exports = router;
