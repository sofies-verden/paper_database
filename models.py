"""
Data models and operations for papers.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime
import sqlite3


@dataclass
class Paper:
    """Academic paper data model."""

    title: str
    authors: str
    year: Optional[int] = None
    venue: Optional[str] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    pdf_path: Optional[str] = None
    keywords: Optional[str] = None
    notes: Optional[str] = None
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert paper to dictionary.

        Returns:
            Dictionary representation of paper
        """
        return {
            'id': self.id,
            'title': self.title,
            'authors': self.authors,
            'year': self.year,
            'venue': self.venue,
            'abstract': self.abstract,
            'doi': self.doi,
            'url': self.url,
            'pdf_path': self.pdf_path,
            'keywords': self.keywords,
            'notes': self.notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> 'Paper':
        """Create Paper from database row.

        Args:
            row: SQLite row object

        Returns:
            Paper instance
        """
        return cls(
            id=row['id'],
            title=row['title'],
            authors=row['authors'],
            year=row['year'],
            venue=row['venue'],
            abstract=row['abstract'],
            doi=row['doi'],
            url=row['url'],
            pdf_path=row['pdf_path'],
            keywords=row['keywords'],
            notes=row['notes'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
