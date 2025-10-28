import typer
import json
from datetime import datetime
from pypdf import PdfReader, PdfWriter
from pathlib import Path
from typing import List, Optional, Tuple, Dict
import re

app = typer.Typer(help="PDF manipulation tool using PyPDF")


@app.command()
def info(
    file_path: Path = typer.Argument(..., help="Path to PDF file"),
):
    """Get metadata and information about a PDF file."""
    try:
        reader = PdfReader(file_path)
        typer.echo(f"File: {file_path}")
        typer.echo(f"Pages: {len(reader.pages)}")
        typer.echo(f"Encrypted: {'Yes' if reader.is_encrypted else 'No'}")

        if reader.metadata:
            typer.echo("\nMetadata:")
            for key, value in reader.metadata.items():
                typer.echo(f"  {key}: {value}")
        else:
            typer.echo("\nNo metadata available")

    except Exception as e:
        typer.echo(f"Error reading PDF: {e}", err=True)
        raise typer.Exit(1)


@app.command()
def extract_text(
    file_path: Path = typer.Argument(..., help="Path to PDF file"),
    page_number: Optional[int] = typer.Argument(
        None, help="Specific page number (extract all if not specified)"
    ),
    output_file: Optional[Path] = typer.Option(
        None, "--output", "-o", help="Output file (default: stdout)"
    ),
):
    """Extract text from PDF (all pages or specific page)."""
    try:
        reader = PdfReader(file_path)

        if page_number is not None:
            if page_number < 1 or page_number > len(reader.pages):
                typer.echo(
                    f"Invalid page number. Must be between 1 and {len(reader.pages)}",
                    err=True,
                )
                raise typer.Exit(1)
            pages = [reader.pages[page_number - 1]]
        else:
            pages = reader.pages

        extracted_text = ""
        for i, page in enumerate(pages, start=1):
            if page_number is None:
                extracted_text += f"\n--- Page {i} ---\n"
            extracted_text += page.extract_text() + "\n"

        if output_file:
            output_file.write_text(extracted_text)
            typer.echo(f"Text extracted to {output_file}")
        else:
            typer.echo(extracted_text)

    except Exception as e:
        typer.echo(f"Error extracting text: {e}", err=True)
        raise typer.Exit(1)


@app.command()
def test_regex(
    input_dir: Path = typer.Argument(..., help="Directory containing split text files"),
    pages: str = typer.Argument(..., help="Page numbers to test (e.g., '1,3,5-8,10')"),
    output_file: Path = typer.Option(
        None, "--output", "-o", help="Save results to JSON file"
    ),
):
    """Test the regex pattern on selected pages and show detailed results."""
    try:
        # Parse page ranges
        page_numbers = parse_page_ranges(pages)

        # Get all text files in the directory
        text_files = list(input_dir.glob("*.txt"))

        # Create a mapping of page numbers to files
        page_file_map = {}
        for file_path in text_files:
            page_num = extract_page_number(file_path.stem)
            if page_num is not None:
                page_file_map[page_num] = file_path

        typer.echo(f"Testing regex pattern on {len(page_numbers)} pages...")
        typer.echo(f"Pattern: ([^\/\n]*)(\/(?:[^\/]*)\/)")
        typer.echo("=" * 60)

        total_matches = 0
        results = {
            "metadata": {
                "regex_pattern": "([^\/\n]*)(\/(?:[^\/]*)\/)",
                "pages_requested": pages,
                "pages_found": [],
                "total_matches": 0,
                "timestamp": datetime.now().isoformat(),
                "input_directory": str(input_dir),
            },
            "pages": {},
        }

        for page_num in page_numbers:
            if page_num in page_file_map:
                file_path = page_file_map[page_num]
                results["metadata"]["pages_found"].append(page_num)

                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                vocabulary = extract_vocabulary_with_regex(content)

                # Store page results in JSON structure
                page_results = {
                    "file_path": str(file_path),
                    "file_name": file_path.name,
                    "match_count": len(vocabulary),
                    "vocabulary": [
                        {
                            "word": word,
                            "pronunciation": pron,
                            "full_match": f"{word} /{pron}/",
                        }
                        for word, pron in vocabulary
                    ],
                }
                results["pages"][str(page_num)] = page_results

                # Display to console
                typer.echo(f"\nPage {page_num}: {len(vocabulary)} matches")
                typer.echo("-" * 40)

                for i, (word, pron) in enumerate(vocabulary, 1):
                    typer.echo(f"{i:2d}. Word: '{word}'")
                    typer.echo(f"    Pronunciation: /{pron}/")

                total_matches += len(vocabulary)

        results["metadata"]["total_matches"] = total_matches

        # Save to JSON file if output specified
        if output_file:
            try:
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
                typer.echo(f"\n✓ Results saved to: {output_file}")
            except Exception as e:
                typer.echo(f"✗ Error saving to JSON: {e}", err=True)

        # Console summary
        typer.echo(f"\n{'=' * 60}")
        typer.echo(f"Total matches across all pages: {total_matches}")

        if output_file:
            typer.echo(f"JSON output: {output_file}")

    except Exception as e:
        typer.echo(f"Error testing regex: {e}", err=True)
        raise typer.Exit(1)


