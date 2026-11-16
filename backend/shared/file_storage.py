"""The ONE place uploaded files are stored — character portraits, NPC portraits, location maps,
session images and theme music.

Every upload is saved under a key of the form ``uploads/<folder>/<ids...>/<uuid><ext>`` and that
key is what the database stores (``image_path``, ``theme_music_url``, ``music_url``). The key is
backend-independent, so switching storage needs no data migration:

* ``local`` (default, dev + tests) — the key is a path under ``UPLOADS_DIR`` (default
  ``backend/uploads``), served by the ``/uploads`` StaticFiles mount in ``main.py``.
* ``r2`` (production) — the key is an object key in a Cloudflare R2 bucket (S3-compatible API),
  served from the bucket's public URL. The frontend builds URLs with ``VITE_UPLOADS_URL``
  (``frontend/src/lib/api.js`` › ``uploadUrl``).

Render's filesystem is wiped on every deploy, so production must use ``r2`` (deploy ticket T4).

To add an upload kind, add an ``UploadKind`` row below — never a new per-module storage file.
"""
from __future__ import annotations

import os
import shutil
import uuid
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from config import settings

KEY_PREFIX = "uploads/"
_BACKEND_DIR = Path(__file__).resolve().parents[1]

_IMAGE_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
_MUSIC_EXTENSIONS = frozenset({".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac", ".mp4", ".webm", ".mov"})
_MB = 1024 * 1024


@dataclass(frozen=True)
class UploadKind:
    """What one kind of upload accepts. Exactly one of content_types / extensions is the filter."""
    folder: str
    max_mb: int
    content_types: frozenset = field(default_factory=frozenset)
    extensions: frozenset = field(default_factory=frozenset)
    type_error: str = ""
    default_ext: str = ".jpg"

    def validate(self, file: UploadFile, ext: str) -> None:
        if self.content_types and file.content_type not in self.content_types:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, self.type_error)
        if self.extensions and ext.lower() not in self.extensions:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, self.type_error)


CHARACTER_IMAGE = UploadKind("characters", 10, content_types=_IMAGE_TYPES,
                             type_error="Only JPEG, PNG, and WebP images are allowed")
NPC_IMAGE = UploadKind("npcs", 10, content_types=_IMAGE_TYPES,
                       type_error="Only JPEG, PNG, and WebP images are allowed")
MAP_IMAGE = UploadKind("maps", 100, content_types=_IMAGE_TYPES,
                       type_error="Only JPEG, PNG, and WebP images are allowed")
SESSION_IMAGE = UploadKind("sessions", 10, content_types=_IMAGE_TYPES | {"image/gif"},
                           type_error="Only JPEG, PNG, WebP, and GIF images are allowed")
MUSIC = UploadKind("music", 50, extensions=_MUSIC_EXTENSIONS, default_ext="",
                   type_error="Only MP3, OGG, WAV, M4A, AAC, FLAC, MP4, WebM, and MOV files are allowed")


# ── Backends ──────────────────────────────────────────────────────────────────

class LocalStorage:
    """Files on disk under ``root``; a key ``uploads/x/y.png`` lives at ``root/x/y.png``."""

    def __init__(self, root: Path):
        self.root = Path(root)

    def _path(self, key: str) -> Path:
        path = (self.root / key[len(KEY_PREFIX):]).resolve()
        if self.root.resolve() not in path.parents:
            raise ValueError(f"key escapes the uploads root: {key!r}")
        return path

    def put(self, key: str, data: bytes, content_type: str | None) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> bool:
        path = self._path(key)
        if path.is_file():
            path.unlink()
            return True
        return False

    def delete_prefix(self, prefix: str) -> None:
        directory = self._path(prefix.rstrip("/"))
        if directory.is_dir():
            shutil.rmtree(directory)


