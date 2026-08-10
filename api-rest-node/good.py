#!/usr/bin/env python3
"""
Utility script to synchronize the uploads folder with the `archives` collection.

- Any file that exists in `uploads/` but is not referenced by a document
  will be removed (orphan cleanup).
- Any document that refers to a file that is no longer present will have
  that field cleared (set to empty string).

Usage:
    python good.py

The script assumes MongoDB running locally on default port and database
`proveedores`.  Adjust constants below if your setup differs.
"""

import os
import sys
from pymongo import MongoClient

# --- configuration --------------------------------------------------------
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "proveedores"
COLLECTION = "archives"

# --------------------------------------------------------------------------

def main():
    if not os.path.isdir(UPLOAD_DIR):
        print(f"ERROR: uploads directory not found: {UPLOAD_DIR}")
        sys.exit(1)

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    coll = db[COLLECTION]

    # --- collect referenced file names -------------------------------------
    referenced = set()
    print("Reading archive documents from database...")
    for doc in coll.find({}):
        for i in range(1, 16):
            key = f"archivo{i}"
            val = doc.get(key)
            if isinstance(val, str) and val.strip():
                referenced.add(val.strip())
    print(f"{len(referenced)} file(s) referenced by database records.")

    # --- update records that point to missing files ------------------------
    for doc in coll.find({}):
        updates = {}
        for i in range(1, 16):
            key = f"archivo{i}"
            val = doc.get(key)
            if isinstance(val, str) and val.strip():
                path = os.path.join(UPLOAD_DIR, val)
                if not os.path.exists(path):
                    updates[key] = ""
        if updates:
            coll.update_one({"_id": doc["_id"]}, {"$set": updates})
            print(f"Cleared missing files for RFC {doc.get('rfc')} -> {list(updates.keys())}")

    # --- remove orphaned files ---------------------------------------------
    deleted = 0
    for fname in os.listdir(UPLOAD_DIR):
        full = os.path.join(UPLOAD_DIR, fname)
        if os.path.isfile(full):
            if fname not in referenced:
                try:
                    os.remove(full)
                    deleted += 1
                    print(f"Deleted orphan file: {fname}")
                except Exception as e:
                    print(f"Failed to delete {fname}: {e}")
    print(f"Cleanup complete, removed {deleted} orphan file(s).")
    client.close()


if __name__ == "__main__":
    main()
