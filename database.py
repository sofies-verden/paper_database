"""
Database management for paper database system.
Handles SQLite database initialization and connection management.
"""

import sqlite3
from pathlib import Path
from typing import Optional


class Database:
    """SQLite database connection manager."""

    def __init__(self, db_path: str = "papers.db"):
        """Initialize database connection.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self) -> sqlite3.Connection:
        """Establish database connection.

        Returns:
            SQLite connection object
        """
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
        return self.conn

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None

    def initialize_schema(self):
        """Create database tables if they don't exist."""
        conn = self.connect()
        cursor = conn.cursor()

        # Create papers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                authors TEXT NOT NULL,
                year INTEGER,
                venue TEXT,
                abstract TEXT,
                doi TEXT,
                url TEXT,
                pdf_path TEXT,
                keywords TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create index for faster searches
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_title ON papers(title)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_authors ON papers(authors)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_year ON papers(year)
        """)

        conn.commit()

    def __enter__(self):
        """Context manager entry."""
        return self.connect()

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if self.conn:
            if exc_type is None:
                self.conn.commit()
            else:
                self.conn.rollback()
