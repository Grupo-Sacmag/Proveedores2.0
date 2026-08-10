import os
import json
from datetime import datetime
from pymongo import MongoClient

# --- Configuración ---
UPLOADS_FOLDER = "uploads"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "proveedores"
COLLECTION_NAME = "fecharchivos"
LOG_FILE = "Actualizacion de fecha.json"

# --- Conexión a MongoDB ---
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# --- Cargar logs existentes ---
if os.path.exists(LOG_FILE):
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        log_data = json.load(f)
else:
    log_data = []

# --- Leer archivos en la carpeta uploads ---
for filename in os.listdir(UPLOADS_FOLDER):
    if filename.lower().endswith(".pdf"):
        filepath = os.path.join(UPLOADS_FOLDER, filename)
        fecha_mod = datetime.fromtimestamp(os.path.getmtime(filepath))

        # --- Verificar si ya existe en MongoDB ---
        existe = collection.find_one({"nombreARC": filename})
        if not existe:
            # --- Insertar en MongoDB ---
            registro = {
                "nombreARC": filename,
                "fechaUM": fecha_mod
            }
            result = collection.insert_one(registro)
            registro["_id"] = str(result.inserted_id)

            # --- Guardar en log ---
            log_data.append({
                "nombreARC": filename,
                "fechaUM": fecha_mod.isoformat(),
                "_id": str(result.inserted_id)
            })
            print(f"Archivo agregado: {filename}")

# --- Guardar log actualizado ---
with open(LOG_FILE, "w", encoding="utf-8") as f:
    json.dump(log_data, f, ensure_ascii=False, indent=4)

print("Proceso completado.")
