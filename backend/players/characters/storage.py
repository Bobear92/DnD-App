import os
import uuid
from fastapi import UploadFile, HTTPException, status

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_BASE_DIR = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "uploads", "characters"))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_character_image(file: UploadFile, character_id: int) -> str:
    """
    Validate and persist an uploaded character portrait image.
    Returns a relative path suitable for storing in the DB and building URLs.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit"
        )

    dir_path = os.path.join(UPLOAD_BASE_DIR, str(character_id))
    os.makedirs(dir_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    full_path = os.path.join(dir_path, filename)

    with open(full_path, "wb") as f:
        f.write(contents)

    return f"uploads/characters/{character_id}/{filename}"


def delete_character_image_file(image_path: str) -> None:
    """Remove a character portrait from local storage. No-ops silently if missing."""
    backend_dir = os.path.normpath(os.path.join(_MODULE_DIR, "..", ".."))
    full_path = os.path.join(backend_dir, image_path)
    if os.path.exists(full_path):
        os.remove(full_path)
