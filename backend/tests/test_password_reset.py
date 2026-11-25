"""
Post-deploy T4 — password reset + account emails (shared/email.py console backend: messages land in OUTBOX).

  - TestForgotPassword: same reply whether or not the account exists; the email carries a one-time link; throttled;
    a newer request revokes the older link.
  - TestResetPassword: the link sets the password once; expired/used/garbage links fail; 8-char minimum; every session
    from before the reset is signed out, new logins work.
  - TestAccountEmails: welcome + admin notice on register (no email address in the admin notice); a failing email
    never fails the request.
  - TestEmailConfig: EMAIL_BACKEND=postmark without its token/sender refuses to start; the postmark backend posts the
    right request.
"""
import re
from datetime import datetime, timedelta, timezone

import pytest

from auth import rate_limit
from auth.models import PasswordResetToken
from config import settings
from shared import email
from tests.conftest import _SessionLocal, make_user, auth_headers

FORGOT = "/api/auth/forgot-password"
RESET = "/api/auth/reset-password"


def _token_from_outbox(to):
    msg = next(m for m in reversed(email.OUTBOX) if m.to == to and m.subject == "Reset your password")
    return re.search(r"reset-password\?token=([\w-]+)", msg.text).group(1)


def _forgot(client, addr):
    return client.post(FORGOT, json={"email": addr})


class TestForgotPassword:
    def test_reply_is_identical_for_known_and_unknown_emails(self, client):
        make_user(client, 1)
        known = _forgot(client, "user1@example.com")
        unknown = _forgot(client, "nobody@example.com")
        assert known.status_code == unknown.status_code == 200
        assert known.json() == unknown.json()
        assert [m.to for m in email.OUTBOX if m.subject == "Reset your password"] == ["user1@example.com"]

    def test_link_points_at_the_frontend_and_only_a_hash_is_stored(self, client):
        make_user(client, 1)
        _forgot(client, "user1@example.com")
        msg = email.OUTBOX[-1]
        assert f"{settings.frontend_url.rstrip('/')}/reset-password?token=" in msg.text
        raw = _token_from_outbox("user1@example.com")
        with _SessionLocal() as db:
            stored = [r.token_hash for r in db.query(PasswordResetToken).all()]
        assert raw not in stored and len(stored) == 1 and len(stored[0]) == 64

    def test_email_matching_ignores_case(self, client):
        make_user(client, 1)
        _forgot(client, "USER1@Example.com")
        assert _token_from_outbox("user1@example.com")

    def test_a_newer_request_revokes_the_older_link(self, client):
        make_user(client, 1)
        _forgot(client, "user1@example.com")
        first = _token_from_outbox("user1@example.com")
        _forgot(client, "user1@example.com")
        second = _token_from_outbox("user1@example.com")
        assert first != second
        assert client.post(RESET, json={"token": first, "new_password": "newpass123"}).status_code == 400
        assert client.post(RESET, json={"token": second, "new_password": "newpass123"}).status_code == 200

    def test_throttled_after_five_per_hour(self, client):
        make_user(client, 1)
        for _ in range(rate_limit.FORGOT_PASSWORD.limit):
            assert _forgot(client, "user1@example.com").status_code == 200
        blocked = _forgot(client, "user1@example.com")
        assert blocked.status_code == 429 and int(blocked.headers["Retry-After"]) > 0
        # throttled for unknown emails too, so the limit itself reveals nothing
        for _ in range(rate_limit.FORGOT_PASSWORD.limit):
            _forgot(client, "ghost@example.com")
        assert _forgot(client, "ghost@example.com").status_code == 429


