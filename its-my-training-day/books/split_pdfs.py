"""
PDF Chapter Splitter and Organizer

This script:
1. Reads each PDF in the ebooks folder
2. Extracts chapters based on PDF bookmarks/outlines
3. Creates a subdirectory for each book
4. Saves the full PDF and individual chapter PDFs in that subdirectory
"""

import os
import re
from pathlib import Path

try:
    import pypdf
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("Installing pypdf...")
    os.system("pip install pypdf")
    from pypdf import PdfReader, PdfWriter


def sanitize_filename(name: str) -> str:
    """Remove invalid characters from filename."""
    # Remove control characters (including \r, \n, \t, null bytes)
    name = re.sub(r'[\x00-\x1f\x7f]', '', name)
    # Remove or replace invalid Windows filename characters
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = name.strip('. ')
    # Limit length
    if len(name) > 80:
        name = name[:80]
    return name or "untitled"


def get_book_name(pdf_path: Path) -> str:
    """Extract clean book name from PDF filename."""
    name = pdf_path.stem
    # Remove common suffixes like (1), (2), etc.
    name = re.sub(r'\s*\(\d+\)\s*$', '', name)
    return sanitize_filename(name)


def extract_bookmarks(reader: PdfReader) -> list:
    """
    Extract only top-level bookmarks/outline from PDF.
    Returns list of (title, page_number) tuples.
    """
    bookmarks = []
    
    def process_outline(outline, level=0):
        if isinstance(outline, list):
            for item in outline:
                process_outline(item, level)
        else:
            try:
                title = outline.title
                page_num = reader.get_destination_page_number(outline)
                if page_num is not None:
                    bookmarks.append((title, page_num, level))
            except Exception:
                pass
    
    try:
        if reader.outline:
            # Only process top-level items (not nested lists)
            for item in reader.outline:
                if not isinstance(item, list):
                    try:
                        title = item.title
                        page_num = reader.get_destination_page_number(item)
                        if page_num is not None:
                            bookmarks.append((title, page_num, 0))
                    except Exception:
                        pass
    except Exception:
        pass
    
    return bookmarks


def split_pdf_by_page_chunks(reader: PdfReader, output_dir: Path, chunk_size: int = 50) -> bool:
    """
    Split a PDF into chunks of specified page size.
    Used as fallback when no bookmarks are found.
    """
    total_pages = len(reader.pages)
    num_chunks = (total_pages + chunk_size - 1) // chunk_size  # Ceiling division
    
    print(f"  Splitting into {num_chunks} sections of ~{chunk_size} pages each")
    
    for i in range(num_chunks):
        start_page = i * chunk_size
        end_page = min((i + 1) * chunk_size, total_pages)
        
        writer = PdfWriter()
        for page_num in range(start_page, end_page):
            writer.add_page(reader.pages[page_num])
        
        # Create section filename
        section_num = str(i + 1).zfill(2)
        section_filename = f"{section_num} - Pages {start_page + 1}-{end_page}.pdf"
        section_path = output_dir / section_filename
        
        try:
            with open(section_path, 'wb') as f:
                writer.write(f)
        except Exception as e:
            print(f"    Error writing section {section_num}: {e}")
    
    return True


def split_pdf_by_chapters(pdf_path: Path, output_dir: Path) -> bool:
    """
    Split a PDF into chapters based on bookmarks.
    Falls back to splitting every 50 pages if no bookmarks found.
    Returns True if chapters were extracted, False otherwise.
    """
    try:
        reader = PdfReader(str(pdf_path))
        total_pages = len(reader.pages)
        
        if total_pages == 0:
            print(f"  Skipping: No pages found")
            return False
        
        bookmarks = extract_bookmarks(reader)
        
        # Filter to only level 0 bookmarks
        chapters = [(title, page) for title, page, level in bookmarks if level == 0]
        
        if not chapters:
            print(f"  No bookmarks found - splitting by 50-page sections")
            return split_pdf_by_page_chunks(reader, output_dir, chunk_size=50)
        
        # Limit to reasonable number of chapters
        if len(chapters) > 50:
            print(f"  Found {len(chapters)} bookmarks, limiting to major sections")
            # Keep only chapters that are reasonably spaced
            filtered = [chapters[0]]
            for title, page in chapters[1:]:
                if page - filtered[-1][1] >= 5:  # At least 5 pages apart
                    filtered.append((title, page))
            chapters = filtered[:30]  # Max 30 chapters
        
        print(f"  Extracting {len(chapters)} chapters")
        
        # Sort by page number
        chapters.sort(key=lambda x: x[1])
        
        # Create chapter PDFs
        for i, (title, start_page) in enumerate(chapters):
            # Determine end page
            if i + 1 < len(chapters):
                end_page = chapters[i + 1][1]
            else:
                end_page = total_pages
            
            # Skip if chapter has no pages
            if start_page >= end_page:
                continue
            
            # Create chapter PDF
            writer = PdfWriter()
            for page_num in range(start_page, end_page):
                if page_num < total_pages:
                    writer.add_page(reader.pages[page_num])
            
            if len(writer.pages) == 0:
                continue
            
            # Create chapter filename
            chapter_num = str(i + 1).zfill(2)
            chapter_title = sanitize_filename(title)
            chapter_filename = f"{chapter_num} - {chapter_title}.pdf"
            chapter_path = output_dir / chapter_filename
            
            try:
                with open(chapter_path, 'wb') as f:
                    writer.write(f)
            except Exception as e:
                print(f"    Error writing chapter {chapter_num}: {e}")
        
        return True
        
    except Exception as e:
        print(f"  Error: {e}")
        return False


def process_ebooks(ebooks_dir: Path):
    """Process all PDFs in the ebooks directory."""
    # Find PDFs in root ebooks dir (not yet processed)
    root_pdfs = list(ebooks_dir.glob("*.pdf"))
    
    # Find PDFs in subdirectories that may need re-processing
    subdir_pdfs = []
    for subdir in ebooks_dir.iterdir():
        if subdir.is_dir():
            # Check if subdirectory has only the original PDF (no chapters split yet)
            pdfs_in_subdir = list(subdir.glob("*.pdf"))
            if len(pdfs_in_subdir) == 1:
                # Only the original PDF exists, needs processing
                subdir_pdfs.append(pdfs_in_subdir[0])
    
    all_pdfs = root_pdfs + subdir_pdfs
    print(f"Found {len(all_pdfs)} PDF files to process\n")
    
    for i, pdf_path in enumerate(all_pdfs, 1):
        book_name = get_book_name(pdf_path)
        print(f"[{i}/{len(all_pdfs)}] Processing: {book_name}")
        
        # Check if PDF is already in a subdirectory
        if pdf_path.parent == ebooks_dir:
            # PDF is in root, create subdirectory and move it
            book_dir = ebooks_dir / book_name
            book_dir.mkdir(exist_ok=True)
            new_pdf_path = book_dir / pdf_path.name
            pdf_path.rename(new_pdf_path)
            pdf_path = new_pdf_path
        else:
            # PDF is already in a subdirectory
            book_dir = pdf_path.parent
        
        # Split into chapters
        split_pdf_by_chapters(pdf_path, book_dir)
        print()


def main():
    script_dir = Path(__file__).parent
    ebooks_dir = script_dir / "ebooks"
    
    if not ebooks_dir.exists():
        print(f"Error: {ebooks_dir} not found")
        return
    
    print("=" * 60)
    print("PDF Chapter Splitter and Organizer")
    print("=" * 60 + "\n")
    
    process_ebooks(ebooks_dir)
    
    print("=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
