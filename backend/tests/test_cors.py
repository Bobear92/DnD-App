"""CORS origins come from settings (ALLOWED_ORIGINS), not a hardcoded list — deploy ticket T2.

A deployed frontend lives on its own origin; if the backend's CORS list doesn't name it, every
browser call fails even though the API works from curl. These tests pin both halves: the listed
origins are allowed, an unlisted one is not, and the env-var string parses the way we document.
"""
import pytest

from config import DEV_ORIGINS, Settings, settings

PREFLIGHT_HEADERS = {
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type,authorization",
}


def _preflight(client, origin):
    return client.options("/api/auth/login", headers={"Origin": origin, **PREFLIGHT_HEADERS})


class TestCorsMiddleware:
    @pytest.mark.parametrize("origin", settings.cors_origins)
    def test_configured_origin_is_allowed(self, client, origin):
        r = _preflight(client, origin)
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == origin
        assert r.headers.get("access-control-allow-credentials") == "true"

    def test_unlisted_origin_is_refused(self, client):
        r = _preflight(client, "https://evil.example.com")
        assert r.status_code == 400
        assert "access-control-allow-origin" not in r.headers

    def test_simple_request_from_unlisted_origin_gets_no_cors_header(self, client):
        # The request itself still reaches the API (CORS is enforced by the browser), but without
        # the header the browser won't hand the response to the page.
        r = client.post("/api/auth/login", json={}, headers={"Origin": "https://evil.example.com"})
        assert "access-control-allow-origin" not in r.headers

    def test_middleware_uses_settings_not_a_wildcard(self):
        assert "*" not in settings.cors_origins


class TestAllowedOriginsParsing:
    def _settings(self, **kw):
        return Settings(database_url="postgresql://x/y", secret_key="k", **kw)

    def test_defaults_to_local_dev_frontends(self):
        assert self._settings().cors_origins == DEV_ORIGINS.split(",")

    def test_comma_separated_with_spaces_and_trailing_slashes(self):
        s = self._settings(allowed_origins=" https://dnd.example.com/ , https://www.dnd.example.com ,")
        assert s.cors_origins == ["https://dnd.example.com", "https://www.dnd.example.com"]

    def test_read_from_the_environment(self, monkeypatch):
        monkeypatch.setenv("ALLOWED_ORIGINS", "https://dnd.example.com")
        assert self._settings().cors_origins == ["https://dnd.example.com"]

    def test_debug_is_off_unless_an_environment_opts_in(self, monkeypatch):
        monkeypatch.delenv("DEBUG", raising=False)
        assert self._settings(_env_file=None).debug is False
