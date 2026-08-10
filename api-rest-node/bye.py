#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpiar archivos con "no aplica" o en blanco de uploads
y actualizar los registros en MongoDB correspondientes en la colección archives.

El script:
1. Busca todos los archivos en la carpeta uploads/
2. Identifica archivos que dicen "no aplica" o están completamente en blanco
3. Se conecta a MongoDB y busca qué archivo (archivo1-archivo15) del modelo archives lo referencia
4. Actualiza ese campo en la base de datos a ""
5. Borra el archivo de uploads/
"""

import os
import sys
import re
import struct
from pathlib import Path
from pymongo import MongoClient
from bson.objectid import ObjectId

# Configuración de conexión
MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "proveedores"
COLLECTION_NAME = "archives"
UPLOADS_DIR = "./uploads"

def extract_text_from_pdf(filepath):
    """
    Extrae texto de un PDF de way simple (lee bytes).
    
    Args:
        filepath: ruta del PDF
    
    Returns:
        str: texto extraído, o vacío si no se puede leer
    """
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Convertir bytes a string e intentar extraer texto
        try:
            text = content.decode('utf-8', errors='ignore')
        except:
            text = str(content)
        
        return text
    except Exception as e:
        print(f"  ✗ Error leyendo PDF {filepath}: {e}")
        return ""

def is_file_invalid(filepath):
    """
    Verifica si un archivo contiene 'no aplica' o está en blanco.
    
    Args:
        filepath: ruta del archivo a verificar
    
    Returns:
        bool: True si el archivo es inválido, False en caso contrario
    """
    try:
        # Obtener tamaño del archivo
        file_size = os.path.getsize(filepath)
        
        # Archivos muy pequeños (< 2KB) probablemente estén en blanco o sean inválidos
        if file_size < 2048:
            print(f"  ✓ Archivo muy pequeño ({file_size} bytes): {filepath}")
            return True
        
        filename_lower = filepath.lower()
        
        # Procesar diferentes tipos de archivo
        if filename_lower.endswith('.txt'):
            # Leer archivo de texto
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().strip()
            
            # Verificar si está en blanco
            if not content:
                print(f"  ✓ Archivo TXT en blanco: {filepath}")
                return True
            
            # Verificar si dice "no aplica" (sin importar mayúsculas)
            if 'no aplica' in content.lower():
                print(f"  ✓ Archivo TXT con 'no aplica': {filepath}")
                return True
        
        elif filename_lower.endswith('.pdf'):
            # Leer PDF y buscar "no aplica"
            content = extract_text_from_pdf(filepath)
            
            if not content or len(content.strip()) < 10:
                print(f"  ✓ Archivo PDF en blanco/vacío: {filepath}")
                return True
            
            if 'no aplica' in content.lower():
                print(f"  ✓ Archivo PDF con 'no aplica': {filepath}")
                return True
        
        return False
    except Exception as e:
        print(f"  ✗ Error al leer {filepath}: {e}")
        return False

def find_archive_reference(client, filename):
    """
    Busca en MongoDB qué registro de archives contiene referencia a este archivo.
    
    Args:
        client: cliente de MongoDB
        filename: nombre del archivo a buscar
    
    Returns:
        tuple: (rfc, campo_archivo) si lo encuentra, None si no
    """
    try:
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Buscar en todos los campos archivo1-archivo15
        for i in range(1, 16):
            field = f"archivo{i}"
            # Buscar documentos donde este campo contenga el nombre del archivo
            result = collection.find_one({field: filename})
            if result:
                return (result.get('rfc'), field, result.get('_id'))
        
        return None
    except Exception as e:
        print(f"  ✗ Error buscando en MongoDB: {e}")
        return None

def delete_file(filepath):
    """
    Borra un archivo de forma segura.
    
    Args:
        filepath: ruta del archivo a borrar
    
    Returns:
        bool: True si se borró correctamente, False en caso contrario
    """
    try:
        os.remove(filepath)
        print(f"  ✓ Archivo borrado: {filepath}")
        return True
    except Exception as e:
        print(f"  ✗ Error borrando {filepath}: {e}")
        return False

def update_archive_record(client, rfc, field, doc_id):
    """
    Actualiza el registro en archives, poniendo el campo en "".
    
    Args:
        client: cliente de MongoDB
        rfc: RFC del proveedor
        field: campo a actualizar (archivo1, archivo2, etc)
        doc_id: ID del documento en MongoDB
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Actualizar el campo a string vacío
        result = collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {field: ""}}
        )
        
        if result.modified_count > 0:
            print(f"  ✓ Registro actualizado en MongoDB: RFC={rfc}, Campo={field}")
            return True
        else:
            print(f"  ✗ No se actualizó el registro en MongoDB")
            return False
    except Exception as e:
        print(f"  ✗ Error actualizando MongoDB: {e}")
        return False