class R2Storage:
    """Objects in a Cloudflare R2 bucket via its S3-compatible API.

    ``client`` is a boto3 S3 client (or any object with the same five methods — tests pass a fake).
    """

    def __init__(self, client, bucket: str):
        self.client = client
        self.bucket = bucket

    def put(self, key: str, data: bytes, content_type: str | None) -> None:
        extra = {"ContentType": content_type} if content_type else {}
        # Keys are random UUIDs and never overwritten, so browsers may cache them forever.
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data,
                               CacheControl="public, max-age=31536000, immutable", **extra)

    def delete(self, key: str) -> bool:
        # S3/R2 delete_object succeeds whether or not the key exists, so check first to report 404s.
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
        except Exception as exc:  # botocore ClientError (404) — the object isn't there
            if _is_not_found(exc):
                return False
            raise
        self.client.delete_object(Bucket=self.bucket, Key=key)
        return True

    def delete_prefix(self, prefix: str) -> None:
        # The trailing "/" keeps "sessions/1/2" from matching "sessions/1/20". List everything first,
        # then delete: deleting while paginating would depend on how the listing cursor survives
        # deletions. delete_objects takes at most 1000 keys per call.
        prefix = prefix.rstrip("/") + "/"
        keys, token = [], None
        while True:
            kwargs = {"Bucket": self.bucket, "Prefix": prefix}
            if token:
                kwargs["ContinuationToken"] = token
            page = self.client.list_objects_v2(**kwargs)
            keys += [o["Key"] for o in page.get("Contents", [])]
            if not page.get("IsTruncated"):
                break
            token = page.get("NextContinuationToken")
        for i in range(0, len(keys), 1000):
            batch = [{"Key": k} for k in keys[i:i + 1000]]
            self.client.delete_objects(Bucket=self.bucket, Delete={"Objects": batch, "Quiet": True})


def _is_not_found(exc: Exception) -> bool:
    code = str(getattr(exc, "response", {}).get("Error", {}).get("Code", ""))
    return code in {"404", "NoSuchKey", "NotFound"}


def _make_r2_storage() -> R2Storage:
    missing = [name for name in ("r2_account_id", "r2_access_key_id", "r2_secret_access_key", "r2_bucket")
               if not getattr(settings, name)]
    if missing:
        raise RuntimeError(
            "STORAGE_BACKEND=r2 needs " + ", ".join(n.upper() for n in missing) + " (see docs/deployment.md)"
        )
    import boto3  # imported lazily: dev and tests run on local storage

    client = boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )
    return R2Storage(client, settings.r2_bucket)


def local_uploads_dir() -> Path:
    return Path(settings.uploads_dir) if settings.uploads_dir else _BACKEND_DIR / "uploads"


@lru_cache()
def get_storage():
    backend = settings.storage_backend.lower()
    if backend == "local":
        return LocalStorage(local_uploads_dir())
    if backend == "r2":
        return _make_r2_storage()
    raise RuntimeError(f"Unknown STORAGE_BACKEND {settings.storage_backend!r}; use 'local' or 'r2'")


# ── The API every service uses ────────────────────────────────────────────────

async def save_upload(file: UploadFile, kind: UploadKind, *path_parts) -> str:
    """Validate ``file`` against ``kind`` and store it. Returns the key to save in the database:
    ``uploads/<kind.folder>/<path_parts...>/<uuid><ext>``."""
    ext = os.path.splitext(file.filename)[1] if file.filename else kind.default_ext
    if kind.extensions:
        ext = ext.lower()
    kind.validate(file, ext)

    contents = await file.read()
    if len(contents) > kind.max_mb * _MB:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"File size exceeds the {kind.max_mb} MB limit")

    parts = [kind.folder, *(str(p) for p in path_parts), f"{uuid.uuid4()}{ext}"]
    key = KEY_PREFIX + "/".join(parts)
    get_storage().put(key, contents, file.content_type)
    return key


def delete_upload(key: str | None) -> bool:
    """Delete a stored upload. Returns False (no error) when there is nothing to delete — including
    values that aren't upload keys at all, like a pasted YouTube link in ``theme_music_url``."""
    if not key or not key.startswith(KEY_PREFIX):
        return False
    return get_storage().delete(key)


def delete_upload_file(kind: UploadKind, *path_parts, filename: str) -> bool:
    """Delete ``uploads/<kind.folder>/<path_parts...>/<filename>`` when the caller has only a bare
    filename (e.g. from a URL). Anything that isn't a plain file name — a "/", "\\" or ".." that
    could reach another folder's files — is treated as not found."""
    if not filename or filename in {".", ".."} or "/" in filename or "\\" in filename:
        return False
    return delete_upload(KEY_PREFIX + "/".join([kind.folder, *(str(p) for p in path_parts), filename]))


def delete_upload_folder(kind: UploadKind, *path_parts) -> None:
    """Delete every upload under ``uploads/<kind.folder>/<path_parts...>/`` (e.g. a deleted session's images)."""
    get_storage().delete_prefix(KEY_PREFIX + "/".join([kind.folder, *(str(p) for p in path_parts)]))
