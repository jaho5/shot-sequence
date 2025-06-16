import json
import uuid
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

# Check if we should use PostgreSQL (for production) or SQLite (for development)
DATABASE_URL = os.getenv("DATABASE_URL")
USE_POSTGRES = DATABASE_URL is not None

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
else:
    import sqlite3
    # Ensure data directory exists for SQLite
    DATA_DIR = os.getenv("DATA_DIR", ".")
    os.makedirs(DATA_DIR, exist_ok=True)
    DATABASE_PATH = os.path.join(DATA_DIR, "sequences.db")

def init_database():
    """Initialize the database with required tables."""
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sequences (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                shots TEXT NOT NULL,
                settings TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    else:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sequences (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                shots TEXT NOT NULL,
                settings TEXT,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()

def get_db_connection():
    """Get a database connection with row factory."""
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    else:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

class SequenceDB:
    @staticmethod
    def create_sequence(name: str, shots: List[Dict], settings: Optional[Dict] = None) -> str:
        """Create a new sequence and return its ID."""
        sequence_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        metadata = {
            "totalShots": len(shots),
            "createdAt": now
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO sequences (id, name, shots, settings, metadata, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                sequence_id,
                name,
                json.dumps(shots),
                json.dumps(settings) if settings else None,
                json.dumps(metadata),
                now,
                now
            ))
        else:
            cursor.execute("""
                INSERT INTO sequences (id, name, shots, settings, metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                sequence_id,
                name,
                json.dumps(shots),
                json.dumps(settings) if settings else None,
                json.dumps(metadata),
                now,
                now
            ))
        
        conn.commit()
        conn.close()
        
        return sequence_id
    
    @staticmethod
    def get_sequence(sequence_id: str) -> Optional[Dict]:
        """Get a sequence by ID."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute("SELECT * FROM sequences WHERE id = %s", (sequence_id,))
        else:
            cursor.execute("SELECT * FROM sequences WHERE id = ?", (sequence_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        # Parse metadata and ensure it has required fields
        metadata = json.loads(row["metadata"]) if row["metadata"] else {}
        
        # Ensure metadata has createdAt (fallback to row created_at if missing or null)
        if "createdAt" not in metadata or metadata["createdAt"] is None:
            metadata["createdAt"] = row["created_at"]
        
        # Ensure metadata has totalShots
        if "totalShots" not in metadata:
            shots = json.loads(row["shots"])
            metadata["totalShots"] = len(shots)

        return {
            "id": row["id"],
            "name": row["name"],
            "shots": json.loads(row["shots"]),
            "settings": json.loads(row["settings"]) if row["settings"] else None,
            "metadata": metadata,
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }
    
    @staticmethod
    def get_all_sequences() -> List[Dict]:
        """Get all sequences with basic info."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, metadata, created_at, updated_at 
            FROM sequences 
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        
        sequences = []
        for row in rows:
            metadata = json.loads(row["metadata"]) if row["metadata"] else {}
            sequences.append({
                "id": row["id"],
                "name": row["name"],
                "totalShots": metadata.get("totalShots", 0),
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"]
            })
        
        return sequences
    
    @staticmethod
    def update_sequence(sequence_id: str, name: Optional[str] = None, 
                       shots: Optional[List[Dict]] = None, 
                       settings: Optional[Dict] = None) -> bool:
        """Update a sequence. Returns True if updated, False if not found."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First check if sequence exists and get current metadata
        if USE_POSTGRES:
            cursor.execute("SELECT metadata FROM sequences WHERE id = %s", (sequence_id,))
        else:
            cursor.execute("SELECT metadata FROM sequences WHERE id = ?", (sequence_id,))
        existing_row = cursor.fetchone()
        if not existing_row:
            conn.close()
            return False
        
        # Parse existing metadata to preserve createdAt
        existing_metadata = json.loads(existing_row["metadata"]) if existing_row["metadata"] else {}
        
        now = datetime.utcnow().isoformat()
        updates = ["updated_at = ?"]
        params = [now]
        
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        
        if shots is not None:
            updates.append("shots = ?")
            params.append(json.dumps(shots))
            
            # Update metadata with new shot count, preserving createdAt
            # Use existing createdAt or fall back to created_at from database
            created_at = existing_metadata.get("createdAt")
            if created_at is None:
                # Get the created_at from the database row
                if USE_POSTGRES:
                    cursor.execute("SELECT created_at FROM sequences WHERE id = %s", (sequence_id,))
                else:
                    cursor.execute("SELECT created_at FROM sequences WHERE id = ?", (sequence_id,))
                db_row = cursor.fetchone()
                created_at = db_row["created_at"] if db_row else now
            
            metadata = {
                "totalShots": len(shots),
                "createdAt": created_at,
                "updatedAt": now
            }
            updates.append("metadata = ?")
            params.append(json.dumps(metadata))
        
        if settings is not None:
            updates.append("settings = ?")
            params.append(json.dumps(settings))
        
        params.append(sequence_id)
        
        if USE_POSTGRES:
            # Convert ? placeholders to %s for PostgreSQL
            placeholders = ', '.join([update.replace('?', '%s') for update in updates])
            cursor.execute(f"""
                UPDATE sequences 
                SET {placeholders}
                WHERE id = %s
            """, params)
        else:
            cursor.execute(f"""
                UPDATE sequences 
                SET {', '.join(updates)}
                WHERE id = ?
            """, params)
        
        conn.commit()
        conn.close()
        
        return True
    
    @staticmethod
    def delete_sequence(sequence_id: str) -> bool:
        """Delete a sequence. Returns True if deleted, False if not found."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if USE_POSTGRES:
            cursor.execute("DELETE FROM sequences WHERE id = %s", (sequence_id,))
        else:
            cursor.execute("DELETE FROM sequences WHERE id = ?", (sequence_id,))
        deleted = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        
        return deleted