def main():
    """Función principal."""
    print("=" * 70)
    print("Script de limpieza: Borrar archivos 'no aplica' o en blanco")
    print("=" * 70)
    print(f"Directorio de uploads: {UPLOADS_DIR}")
    print(f"Base de datos: {DB_NAME} (MongoDB)")
    print()
    
    # Verificar si el directorio existe
    if not os.path.isdir(UPLOADS_DIR):
        print(f"✗ El directorio {UPLOADS_DIR} no existe")
        sys.exit(1)
    
    # Conectar a MongoDB
    try:
        print("Conectando a MongoDB...")
        client = MongoClient(MONGODB_URI)
        # Verificar conexión
        client.admin.command('ping')
        print("✓ Conexión a MongoDB establecida\n")
    except Exception as e:
        print(f"✗ Error conectando a MongoDB: {e}")
        print("  Asegúrate de que MongoDB está corriendo en localhost:27017")
        sys.exit(1)
    
    # Procesar archivos
    files_to_process = []
    print("Buscando archivos inválidos en uploads/...")
    
    for root, dirs, files in os.walk(UPLOADS_DIR):
        for filename in files:
            filepath = os.path.join(root, filename)
            
            # Saltar directorios especiales
            if 'feedback' in filepath or 'old' in filepath or 'vaoa' in filepath:
                continue
            
            # Ignorar archivos que no son de interés
            if filename.startswith('.'):
                continue
            
            if is_file_invalid(filepath):
                files_to_process.append({
                    'filepath': filepath,
                    'filename': filename
                })
    
    if not files_to_process:
        print("✓ No se encontraron archivos con 'no aplica' o en blanco")
        print()
        client.close()
        return
    
    print(f"\n✓ Se encontraron {len(files_to_process)} archivo(s) inválido(s)\n")
    
    # Procesar cada archivo
    deleted_count = 0
    updated_count = 0
    failed_count = 0
    
    print("Procesando archivos...")
    print("-" * 70)
    
    for item in files_to_process:
        filepath = item['filepath']
        filename = item['filename']
        
        print(f"\nProcesando: {filename}")
        
        # Buscar en MongoDB
        result = find_archive_reference(client, filename)
        
        if result:
            rfc, field, doc_id = result
            print(f"  Encontrado: RFC={rfc}, Campo={field}")
            
            # Actualizar en MongoDB
            if update_archive_record(client, rfc, field, doc_id):
                updated_count += 1
                
                # Borrar archivo
                if delete_file(filepath):
                    deleted_count += 1
                else:
                    failed_count += 1
            else:
                failed_count += 1
        else:
            print(f"  ✗ No se encontró referencia en MongoDB")
            # Aún así borrar el archivo
            if delete_file(filepath):
                deleted_count += 1
            else:
                failed_count += 1
    
    # Resumen
    print("\n" + "=" * 70)
    print("RESUMEN DE LA OPERACIÓN")
    print("=" * 70)
    print(f"Archivos procesados:   {len(files_to_process)}")
    print(f"Archivos borrados:     {deleted_count}")
    print(f"Registros actualizados: {updated_count}")
    print(f"Errores:               {failed_count}")
    print("=" * 70)
    
    # Cerrar conexión
    client.close()
    print("\n✓ Conexión a MongoDB cerrada")

if __name__ == "__main__":
    main()
