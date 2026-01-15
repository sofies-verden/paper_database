"""
Repository layer for paper database operations.
Handles all database interactions for papers.
"""

from typing import List, Optional
from models import Paper
from database import Database


class PaperRepository:
    """Repository for paper CRUD operations."""

    def __init__(self, database: Database):
        """Initialize repository.

        Args:
            database: Database instance
        """
        self.db = database

    def create(self, paper: Paper) -> int:
        """Create a new paper in the database.

        Args:
            paper: Paper instance to create

        Returns:
            ID of created paper
        """
        with self.db as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO papers (
                    title, authors, year, venue, abstract, doi, url,
                    pdf_path, keywords, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                paper.title, paper.authors, paper.year, paper.venue,
                paper.abstract, paper.doi, paper.url, paper.pdf_path,
                paper.keywords, paper.notes
            ))
            return cursor.lastrowid

    def get_by_id(self, paper_id: int) -> Optional[Paper]:
        """Get paper by ID.

        Args:
            paper_id: Paper ID

        Returns:
            Paper instance or None if not found
        """
        with self.db as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM papers WHERE id = ?", (paper_id,))
            row = cursor.fetchone()
            return Paper.from_row(row) if row else None

    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Paper]:
        """Get all papers with optional pagination.

        Args:
            limit: Maximum number of papers to return
            offset: Number of papers to skip

        Returns:
            List of Paper instances
        """
        with self.db as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM papers ORDER BY year DESC, title"
            if limit:
                query += f" LIMIT {limit} OFFSET {offset}"
            cursor.execute(query)
            return [Paper.from_row(row) for row in cursor.fetchall()]

    def update(self, paper: Paper) -> bool:
        """Update an existing paper.

        Args:
            paper: Paper instance with updated data

        Returns:
            True if update was successful, False otherwise
        """
        with self.db as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE papers SET
                    title = ?,
                    authors = ?,
                    year = ?,
                    venue = ?,
                    abstract = ?,
                    doi = ?,
                    url = ?,
                    pdf_path = ?,
                    keywords = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
                paper.title, paper.authors, paper.year, paper.venue,
                paper.abstract, paper.doi, paper.url, paper.pdf_path,
                paper.keywords, paper.notes, paper.id
            ))
            return cursor.rowcount > 0

    def delete(self, paper_id: int) -> bool:
        """Delete a paper by ID.

        Args:
            paper_id: Paper ID

        Returns:
            True if deletion was successful, False otherwise
        """
        with self.db as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
            return cursor.rowcount > 0

    def search(
        self,
        query: Optional[str] = None,
        author: Optional[str] = None,
        year: Optional[int] = None,
        venue: Optional[str] = None,
        keywords: Optional[str] = None
    ) -> List[Paper]:
        """Search papers by various criteria.

        Args:
            query: Text to search in title and abstract
            author: Author name to search
            year: Publication year
            venue: Venue name
            keywords: Keywords to search

        Returns:
            List of matching Paper instances
        """
        with self.db as conn:
            cursor = conn.cursor()
            conditions = []
            params = []

            if query:
                conditions.append("(title LIKE ? OR abstract LIKE ?)")
                params.extend([f"%{query}%", f"%{query}%"])

            if author:
                conditions.append("authors LIKE ?")
                params.append(f"%{author}%")

            if year:
                conditions.append("year = ?")
                params.append(year)

            if venue:
                conditions.append("venue LIKE ?")
                params.append(f"%{venue}%")

            if keywords:
                conditions.append("keywords LIKE ?")
                params.append(f"%{keywords}%")

            where_clause = " AND ".join(conditions) if conditions else "1=1"
            query_sql = f"SELECT * FROM papers WHERE {where_clause} ORDER BY year DESC, title"

            cursor.execute(query_sql, params)
            return [Paper.from_row(row) for row in cursor.fetchall()]

    def count(self) -> int:
        """Get total number of papers in database.

        Returns:
            Number of papers
        """
        with self.db as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM papers")
            return cursor.fetchone()['count']
