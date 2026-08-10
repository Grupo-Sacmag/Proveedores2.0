import json
from pathlib import Path
from pymongo import MongoClient
import fitz  # PyMuPDF
from PIL import Image
import numpy as np
from skimage.metrics import structural_similarity as ssim
import imagehash

# --- Configuración ---
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "proveedores"
COLLECTION = "archives"
BASE_DIR = Path(__file__).parent
UPLOADS_DIR = BASE_DIR / "uploads"
CUMPLIMIENTO_DIR = BASE_DIR / "validArch" / "cumplimientoSat"
LOG_JSON_PATH = BASE_DIR / "log_archivo8_validos.json"
LOG_NDJSON_PATH = BASE_DIR / "log_archivo8_validos.ndjson"

SIMILARITY_THRESHOLD = 0.7  # >= esto se considera válido
STANDARD_SIZE = (800, 1000)  # normaliza tamaño para comparar

def pdf_first_page_image(pdf_path: Path, size=STANDARD_SIZE, zoom=2) -> Image.Image:
    doc = fitz.open(pdf_path)
    if doc.page_count < 1:
        raise ValueError(f"{pdf_path} no tiene páginas")
    page = doc[0]
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img = img.resize(size, Image.LANCZOS)
    return img

def compute_ssim_similarity(img1: Image.Image, img2: Image.Image) -> float:
    a = np.array(img1.convert("L"), dtype=np.float32)
    b = np.array(img2.convert("L"), dtype=np.float32)
    score, _ = ssim(a, b, full=True, data_range=255)
    return float(score)

def compute_phash_similarity(img1: Image.Image, img2: Image.Image) -> float:
    hash1 = imagehash.phash(img1)
    hash2 = imagehash.phash(img2)
    dist = hash1 - hash2  # Hamming distance
    max_bits = hash1.hash.size
    similarity = 1.0 - (dist / max_bits)
    return similarity  # 0..1

def combined_similarity(candidate: Image.Image, reference: Image.Image):
    ssim_score = compute_ssim_similarity(candidate, reference)
    phash_score = compute_phash_similarity(candidate, reference)
    return (ssim_score + phash_score) / 2.0, ssim_score, phash_score

def load_cumplimiento_templates():
    templates = []
    for p in CUMPLIMIENTO_DIR.rglob("*.[pP][dD][fF]"):
        try:
            img = pdf_first_page_image(p)
            templates.append((p.name, img))
        except Exception as e:
            print(f"[WARN] no se pudo renderizar {p.name}: {e}")
    if not templates:
        raise RuntimeError("No se encontró ningún PDF válido en cumplimientoSat.")
    return templates

def main():
    # Cargar plantillas de cumplimientoSat
    print("Cargando templates de validArch/cumplimientoSat...")
    templates = load_cumplimiento_templates()
    print(f"Templates cargados: {[name for name, _ in templates]}")

    # Conectar a Mongo
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    col = db[COLLECTION]

    resultados = []

    for doc in col.find({}):
        rfc = doc.get("rfc", "<sin rfc>")
        archivo8 = doc.get("archivo8") or ""
        detalles = []
        valido = False
        mejor_sim = 0.0
        mejor_ssim = 0.0
        mejor_phash = 0.0
        mejor_template = None

        if not archivo8:
            detalles.append("No tiene archivo8")
        else:
            pdf_path = UPLOADS_DIR / archivo8
            if not pdf_path.exists():
                detalles.append(f"{archivo8} no existe en uploads")
            else:
                try:
                    candidate_img = pdf_first_page_image(pdf_path)
                except Exception as e:
                    detalles.append(f"Error al renderizar archivo8: {e}")
                    candidate_img = None

                if candidate_img is not None:
                    for tpl_name, tpl_img in templates:
                        sim, ssim_score, phash_score = combined_similarity(candidate_img, tpl_img)
                        detalles.append(f"[{tpl_name}] combined={sim:.3f} (ssim={ssim_score:.3f}, phash={phash_score:.3f})")
                        if sim > mejor_sim:
                            mejor_sim = sim
                            mejor_ssim = ssim_score
                            mejor_phash = phash_score
                            mejor_template = tpl_name

                    if mejor_sim >= SIMILARITY_THRESHOLD:
                        valido = True
                        detalles.append(f"Válido: mejor template {mejor_template} con similitud {mejor_sim:.3f}")
                    else:
                        detalles.append(f"No válido: mejor similitud {mejor_sim:.3f} < {SIMILARITY_THRESHOLD}")
                else:
                    detalles.append("No se procesó la imagen candidata.")

        resultados.append({
            "rfc": rfc,
            "archivo8": archivo8,
            "valido": "YES" if valido else "NO",
            "mejor_similitud": f"{mejor_sim:.3f}",
            "mejor_ssim": f"{mejor_ssim:.3f}",
            "mejor_phash": f"{mejor_phash:.3f}",
            "mejor_template": mejor_template or "",
            "detalles": detalles  # ahora es lista para más flexibilidad
        })

    # Escribir log completo en JSON (array)
    try:
        with LOG_JSON_PATH.open("w", encoding="utf-8") as f_json:
            json.dump(resultados, f_json, ensure_ascii=False, indent=2)
        print(f"Log JSON escrito en {LOG_JSON_PATH}")
    except Exception as e:
        print(f"[ERROR] al escribir {LOG_JSON_PATH}: {e}")

    # Escribir NDJSON (una línea por documento) para procesamiento incremental
    try:
        with LOG_NDJSON_PATH.open("w", encoding="utf-8") as f_nd:
            for row in resultados:
                f_nd.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(f"Log NDJSON escrito en {LOG_NDJSON_PATH}")
    except Exception as e:
        print(f"[ERROR] al escribir {LOG_NDJSON_PATH}: {e}")

    # Opcional: resumen rápido en consola
    print("\nResumen por RFC:")
    for row in resultados:
        print(f" - {row['rfc']}: valido={row['valido']} mejor_sim={row['mejor_similitud']} template={row['mejor_template']}")

    client.close()

if __name__ == "__main__":
    main()
