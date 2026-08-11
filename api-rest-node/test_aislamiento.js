
const mongoose = require("mongoose");
const Vendors = require("./models/vendors");
const Archives = require("./models/archives");

async function testAislamiento() {
  await mongoose.connect("mongodb://localhost:27017/proveedores", { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Conectado a la BD para la prueba...");

  const testRFC = "TESTAISLAMIENTO123";
  
  await Vendors.deleteOne({ rfc: testRFC });
  await Archives.deleteMany({ rfc: testRFC });

  console.log("\n--- 1. Alta en SACMAG ---");
  let vendor = new Vendors({
    rfc: testRFC,
    razonSocial: "Proveedor de Prueba",
    correo: "skout95@hotmail.com",
    empresa: ["sacmag"]
  });
  await vendor.save();
  console.log("Proveedor creado en sacmag.");

  console.log("\n--- 2. Subiendo Archivos a SACMAG ---");
  let archiveSacmag = new Archives({
    rfc: testRFC,
    empresa: "sacmag",
    archivo1: "fake_file_sacmag.pdf"
  });
  await archiveSacmag.save();
  console.log("Archivo creado para sacmag: ", archiveSacmag.archivo1);

  console.log("\n--- 3. Alta en CORDINA (Simulando lo que hace el Controller) ---");
  await Vendors.updateOne({ rfc: testRFC }, { $addToSet: { empresa: "cordina" } }).exec();
  const updatedVendor = await Vendors.findOne({ rfc: testRFC });
  console.log("Empresas del proveedor ahora:", updatedVendor.empresa);

  console.log("\n--- 4. Obteniendo Archivos para CORDINA (Simulando getArchivesRfc) ---");
  const archiveCordina = await Archives.findOne({ rfc: testRFC, empresa: "cordina" });
  if (!archiveCordina) {
    console.log("EXITO: No hay expediente para Cordina! Esta vacio y aislado.");
  } else {
    console.log("ERROR: Se clonaron archivos para Cordina:", archiveCordina);
  }

  process.exit(0);
}

testAislamiento();