class TestResetPassword:
    def _reset_token(self, client):
        make_user(client, 1)
        _forgot(client, "user1@example.com")
        return _token_from_outbox("user1@example.com")

    def test_sets_the_password_and_works_once(self, client):
        token = self._reset_token(client)
        assert client.post(RESET, json={"token": token, "new_password": "brandnew99"}).status_code == 200
        assert client.post("/api/auth/login", json={"email": "user1@example.com", "password": "brandnew99"}).status_code == 200
        assert client.post("/api/auth/login", json={"email": "user1@example.com", "password": "password123"}).status_code == 401
        again = client.post(RESET, json={"token": token, "new_password": "another999"})
        assert again.status_code == 400 and "invalid or has expired" in again.json()["detail"]
        assert any(m.subject == "Your password was changed" for m in email.OUTBOX)

    def test_expired_link_fails(self, client):
        token = self._reset_token(client)
        with _SessionLocal() as db:
            row = db.query(PasswordResetToken).one()
            row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
            db.commit()
        assert client.post(RESET, json={"token": token, "new_password": "brandnew99"}).status_code == 400

    def test_garbage_link_fails(self, client):
        make_user(client, 1)
        assert client.post(RESET, json={"token": "not-a-real-token-at-all", "new_password": "brandnew99"}).status_code == 400

    def test_new_password_needs_eight_characters(self, client):
        token = self._reset_token(client)
        assert client.post(RESET, json={"token": token, "new_password": "short12"}).status_code == 422
        # the link was not spent by the refused attempt
        assert client.post(RESET, json={"token": token, "new_password": "longenough"}).status_code == 200

    def test_every_earlier_session_is_signed_out(self, client):
        old_headers, _ = make_user(client, 1)
        assert client.get("/api/auth/me", headers=old_headers).status_code == 200
        _forgot(client, "user1@example.com")
        client.post(RESET, json={"token": _token_from_outbox("user1@example.com"), "new_password": "brandnew99"})
        assert client.get("/api/auth/me", headers=old_headers).status_code == 401
        new_headers = auth_headers(client, email="user1@example.com", password="brandnew99")
        assert client.get("/api/auth/me", headers=new_headers).status_code == 200


class TestAccountEmails:
    def test_register_sends_a_welcome_and_tells_the_admin(self, client, monkeypatch):
        monkeypatch.setattr(settings, "admin_notify_email", "admin@example.org")
        make_user(client, 1)
        welcome = [m for m in email.OUTBOX if m.to == "user1@example.com"]
        assert welcome and welcome[0].subject == "Welcome!" and "user1" in welcome[0].text
        notice = [m for m in email.OUTBOX if m.to == "admin@example.org"]
        assert notice and "user1" in notice[0].subject
        assert "user1@example.com" not in notice[0].text  # the admin notice carries no email address

    def test_no_admin_notice_when_unset(self, client, monkeypatch):
        monkeypatch.setattr(settings, "admin_notify_email", "")
        make_user(client, 1)
        assert [m.to for m in email.OUTBOX] == ["user1@example.com"]

    def test_a_failing_email_never_fails_the_request(self, client, monkeypatch):
        def boom(*a, **k):
            raise RuntimeError("provider down")
        monkeypatch.setattr(settings, "email_backend", "postmark")
        monkeypatch.setattr(email, "_send_postmark", boom)
        headers, _ = make_user(client, 1)  # register still 201
        assert client.get("/api/auth/me", headers=headers).status_code == 200
        assert _forgot(client, "user1@example.com").status_code == 200


class TestEmailConfig:
    def test_postmark_without_token_or_sender_refuses_to_start(self, monkeypatch):
        monkeypatch.setattr(settings, "email_backend", "postmark")
        monkeypatch.setattr(settings, "postmark_server_token", "")
        monkeypatch.setattr(settings, "email_from", "")
        with pytest.raises(RuntimeError, match="POSTMARK_SERVER_TOKEN, EMAIL_FROM"):
            email.check_email_config()

    def test_unknown_backend_refuses_to_start(self, monkeypatch):
        monkeypatch.setattr(settings, "email_backend", "smtp")
        with pytest.raises(RuntimeError):
            email.check_email_config()

    def test_postmark_backend_posts_the_documented_request(self, monkeypatch):
        sent = {}

        class Resp:
            def raise_for_status(self):
                pass

        def fake_post(url, headers, json, timeout):
            sent.update(url=url, headers=headers, json=json)
            return Resp()

        monkeypatch.setattr(settings, "email_backend", "postmark")
        monkeypatch.setattr(settings, "postmark_server_token", "server-token")
        monkeypatch.setattr(settings, "email_from", "Tavern <noreply@example.org>")
        monkeypatch.setattr(email.httpx, "post", fake_post)
        assert email.send_email("p@example.com", "Hi", "Body") is True
        assert sent["url"] == email.POSTMARK_URL
        assert sent["headers"]["X-Postmark-Server-Token"] == "server-token"
        assert sent["json"] == {"From": "Tavern <noreply@example.org>", "To": "p@example.com", "Subject": "Hi",
                                "TextBody": "Body", "MessageStream": "outbound"}
        assert email.OUTBOX == []  # nothing "sent" to the console outbox in postmark mode
