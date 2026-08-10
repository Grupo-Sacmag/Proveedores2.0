from pymongo import MongoClient
from difflib import SequenceMatcher
import re

# Configuración de conexión a producción
MONGO_URI = "mongodb://AdminSacDevelop:SacDev2022Ur@localhost:27017/proveedores?authSource=admin"
DB_NAME = "proveedores"
COLLECTION = "vendors"

# Conexión a Mongo
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION]

def es_registro_patronal_valido(rp: str) -> bool:
    """
    Valida la estructura del registro patronal:
    - Exactamente 11 caracteres
    - Sin espacios
    - Puede ser:
        a) Todos números
        b) Una letra + 10 números
        c) Dos letras + 9 números
    """
    if not rp or len(rp) != 11:
        return False
    if " " in rp:
        return False
    
    # Todos números
    if re.fullmatch(r"\d{11}", rp):
        return True
    # Una letra + 10 números
    if re.fullmatch(r"[A-Z]\d{10}", rp, re.IGNORECASE):
        return True
    # Dos letras + 9 números
    if re.fullmatch(r"[A-Z]{2}\d{9}", rp, re.IGNORECASE):
        return True
    
    return False

def parecido(a: str, b: str) -> float:
    """Devuelve el porcentaje de similitud entre dos cadenas"""
    return SequenceMatcher(None, a, b).ratio()

def procesar_registros():
    docs = collection.find({})
    for doc in docs:
        rfc = (doc.get("rfc") or "").strip().upper()
        rp = (doc.get("registroPatronal") or "").strip().upper()

        if not rp:
            continue  # no hay nada que validar

        similitud = parecido(rfc, rp)

        if similitud > 0.8 or not es_registro_patronal_valido(rp):
            print(f"Actualizando {doc['_id']} -> SINREGISTRO (antes: {rp})")
            collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"registroPatronal": "SINREGISTRO"}}
            )

if __name__ == "__main__":
    procesar_registros()
    print("Proceso finalizado.")
