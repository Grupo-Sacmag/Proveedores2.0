'use strict'
var express = require('express');
var ProjectController = require('../controllers/project');
var router = express.Router();
var md_auth = require('../middleware/authenticated');

// rutas
router.post('/login', ProjectController.login);
router.post('/subir-archivos/:rfc/:empresa', ProjectController.saveArchives);

router.get('/archivos/:file', ProjectController.getArchive);
router.get('/archivos-old/:file', ProjectController.getArchiveOld);
router.get('/obtener-archivos/:rfc/:empresa', md_auth.ensureAuth, ProjectController.getArchivesRfc);
router.post('/subir-proveedor', md_auth.ensureAuth, ProjectController.saveVendor);
router.put('/proveedor/:id/:send', md_auth.ensureAuth, ProjectController.updateVendors);
router.post('/registro', md_auth.ensureAuth, ProjectController.saveUsersLogin);
router.get('/usuario/:id', md_auth.ensureAuth, ProjectController.getUSer);
router.get('/get-archive-old/:rfc', ProjectController.getArchiveOld);
router.get('/archiveOld/:file', ProjectController.ArchiveOld);
//router.get('/Donloadin-failin', ProjectController.downloadFailing);
//POST para el de cheques
router.post("/cheques/:id", ProjectController.newCheque);
router.get("/cheques/:id", ProjectController.getCheques);
router.get('/fecha/:nombre', ProjectController.getFechaArchivoPorNombre);

// ✅ SOLO UNA ruta para validar archivos
router.put('/archivos/:rfc/:empresa', md_auth.ensureAuth, ProjectController.validateVendor);
router.get("/descargar-todos",  md_auth.ensureAuth, ProjectController.getAllArchives);
router.get('/descargar-proveedor-zip/:rfc/:empresa', md_auth.ensureAuth, ProjectController.getVendorZip);
router.get('/cheque/image/:id', ProjectController.getChequeImage);

router.post('/archivospaUpdate/:rfc/:empresa', ProjectController.updateArchives);
router.get('/vendors-with-archives', md_auth.ensureAuth, ProjectController.getVendorsWithArchives);

// ✅ Se Validan los archivos 1 x 1 con esta ruta
router.put('/archives/validate-file/:rfc/:empresa', md_auth.ensureAuth, ProjectController.toggleFileValidation);

router.get('/proveedor/:id', md_auth.ensureAuth, ProjectController.getVendor);
router.get('/proveedores/:empresa', md_auth.ensureAuth, ProjectController.getVendors);
router.get('/proveedorauth/:rfc', md_auth.ensureAuth, ProjectController.getVendorRfc);
router.get('/proveedor-archives/:rfc', md_auth.ensureAuth, ProjectController.getAllArchives);
router.post('/cambiar-info/:newPass', ProjectController.changePassword);
router.post('/forgot-pass/:usuario', ProjectController.forgotPass);
router.delete('/archivos/:rfc/:mensaje/:empresa', md_auth.ensureAuth, ProjectController.refuseArchives);
router.post('/feedback', ProjectController.saveFeedback);


module.exports = router;
