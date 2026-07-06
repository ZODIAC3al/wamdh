import textwrap
from PIL import Image

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

def extract_text_from_pdf(file_path: str) -> str:
    if fitz:
        try:
            doc = fitz.open(file_path)
            return "\n".join(page.get_text() for page in doc)
        except Exception as e:
            return f"Failed to extract PDF text: {str(e)}"
    return "PyMuPDF library is not installed. Dummy text: Organic Chemistry and basic vector space calculus concepts."

def extract_text_from_image(file_path: str) -> str:
    if pytesseract:
        try:
            img = Image.open(file_path)
            return pytesseract.image_to_string(img)
        except Exception as e:
            return f"Failed to perform OCR on image: {str(e)}"
    return "Tesseract OCR is not installed. Dummy OCR text: Introduction to sorting algorithms and bubble sort complexity."

def clean_text(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n".join(lines)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    if not words:
        return []
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
        if chunk_size - overlap <= 0:
            break
    return chunks
