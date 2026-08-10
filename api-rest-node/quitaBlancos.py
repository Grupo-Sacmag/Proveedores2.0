import os
from pathlib import Path
from pymongo import MongoClient
#Esta función limpia las referencias a archivos PDF en la carpeta de cuarentena y marca los documentos como borrados si quedan sin archivos.

# --- configuración ---
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "proveedores"                    
COLLECTION = "archives"                    
BASE_DIR = Path(__file__).parent           
QUARANTINE_DIR = BASE_DIR / "quarantine"  


ARCHIVO_FIELDS = [f"archivo{i}" for i in range(1, 16)]  # archivo1..archivo15

def main(dry_run=True):
    if not QUARANTINE_DIR.exists():
        print(f"[ERROR] No existe carpeta de cuarentena: {QUARANTINE_DIR}")
        return

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    col = db[COLLECTION]

    quarantined = {p.name for p in QUARANTINE_DIR.rglob("*.[pP][dD][fF]")}
    if not quarantined:
        print("No se encontraron PDFs en quarantine. Nada que hacer.")
        client.close()
        return

    print(f"Detectados {len(quarantined)} PDFs en quarantine: {sorted(list(quarantined))}\n")

    cursor = col.find({})
    modified_docs = 0

    for doc in cursor:
        to_set = {}
        matched_files = []
        for field in ARCHIVO_FIELDS:
            val = doc.get(field)
            if val and val in quarantined:
                to_set[field] = ""  # limpiar archivo en cuarentena
                matched_files.append(val)

        if not matched_files:
            continue

        all_empty = True
        for field in ARCHIVO_FIELDS:
            if field in to_set:
                continue
            if doc.get(field):
                all_empty = False
                break

        if all_empty:
            to_set["borrado"] = True

        rfc = doc.get("rfc", "<sin rfc>")
        print(f"Registro _id={doc['_id']} rfc={rfc} tiene en quarantine: {matched_files}. "
              f"{'Se marcaría borrado.' if all_empty else ''}")

        if not dry_run:
            col.update_one({"_id": doc["_id"]}, {"$set": to_set})
            modified_docs += 1
            print(f"  -> Aplicado: campos actualizados: {list(to_set.keys())}")
        else:
            print(f"  -> Dry run: no se aplicó (campos a cambiar: {list(to_set.keys())})")

    print(f"\nResumen: documentos modificados (si se ejecutó con --do-it): {modified_docs}")
    client.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Limpia refs a PDFs en quarantine y marca borrado si se quedan vacíos")
    parser.add_argument("--do-it", action="store_true", help="Aplica los cambios (sin este flag es dry-run)")
    args = parser.parse_args()
    main(dry_run=not args.do_it)
