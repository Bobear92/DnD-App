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