@app.command()
def split(
    file_path: Path = typer.Argument(..., help="Path to PDF file"),
    output_dir: Path = typer.Option(
        Path("./split_pages"), help="Output directory for individual pages"
    ),
    pages: str = typer.Option(
        None, help="Specific pages to extract (e.g., '1,3,5-8,10')"
    ),
):
    """Split PDF into individual pages as text files."""
    try:
        if not file_path.exists() or not file_path.is_file():
            typer.echo(f"Error: File '{file_path}' does not exist", err=True)
            raise typer.Exit(1)

        reader = PdfReader(file_path)
        total_pages = len(reader.pages)

        typer.echo(f"PDF has {total_pages} total pages")  # Debug info

        if total_pages == 0:
            typer.echo("Error: PDF file contains no pages", err=True)
            raise typer.Exit(1)

        output_dir.mkdir(exist_ok=True)
        base_name = file_path.stem

        # Parse page ranges if provided
        if pages:
            page_numbers = parse_page_ranges(pages)
            if not page_numbers:
                typer.echo("Error: No valid page numbers provided", err=True)
                raise typer.Exit(1)

            # Validate page numbers are within range
            invalid_pages = [p for p in page_numbers if p < 1 or p > total_pages]
            if invalid_pages:
                typer.echo(
                    f"Error: Pages {invalid_pages} are out of range (1-{total_pages})",
                    err=True,
                )
                raise typer.Exit(1)

            typer.echo(f"Extracting pages: {page_numbers}")  # Debug info
        else:
            # If no pages specified, extract all pages
            page_numbers = list(range(1, total_pages + 1))

        # Extract only the specified pages
        extracted_count = 0
        for page_num in page_numbers:
            # Convert to 0-based index for PdfReader
            page_index = page_num - 1
            page = reader.pages[page_index]

            # Extract text from the page
            text = page.extract_text()

            # Write text to file
            output_file = (
                output_dir / f"{base_name}_page_{page_num:03d}.txt"
            )  # Use 3-digit padding
            try:
                with open(output_file, "w", encoding="utf-8") as f:
                    f.write(text)
                extracted_count += 1
            except Exception as e:
                typer.echo(f"Error writing {output_file}: {e}", err=True)
                continue

        typer.echo(
            f"Successfully extracted {extracted_count} pages into text files in {output_dir}"
        )

    except Exception as e:
        typer.echo(f"Error splitting PDF: {e}", err=True)
        raise typer.Exit(1)


