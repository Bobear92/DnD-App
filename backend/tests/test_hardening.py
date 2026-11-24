"""
Post-deploy T2 slice 3 — hardening.

  - TestUploadTypesComeFromTheAllowList: the stored Content-Type and extension never come from the client.
  - TestLoginRateLimit: 10 failures for one (IP, email) in 15 minutes → 429 with Retry-After; success clears it.
  - TestPasswordMinimum: registration needs 8+ characters.
  - TestApiDocsOffByDefault: /docs, /redoc, /openapi.json exist only when API_DOCS opts in.
"""
import asyncio
import io

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.datastructures import Headers, UploadFile

import main
from auth import rate_limit
from config import Settings, settings
from shared import file_storage as fs
from tests.conftest import register


class _FakeS3:
    def __init__(self):
        self.puts = []

    def put_object(self, Bucket, Key, Body, **extra):
        self.puts.append({"Key": Key, **extra})


def _save_to_fake_r2(monkeypatch, name, content_type, kind, *parts):
    s3 = _FakeS3()
    store = fs.R2Storage(s3, "bucket")
    monkeypatch.setattr(fs, "get_storage", lambda: store)
    upload = UploadFile(file=io.BytesIO(b"<html><script>alert(1)</script></html>"), filename=name,
                        headers=Headers({"content-type": content_type}))
    key = asyncio.run(fs.save_upload(upload, kind, *parts))
    return key, s3.puts[-1]


class TestUploadTypesComeFromTheAllowList:
    def test_music_content_type_is_derived_from_the_extension(self, monkeypatch):
        # The old code stored the client's text/html, so the public bucket served the "song" as a web page.
        key, put = _save_to_fake_r2(monkeypatch, "song.mp3", "text/html", fs.MUSIC, "npcs", 1)
        assert key.endswith(".mp3")
        assert put["ContentType"] == "audio/mpeg"

    def test_every_music_extension_maps_to_an_audio_or_video_type(self, monkeypatch):
        for ext in fs._MUSIC_EXTENSIONS:
            _, put = _save_to_fake_r2(monkeypatch, f"x{ext.upper()}", "application/octet-stream", fs.MUSIC, "s", 1)
            assert put["ContentType"].split("/")[0] in {"audio", "video"}, ext

    def test_image_extension_comes_from_the_validated_type_not_the_filename(self, monkeypatch):
        key, put = _save_to_fake_r2(monkeypatch, "evil.html", "image/png", fs.CHARACTER_IMAGE, 1)
        assert key.endswith(".png") and ".html" not in key
        assert put["ContentType"] == "image/png"

    def test_session_gif_keeps_gif(self, monkeypatch):
        key, put = _save_to_fake_r2(monkeypatch, "anim.html", "image/gif", fs.SESSION_IMAGE, 1, 2)
        assert key.endswith(".gif") and put["ContentType"] == "image/gif"


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


class TestLoginRateLimit:
    def test_eleventh_attempt_is_refused_even_with_the_right_password(self, client):
        register(client, email="victim@example.com", username="victim")
        for _ in range(rate_limit.MAX_FAILURES):
            assert _login(client, "victim@example.com", "wrong-guess").status_code == 401
        blocked = _login(client, "victim@example.com", "password123")
        assert blocked.status_code == 429
        assert int(blocked.headers["Retry-After"]) > 0

    def test_email_matching_is_case_insensitive(self, client):
        register(client, email="victim@example.com", username="victim")
        for i in range(rate_limit.MAX_FAILURES):
            email = "VICTIM@example.com" if i % 2 else "victim@example.com"
            _login(client, email, "wrong-guess")
        assert _login(client, "victim@example.com", "password123").status_code == 429

    def test_other_accounts_are_unaffected(self, client):
        register(client, email="victim@example.com", username="victim")
        register(client, email="other@example.com", username="other")
        for _ in range(rate_limit.MAX_FAILURES):
            _login(client, "victim@example.com", "wrong-guess")
        assert _login(client, "other@example.com", "password123").status_code == 200

    def test_a_success_clears_the_count(self, client):
        register(client, email="me@example.com", username="me")
        for _ in range(rate_limit.MAX_FAILURES - 1):
            _login(client, "me@example.com", "typo")
        assert _login(client, "me@example.com", "password123").status_code == 200
        for _ in range(rate_limit.MAX_FAILURES - 1):
            _login(client, "me@example.com", "typo")
        assert _login(client, "me@example.com", "password123").status_code == 200

    def test_unknown_emails_count_too(self, client):
        for _ in range(rate_limit.MAX_FAILURES):
            assert _login(client, "nobody@example.com", "x").status_code == 401
        assert _login(client, "nobody@example.com", "x").status_code == 429

    def test_the_window_slides(self):
        t0 = 1000.0
        for i in range(rate_limit.MAX_FAILURES):
            rate_limit.record_failure("1.2.3.4", "a@b.c", now=t0 + i)
        assert rate_limit.retry_after("1.2.3.4", "a@b.c", now=t0 + 20) > 0
        assert rate_limit.retry_after("5.6.7.8", "a@b.c", now=t0 + 20) == 0  # another IP
        # Once the oldest failure is a full window old, one more attempt is allowed.
        assert rate_limit.retry_after("1.2.3.4", "a@b.c", now=t0 + rate_limit.WINDOW_SECONDS) == 0


class TestPasswordMinimum:
    def test_seven_characters_is_refused(self, client):
        resp = register(client, email="short@example.com", username="short", password="1234567")
        assert resp.status_code == 422

    def test_eight_characters_is_accepted(self, client):
        resp = register(client, email="ok@example.com", username="okuser", password="12345678")
        assert resp.status_code == 201, resp.text


class TestApiDocsOffByDefault:
    def test_setting_defaults_to_off(self):
        assert Settings.model_fields["api_docs"].default is False

    def test_off_removes_docs_redoc_and_schema(self):
        app = FastAPI(**main.docs_routes(False))
        c = TestClient(app)
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert c.get(path).status_code == 404, path

    def test_on_serves_them(self):
        c = TestClient(FastAPI(**main.docs_routes(True)))
        assert c.get("/docs").status_code == 200
        assert c.get("/openapi.json").status_code == 200

    def test_the_real_app_follows_the_setting(self, client):
        expected = 200 if settings.api_docs else 404
        assert client.get("/docs").status_code == expected
        assert client.get("/health").status_code == 200  # liveness never depends on docs
