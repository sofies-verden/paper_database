# Paper Database

A simple, lightweight academic paper management system built with Python and SQLite.

## Features

- **CRUD Operations**: Create, read, update, and delete academic papers
- **Search & Filter**: Search papers by title, author, year, venue, and keywords
- **CLI Interface**: Easy-to-use command-line interface for all operations
- **Metadata Management**: Store comprehensive paper metadata including:
  - Title, authors, year, venue
  - Abstract, DOI, URL
  - PDF file path
  - Keywords and notes
  - Automatic timestamps

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd paper_database
```

2. Install dependencies (Python 3.7+ required):
```bash
pip install -r requirements.txt
```

The application uses only Python standard library, so no external dependencies are required.

## Usage

### Initialize Database

The database is automatically initialized on first use. By default, it creates a `papers.db` file in the current directory.

### Add a Paper

```bash
python cli.py add "Attention Is All You Need" "Vaswani et al." \
    --year 2017 \
    --venue "NeurIPS" \
    --abstract "The dominant sequence transduction models..." \
    --keywords "transformers, attention, neural networks"
```

### List All Papers

```bash
# List all papers (brief view)
python cli.py list

# List with detailed information
python cli.py list --detailed

# List with pagination
python cli.py list --limit 10 --offset 0
```

### Show Paper Details

```bash
python cli.py show 1
```

### Search Papers

```bash
# Search by text in title/abstract
python cli.py search --query "machine learning"

# Search by author
python cli.py search --author "Hinton"

# Search by year
python cli.py search --year 2020

# Search by venue
python cli.py search --venue "NeurIPS"

# Search by keywords
python cli.py search --keywords "deep learning"

# Combine multiple criteria
python cli.py search --author "LeCun" --year 2015 --detailed
```

### Update a Paper

```bash
python cli.py update 1 \
    --title "New Title" \
    --notes "Important paper for my research"
```

### Delete a Paper

```bash
python cli.py delete 1
```

### Custom Database Location

```bash
python cli.py --db /path/to/my/papers.db list
```

## Database Schema

The `papers` table contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| title | TEXT | Paper title (required) |
| authors | TEXT | Paper authors (required) |
| year | INTEGER | Publication year |
| venue | TEXT | Publication venue (conference/journal) |
| abstract | TEXT | Paper abstract |
| doi | TEXT | Digital Object Identifier |
| url | TEXT | URL to paper |
| pdf_path | TEXT | Path to local PDF file |
| keywords | TEXT | Comma-separated keywords |
| notes | TEXT | Personal notes |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Architecture

The project is organized into several modules:

- `database.py`: Database connection and initialization
- `models.py`: Data models (Paper class)
- `repository.py`: Data access layer with CRUD operations
- `cli.py`: Command-line interface

## Examples

### Building a Reading List

```bash
# Add papers to your reading list
python cli.py add "Deep Learning" "Goodfellow, Bengio, Courville" \
    --year 2016 --keywords "textbook, deep learning"

python cli.py add "Neural Networks for Pattern Recognition" "Christopher Bishop" \
    --year 1995 --keywords "textbook, neural networks"

# Search for textbooks
python cli.py search --keywords "textbook"

# Add notes after reading
python cli.py update 1 --notes "Excellent introduction to deep learning fundamentals"
```

### Managing Conference Papers

```bash
# Add papers from a conference
python cli.py add "BERT: Pre-training of Deep Bidirectional Transformers" \
    "Devlin et al." --year 2019 --venue "NAACL"

# Search papers from specific venue
python cli.py search --venue "NAACL" --detailed

# Track local PDFs
python cli.py update 1 --pdf-path "/papers/bert_2019.pdf"
```

## Future Enhancements

Potential features for future development:

- BibTeX import/export
- PDF metadata extraction
- Citation graph visualization
- Tags/collections for organizing papers
- Full-text search in PDFs
- Web interface
- Integration with academic databases (arXiv, Google Scholar)
- Duplicate detection

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
