import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_BASE_DIR = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "..", "..", "uploads", "sessions"))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_session_image(file: UploadFile, campaign_id: int, session_id: int) -> str:
    """Save an uploaded image to the session directory. Returns the relative URL path."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, and GIF images are allowed",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit",
        )

    dir_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(session_id))
    os.makedirs(dir_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    full_path = os.path.join(dir_path, filename)

    with open(full_path, "wb") as f:
        f.write(contents)

    return f"uploads/sessions/{campaign_id}/{session_id}/{filename}"


def delete_session_image_file(campaign_id: int, session_id: int, filename: str) -> bool:
    """Delete a single image file. Returns True if deleted, False if not found."""
    full_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(session_id), filename)
    if os.path.exists(full_path):
        os.remove(full_path)
        return True
    return False


def delete_session_images_dir(campaign_id: int, session_id: int) -> None:
    """Remove all images for a session (called on session delete)."""
    dir_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(session_id))
    if os.path.exists(dir_path):
        shutil.rmtree(dir_path)
