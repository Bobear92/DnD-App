"""Shared local storage for uploaded music/audio files.

Used by characters, NPCs, and session notes. Files are saved under
``uploads/music/<subpath>/<uuid>.<ext>`` and the returned relative path is
stored in the entity's existing music-URL column (theme_music_url / music_url),
so a stored value can be either a pasted URL or an uploaded file path.
Swap internals for cloud storage (R2/S3) when moving to production.
"""
import os
import uuid
from fastapi import UploadFile, HTTPException, status

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.normpath(os.path.join(_MODULE_DIR, ".."))
UPLOAD_BASE_DIR = os.path.join(_BACKEND_DIR, "uploads", "music")

ALLOWED_EXTENSIONS = {".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac", ".mp4", ".webm", ".mov"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


async def save_music_file(file: UploadFile, subpath: str) -> str:
    """Validate and persist an uploaded audio/video file under ``uploads/music/<subpath>``.

    Returns the relative path suitable for storing in the DB and building URLs.
    """
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only MP3, OGG, WAV, M4A, AAC, FLAC, MP4, WebM, and MOV files are allowed",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 50 MB limit",
        )

    dir_path = os.path.join(UPLOAD_BASE_DIR, subpath)
    os.makedirs(dir_path, exist_ok=True)

    filename = f"{uuid.uuid4()}{ext}"
    full_path = os.path.join(dir_path, filename)
    with open(full_path, "wb") as f:
        f.write(contents)

    rel = os.path.join("uploads", "music", subpath, filename)
    return rel.replace(os.sep, "/")


def delete_music_file(music_path: str) -> None:
    """Remove an uploaded music file from local storage. No-ops if it's not an
    uploaded path (e.g. a pasted external URL) or the file is missing."""
    if not music_path or not music_path.startswith("uploads/music/"):
        return
    full_path = os.path.join(_BACKEND_DIR, music_path.replace("/", os.sep))
    if os.path.exists(full_path):
        os.remove(full_path)