def extract_vocabulary_with_regex(content: str) -> List[Tuple[str, str]]:
    """
    Extract vocabulary words and pronunciations using your regex pattern.
    Handles multi-line pronunciations properly.
    """
    # Pattern that captures word followed by pronunciation in slashes
    # Uses re.MULTILINE flag and more precise boundaries
    pattern = r"^([a-zA-Z][^\/\n]*?)\s+/([^\/]+?)/\s*$"

    vocabulary = []

    matches = re.findall(pattern, content, re.MULTILINE)
    for word, pronunciation in matches:
        word = word.strip()
        pronunciation = pronunciation.strip()

        # Clean up any remaining newlines within the pronunciation
        pronunciation = re.sub(r"\s*\n\s*", " ", pronunciation)

        if word and pronunciation:
            vocabulary.append((word, pronunciation))

    return vocabulary


@app.command()
def read_pages(
    input_dir: Path = typer.Argument(..., help="Directory containing split text files"),
    pages: str = typer.Argument(..., help="Page numbers to read (e.g., '1,3,5-8,10')"),
):
    """Read selected pages from split text files in a directory."""
    try:
        if not input_dir.exists() or not input_dir.is_dir():
            typer.echo(f"Error: Directory '{input_dir}' does not exist", err=True)
            raise typer.Exit(1)

        # Parse page ranges
        page_numbers = parse_page_ranges(pages)
        if not page_numbers:
            typer.echo("Error: No valid page numbers provided", err=True)
            raise typer.Exit(1)

        # Get all text files in the directory and show what we found
        text_files = list(input_dir.glob("*.txt"))
        typer.echo(f"Found {len(text_files)} text files in directory")  # Debug info

        # Create a mapping of page numbers to files
        page_file_map = {}
        for file_path in text_files:
            page_num = extract_page_number(file_path.stem)
            if page_num is not None:
                page_file_map[page_num] = file_path
                typer.echo(f"  Page {page_num}: {file_path.name}")  # Debug info

        if not page_file_map:
            typer.echo(f"No valid text files found in '{input_dir}'", err=True)
            raise typer.Exit(1)

        # Read and display requested pages
        found_pages = 0
        for page_num in page_numbers:
            if page_num in page_file_map:
                file_path = page_file_map[page_num]
                typer.echo(f"\n{'=' * 50}")
                typer.echo(f"Page {page_num}: {file_path.name}")
                typer.echo(f"{'=' * 50}")

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        if content.strip():
                            typer.echo(content)
                        else:
                            typer.echo("(Empty page)")
                    found_pages += 1
                except Exception as e:
                    typer.echo(f"Error reading {file_path}: {e}", err=True)
            else:
                typer.echo(f"Warning: Page {page_num} not found in directory", err=True)

        typer.echo(
            f"\nSuccessfully displayed {found_pages} out of {len(page_numbers)} requested pages"
        )

    except Exception as e:
        typer.echo(f"Error reading pages: {e}", err=True)
        raise typer.Exit(1)


def parse_page_ranges(page_str: str) -> list[int]:
    """Parse page range string like '1,3,5-8,10' into list of page numbers."""
    page_numbers = []

    for part in page_str.split(","):
        part = part.strip()
        if "-" in part:
            # Handle range (e.g., "5-8")
            start_end = part.split("-")
            if (
                len(start_end) == 2
                and start_end[0].isdigit()
                and start_end[1].isdigit()
            ):
                start = int(start_end[0])
                end = int(start_end[1])
                page_numbers.extend(range(start, end + 1))
        else:
            # Handle single page (e.g., "1")
            if part.isdigit():
                page_numbers.append(int(part))

    # Remove duplicates and sort
    return sorted(set(page_numbers))


def extract_page_number(filename: str) -> int:
    """Extract page number from filename like 'document_page_1'."""
    # Look for numbers in the filename
    import re

    numbers = re.findall(r"\d+", filename)
    if numbers:
        return int(numbers[-1])  # Use the last number found (likely the page number)
    return 0  # Fallback for sorting


if __name__ == "__main__":
    app()
