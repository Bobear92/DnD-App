from pydantic_settings import BaseSettings
from functools import lru_cache

# Local dev frontends. Production sets ALLOWED_ORIGINS to the deployed frontend's URL.
DEV_ORIGINS = "http://localhost:3000,http://localhost:5173"


class Settings(BaseSettings):
    # Database
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # App
    app_name: str = "D&D RPG API"
    # Off unless an environment opts in: a production deploy must never inherit a debug default.
    debug: bool = False

    # CORS — comma-separated origins allowed to call the API from a browser (ALLOWED_ORIGINS).
    # A plain string, not a list, so the env var is "https://a.com,https://b.com" rather than JSON.
    allowed_origins: str = DEV_ORIGINS

    # Uploaded files (shared/file_storage.py). "local" = disk under UPLOADS_DIR (default backend/uploads),
    # served at /uploads. "r2" = a Cloudflare R2 bucket — required in production, where the disk is
    # wiped on every deploy. The frontend then reads files from the bucket's public URL (VITE_UPLOADS_URL).
    storage_backend: str = "local"
    uploads_dir: str = ""
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """ALLOWED_ORIGINS split into a list. Trailing slashes are dropped because a browser's
        Origin header never has one, so "https://app.com/" would otherwise never match."""
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
