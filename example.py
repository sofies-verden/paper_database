#!/usr/bin/env python3
"""
Example usage of the Paper Database API.
This script demonstrates how to use the database programmatically.
"""

from database import Database
from repository import PaperRepository
from models import Paper


def main():
    """Example usage of paper database."""
    # Initialize database
    db = Database("example_papers.db")
    db.initialize_schema()
    repo = PaperRepository(db)

    print("Paper Database - Example Usage\n")

    # Add some example papers
    print("Adding sample papers...")
    paper1 = Paper(
        title="Attention Is All You Need",
        authors="Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin",
        year=2017,
        venue="NeurIPS",
        abstract="The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
        keywords="transformers, attention, neural networks",
        url="https://arxiv.org/abs/1706.03762"
    )
    id1 = repo.create(paper1)
    print(f"Added paper with ID: {id1}")

    paper2 = Paper(
        title="Deep Residual Learning for Image Recognition",
        authors="He, Zhang, Ren, Sun",
        year=2016,
        venue="CVPR",
        abstract="Deeper neural networks are more difficult to train...",
        keywords="resnet, deep learning, computer vision"
    )
    id2 = repo.create(paper2)
    print(f"Added paper with ID: {id2}")

    # List all papers
    print("\nAll papers in database:")
    papers = repo.get_all()
    for paper in papers:
        print(f"  [{paper.id}] {paper.title} ({paper.year}) - {paper.authors}")

    # Search papers
    print("\nSearching for papers about 'attention':")
    results = repo.search(query="attention")
    for paper in results:
        print(f"  [{paper.id}] {paper.title}")

    # Update a paper
    print("\nUpdating paper 1...")
    paper1.id = id1
    paper1.notes = "Groundbreaking paper that introduced the Transformer architecture"
    repo.update(paper1)
    print("Paper updated successfully")

    # Get paper by ID
    print("\nRetrieving paper by ID:")
    retrieved = repo.get_by_id(id1)
    if retrieved:
        print(f"  Title: {retrieved.title}")
        print(f"  Notes: {retrieved.notes}")

    # Count papers
    total = repo.count()
    print(f"\nTotal papers in database: {total}")

    # Clean up
    db.close()
    print("\nExample completed. Database saved as 'example_papers.db'")


if __name__ == "__main__":
    main()
