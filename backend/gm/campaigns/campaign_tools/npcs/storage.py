import os
import uuid
from fastapi import UploadFile, HTTPException, status

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_BASE_DIR = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "..", "..", "uploads", "npcs"))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_npc_image(file: UploadFile, campaign_id: int, npc_id: int) -> str:
    """
    Validate and persist an uploaded NPC portrait image.
    Returns a relative path suitable for storing in the DB and building URLs.
    Swap internals for cloud storage (R2/S3) when moving to production.
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

    dir_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(npc_id))
    os.makedirs(dir_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    full_path = os.path.join(dir_path, filename)

    with open(full_path, "wb") as f:
        f.write(contents)

    return f"uploads/npcs/{campaign_id}/{npc_id}/{filename}"


def delete_npc_image(image_path: str) -> None:
    """Remove an NPC portrait from local storage. No-ops silently if missing."""
    backend_dir = os.path.normpath(os.path.join(_MODULE_DIR, "..", "..", "..", ".."))
    full_path = os.path.join(backend_dir, image_path)
    if os.path.exists(full_path):
        os.remove(full_path)
