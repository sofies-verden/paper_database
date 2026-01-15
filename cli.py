#!/usr/bin/env python3
"""
Command-line interface for paper database management.
"""

import argparse
import sys
from typing import Optional
from database import Database
from repository import PaperRepository
from models import Paper


def format_paper(paper: Paper, detailed: bool = False) -> str:
    """Format paper for display.

    Args:
        paper: Paper to format
        detailed: Show full details

    Returns:
        Formatted string
    """
    if detailed:
        lines = [
            f"ID: {paper.id}",
            f"Title: {paper.title}",
            f"Authors: {paper.authors}",
        ]
        if paper.year:
            lines.append(f"Year: {paper.year}")
        if paper.venue:
            lines.append(f"Venue: {paper.venue}")
        if paper.doi:
            lines.append(f"DOI: {paper.doi}")
        if paper.url:
            lines.append(f"URL: {paper.url}")
        if paper.pdf_path:
            lines.append(f"PDF: {paper.pdf_path}")
        if paper.keywords:
            lines.append(f"Keywords: {paper.keywords}")
        if paper.abstract:
            lines.append(f"Abstract: {paper.abstract}")
        if paper.notes:
            lines.append(f"Notes: {paper.notes}")
        return "\n".join(lines)
    else:
        year_str = f" ({paper.year})" if paper.year else ""
        return f"[{paper.id}] {paper.title}{year_str} - {paper.authors}"


def add_paper(repo: PaperRepository, args) -> None:
    """Add a new paper to the database."""
    paper = Paper(
        title=args.title,
        authors=args.authors,
        year=args.year,
        venue=args.venue,
        abstract=args.abstract,
        doi=args.doi,
        url=args.url,
        pdf_path=args.pdf_path,
        keywords=args.keywords,
        notes=args.notes
    )
    paper_id = repo.create(paper)
    print(f"Paper added successfully with ID: {paper_id}")


def list_papers(repo: PaperRepository, args) -> None:
    """List all papers in the database."""
    papers = repo.get_all(limit=args.limit, offset=args.offset)
    if not papers:
        print("No papers found in database.")
        return

    total = repo.count()
    print(f"Showing {len(papers)} of {total} papers:\n")
    for paper in papers:
        print(format_paper(paper, detailed=args.detailed))
        print()


def show_paper(repo: PaperRepository, args) -> None:
    """Show details of a specific paper."""
    paper = repo.get_by_id(args.id)
    if paper:
        print(format_paper(paper, detailed=True))
    else:
        print(f"Paper with ID {args.id} not found.", file=sys.stderr)
        sys.exit(1)


def search_papers(repo: PaperRepository, args) -> None:
    """Search papers by various criteria."""
    papers = repo.search(
        query=args.query,
        author=args.author,
        year=args.year,
        venue=args.venue,
        keywords=args.keywords
    )

    if not papers:
        print("No papers found matching the search criteria.")
        return

    print(f"Found {len(papers)} papers:\n")
    for paper in papers:
        print(format_paper(paper, detailed=args.detailed))
        print()


def update_paper(repo: PaperRepository, args) -> None:
    """Update an existing paper."""
    paper = repo.get_by_id(args.id)
    if not paper:
        print(f"Paper with ID {args.id} not found.", file=sys.stderr)
        sys.exit(1)

    # Update fields if provided
    if args.title:
        paper.title = args.title
    if args.authors:
        paper.authors = args.authors
    if args.year:
        paper.year = args.year
    if args.venue:
        paper.venue = args.venue
    if args.abstract:
        paper.abstract = args.abstract
    if args.doi:
        paper.doi = args.doi
    if args.url:
        paper.url = args.url
    if args.pdf_path:
        paper.pdf_path = args.pdf_path
    if args.keywords:
        paper.keywords = args.keywords
    if args.notes:
        paper.notes = args.notes

    if repo.update(paper):
        print(f"Paper {args.id} updated successfully.")
    else:
        print(f"Failed to update paper {args.id}.", file=sys.stderr)
        sys.exit(1)


def delete_paper(repo: PaperRepository, args) -> None:
    """Delete a paper from the database."""
    if repo.delete(args.id):
        print(f"Paper {args.id} deleted successfully.")
    else:
        print(f"Paper with ID {args.id} not found.", file=sys.stderr)
        sys.exit(1)


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="Academic Paper Database Management System"
    )
    parser.add_argument(
        "--db", default="papers.db",
        help="Database file path (default: papers.db)"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Add paper command
    add_parser = subparsers.add_parser("add", help="Add a new paper")
    add_parser.add_argument("title", help="Paper title")
    add_parser.add_argument("authors", help="Paper authors (comma-separated)")
    add_parser.add_argument("--year", type=int, help="Publication year")
    add_parser.add_argument("--venue", help="Publication venue")
    add_parser.add_argument("--abstract", help="Paper abstract")
    add_parser.add_argument("--doi", help="DOI")
    add_parser.add_argument("--url", help="URL")
    add_parser.add_argument("--pdf-path", help="Path to PDF file")
    add_parser.add_argument("--keywords", help="Keywords (comma-separated)")
    add_parser.add_argument("--notes", help="Additional notes")

    # List papers command
    list_parser = subparsers.add_parser("list", help="List all papers")
    list_parser.add_argument("--limit", type=int, help="Limit number of results")
    list_parser.add_argument("--offset", type=int, default=0, help="Offset for pagination")
    list_parser.add_argument("-d", "--detailed", action="store_true", help="Show detailed information")

    # Show paper command
    show_parser = subparsers.add_parser("show", help="Show paper details")
    show_parser.add_argument("id", type=int, help="Paper ID")

    # Search papers command
    search_parser = subparsers.add_parser("search", help="Search papers")
    search_parser.add_argument("--query", help="Search in title and abstract")
    search_parser.add_argument("--author", help="Search by author")
    search_parser.add_argument("--year", type=int, help="Filter by year")
    search_parser.add_argument("--venue", help="Search by venue")
    search_parser.add_argument("--keywords", help="Search by keywords")
    search_parser.add_argument("-d", "--detailed", action="store_true", help="Show detailed information")

    # Update paper command
    update_parser = subparsers.add_parser("update", help="Update a paper")
    update_parser.add_argument("id", type=int, help="Paper ID")
    update_parser.add_argument("--title", help="New title")
    update_parser.add_argument("--authors", help="New authors")
    update_parser.add_argument("--year", type=int, help="New year")
    update_parser.add_argument("--venue", help="New venue")
    update_parser.add_argument("--abstract", help="New abstract")
    update_parser.add_argument("--doi", help="New DOI")
    update_parser.add_argument("--url", help="New URL")
    update_parser.add_argument("--pdf-path", help="New PDF path")
    update_parser.add_argument("--keywords", help="New keywords")
    update_parser.add_argument("--notes", help="New notes")

    # Delete paper command
    delete_parser = subparsers.add_parser("delete", help="Delete a paper")
    delete_parser.add_argument("id", type=int, help="Paper ID")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Initialize database
    db = Database(args.db)
    db.initialize_schema()
    repo = PaperRepository(db)

    # Execute command
    try:
        if args.command == "add":
            add_paper(repo, args)
        elif args.command == "list":
            list_papers(repo, args)
        elif args.command == "show":
            show_paper(repo, args)
        elif args.command == "search":
            search_papers(repo, args)
        elif args.command == "update":
            update_paper(repo, args)
        elif args.command == "delete":
            delete_paper(repo, args)
    finally:
        db.close()


if __name__ == "__main__":
    main()
