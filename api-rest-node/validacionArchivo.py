import os
import shutil
import fitz  # PyMuPDF
import re
import argparse
from pathlib import Path
#Esta funcion hace un análisis de los PDFs en la carpeta de uploads y mueve a cuarentena aquellos que están en blanco o contienen la frase "en blanco".
# --- configuración ---
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
QUARANTINE_DIR = BASE_DIR / "quarantine"
MIN_CHARS_PER_PAGE = 10
KEY_PHRASE_REGEX = re.compile(r"en\s+blanco", re.IGNORECASE)

QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)

def page_has_images(page):
    images = page.get_images(full=True)
    return len(images) > 0, len(images)

def is_page_blank_or_en_blanco(page):
    text = page.get_text().strip()
    has_images, image_count = page_has_images(page)
    reasons = []
    if KEY_PHRASE_REGEX.search(text):
        return True, "contiene 'En blanco'", text, has_images, image_count
    if len(text) < MIN_CHARS_PER_PAGE:
        if has_images:
            return False, "", text, has_images, image_count
        return True, f"texto mínimo ({len(text)} chars) y sin imágenes", text, has_images, image_count
    return False, "", text, has_images, image_count

def analyze_pdf(path: Path):
    doc = fitz.open(path)
    page_flags = []  # list of tuples: (blank_bool, reason, text_len, has_images, image_count)
    for i in range(len(doc)):
        page = doc[i]
        blank, reason, text, has_images, image_count = is_page_blank_or_en_blanco(page)
        page_flags.append((blank, reason, len(text.strip()), has_images, image_count))
    doc.close()
    return page_flags

def should_quarantine(page_flags, force_quarantine=False):
    if force_quarantine:
        return True
    return all(flag for flag, *_ in page_flags)

def summary_reasons(page_flags):
    reasons = {}
    for idx, (flag, reason, text_len, has_images, image_count) in enumerate(page_flags):
        if flag:
            reasons.setdefault(reason, []).append(idx + 1)
    return reasons

def main(do_it=False, force_quarantine=False, verbose=False):
    if not UPLOAD_DIR.exists():
        raise FileNotFoundError(f"No se encontró la carpeta de uploads en: {UPLOAD_DIR.resolve()}")

    report = []
    total = 0
    quarantined = 0
    for pdf_path in UPLOAD_DIR.rglob("*.[pP][dD][fF]"):
        total += 1
        fname = pdf_path.name
        print(f"\n--- Procesando: {fname} ---")
        try:
            flags = analyze_pdf(pdf_path)
        except Exception as e:
            print(f"[ERROR] No se pudo abrir {pdf_path}: {e}")
            continue

        if verbose:
            for idx, (flag, reason, text_len, has_images, image_count) in enumerate(flags, start=1):
                status = "BLANCA" if flag else "OK"
                img_info = f"{image_count} imagen(es)" if has_images else "sin imágenes"
                print(f"  Página {idx}: {status} | texto len={text_len} | {img_info} | motivo: {reason or '—'}")

        quarantine_decision = should_quarantine(flags, force_quarantine=force_quarantine)
        if quarantine_decision:
            reasons = summary_reasons(flags) if not force_quarantine else {"FORZADO": ["todas"]}
            report.append((fname, reasons))
            target = QUARANTINE_DIR / fname
            if do_it:
                try:
                    shutil.move(str(pdf_path), str(target))
                    print(f"[MOVIDO] {fname} -> {target}, razones: {reasons}")
                    quarantined += 1
                except Exception as e:
                    print(f"[ERROR] Al mover {fname}: {e}")
            else:
                print(f"[DRY RUN] {fname} sería movido a cuarentena por: {reasons}")
                quarantined += 1
        else:
            print(f"[OK] {fname} no cumple criterio de cuarentena.")

    # resumen
    print("\n=== Resumen final ===")
    print(f"Total de PDFs escaneados: {total}")
    print(f"Quarantine candidates (incluye dry run): {len(report)}")
    print(f"Quarantined efectivamente (si --do-it se pasó): {quarantined}")
    if report:
        print("\nDetalles de cuarentena:")
        for fname, reasons in report:
            print(f" - {fname}: {reasons}")
    else:
        print("No se detectaron PDFs que cumplan el criterio de cuarentena.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Valida PDFs y pone en cuarentena los que están en blanco o contienen 'En blanco'.")
    parser.add_argument("--do-it", action="store_true", help="Mueve realmente los archivos.")
    parser.add_argument("--force-quarantine", action="store_true", help="Ignora criterios y fuerza cuarentena para probar.")
    parser.add_argument("--verbose", action="store_true", help="Muestra diagnóstico por página.")
    args = parser.parse_args()
    main(do_it=args.do_it, force_quarantine=args.force_quarantine, verbose=args.verbose)
