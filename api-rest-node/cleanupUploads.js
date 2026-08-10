const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Archives = require('./models/archives');

// helper to walk through folder recursively and collect file paths
function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir);
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

async function runCleanup() {
  // use same connection string as the app
  const mongoUrl = 'mongodb://localhost:27017/proveedores';
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`🔌 Connected to MongoDB at ${mongoUrl}`);

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.error('⚠️ uploads directory does not exist:', uploadsDir);
    process.exit(1);
  }

  // load all archives and build set of referenced file names
  console.log('📦 Reading archive documents...');
  const archives = await Archives.find({});
  const referenced = new Set();

  archives.forEach((doc) => {
    for (let i = 1; i <= 15; i++) {
      const field = `archivo${i}`;
      const value = doc[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        referenced.add(value);
      }
    }
  });

  console.log(`✅ ${referenced.size} files referenced from database`);

  // update records that point to missing files
  for (const doc of archives) {
    let modified = false;
    for (let i = 1; i <= 15; i++) {
      const field = `archivo${i}`;
      const fileName = doc[field];
      if (fileName && fileName.trim() !== '') {
        const fullPath = path.join(uploadsDir, fileName);
        if (!fs.existsSync(fullPath)) {
          console.warn(`🧹 Missing file for RFC ${doc.rfc}, field ${field}: ${fileName}`);
          doc[field] = ''; // clear the reference
          modified = true;
        }
      }
    }
    if (modified) {
      await doc.save();
      console.log(`🔄 Updated document ${doc._id} (${doc.rfc})`);
    }
  }

  // scan uploads folder and delete any file not referenced
  console.log('🗂️  Scanning uploads folder for orphaned files...');
  const allFiles = walkDir(uploadsDir);
  let deletedCount = 0;

  allFiles.forEach((fullPath) => {
    const base = path.basename(fullPath);
    if (!referenced.has(base)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`❌ Deleted orphan file: ${fullPath}`);
        deletedCount++;
      } catch (err) {
        console.error(`⚠️ Failed to delete ${fullPath}:`, err.message);
      }
    }
  });

  console.log(`🧼 Cleanup complete, deleted ${deletedCount} unreferenced files.`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

runCleanup().catch((err) => {
  console.error('‼️ Error during cleanup:', err);
  process.exit(1);
});
