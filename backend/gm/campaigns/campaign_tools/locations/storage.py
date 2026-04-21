import os
import uuid
from fastapi import UploadFile, HTTPException, status

# Resolved at import time: backend/uploads/maps/
_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_BASE_DIR = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "..", "..", "uploads", "maps"))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


async def save_map_image(file: UploadFile, campaign_id: int, location_id: int) -> str:
    """
    Validate and persist an uploaded map image.
    Returns a relative path string suitable for storing in the DB and building URLs.
    Swap this function's internals for cloud storage (R2/S3) when moving to production.
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
            detail="File size exceeds the 100 MB limit"
        )

    dir_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(location_id))
    os.makedirs(dir_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    full_path = os.path.join(dir_path, filename)

    with open(full_path, "wb") as f:
        f.write(contents)

    return f"uploads/maps/{campaign_id}/{location_id}/{filename}"


def delete_map_image(image_path: str) -> None:
    """Remove an image file from local storage. No-ops silently if missing."""
    backend_dir = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "..", ".."))
    full_path = os.path.join(backend_dir, image_path)
    if os.path.exists(full_path):
        os.remove(full_path)
