from tests.conftest import register, auth_headers


class TestRegister:
    def test_success(self, client):
        resp = register(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "user@example.com"
        assert data["username"] == "testuser"
        assert data["is_admin"] is False
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_duplicate_email(self, client):
        register(client)
        resp = register(client, username="other")
        assert resp.status_code == 400
        assert "Email already registered" in resp.json()["detail"]

    def test_duplicate_username(self, client):
        register(client)
        resp = register(client, email="other@example.com")
        assert resp.status_code == 400
        assert "Username already taken" in resp.json()["detail"]

    def test_invalid_email_format(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "username": "testuser",
            "password": "password123",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_success(self, client):
        register(client)
        resp = client.post("/api/auth/login", json={
            "email": "user@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "user@example.com"

    def test_wrong_password(self, client):
        register(client)
        resp = client.post("/api/auth/login", json={
            "email": "user@example.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "password123",
        })
        assert resp.status_code == 401


class TestMe:
    def test_returns_current_user(self, client):
        register(client)
        headers = auth_headers(client)
        resp = client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "user@example.com"

    def test_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


class TestTokenLifetime:
    """Deploy ticket T5. There is no refresh flow, so a token's lifetime is how long a player stays logged
    in. It comes from ACCESS_TOKEN_EXPIRE_MINUTES (30 locally; production sets 720 — docs/deployment.md)."""

    def _claims(self, token):
        from jose import jwt
        from config import settings
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

    def test_login_token_expires_after_the_configured_lifetime(self, client, monkeypatch):
        import time
        from config import settings
        monkeypatch.setattr(settings, "access_token_expire_minutes", 720)
        register(client)
        before = time.time()
        token = client.post("/api/auth/login", json={"email": "user@example.com", "password": "password123"}).json()["access_token"]
        lifetime = self._claims(token)["exp"] - before
        assert 720 * 60 - 5 <= lifetime <= 720 * 60 + 5

    def test_env_var_sets_the_lifetime(self, monkeypatch):
        from config import Settings
        monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720")
        assert Settings(database_url="postgresql://x/y", secret_key="k", _env_file=None).access_token_expire_minutes == 720

    def test_default_lifetime_is_30_minutes(self, monkeypatch):
        from config import Settings
        monkeypatch.delenv("ACCESS_TOKEN_EXPIRE_MINUTES", raising=False)
        assert Settings(database_url="postgresql://x/y", secret_key="k", _env_file=None).access_token_expire_minutes == 30

    def test_expired_token_is_refused(self, client):
        from datetime import timedelta
        from shared.security import create_access_token
        register(client)
        uid = client.post("/api/auth/login", json={"email": "user@example.com", "password": "password123"}).json()["user"]["id"]
        token = create_access_token({"sub": str(uid)}, expires_delta=timedelta(seconds=-1))
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401

    def test_unexpired_token_works(self, client):
        from datetime import timedelta
        from shared.security import create_access_token
        register(client)
        uid = client.post("/api/auth/login", json={"email": "user@example.com", "password": "password123"}).json()["user"]["id"]
        token = create_access_token({"sub": str(uid)}, expires_delta=timedelta(minutes=5))
        assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200
