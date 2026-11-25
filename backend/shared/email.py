"""THE outgoing-email module (account emails, password reset). One entry point, ``send_email``; two backends.

* ``console`` (default; dev and tests) — nothing is sent. The message is logged and appended to ``OUTBOX`` so tests can
  read the reset link. Production must not use it, or nobody ever receives anything.
* ``postmark`` (production) — Postmark's HTTP API. Needs POSTMARK_SERVER_TOKEN and EMAIL_FROM (a verified sender on a
  domain you own: Postmark refuses free-mail senders). See docs/deployment.md › Email.

Sending never raises to the caller: an email that fails is logged, and the request that triggered it still succeeds.
Callers send from FastAPI ``BackgroundTasks`` so a slow provider never delays (or, for forgot-password, times) a reply.
"""
import logging
from dataclasses import dataclass

import httpx

from config import settings

log = logging.getLogger("email")

POSTMARK_URL = "https://api.postmarkapp.com/email"


@dataclass(frozen=True)
class Email:
    to: str
    subject: str
    text: str


# console backend: every message "sent" this process. Tests read it; reset_outbox() clears it.
OUTBOX: list[Email] = []


def reset_outbox() -> None:
    OUTBOX.clear()


def check_email_config() -> None:
    """Fail fast at startup when the postmark backend is missing what it needs (like STORAGE_BACKEND=r2)."""
    backend = settings.email_backend
    if backend not in ("console", "postmark"):
        raise RuntimeError(f"EMAIL_BACKEND must be 'console' or 'postmark', not {backend!r}")
    if backend == "postmark":
        missing = [n for n in ("postmark_server_token", "email_from") if not getattr(settings, n)]
        if missing:
            raise RuntimeError(
                "EMAIL_BACKEND=postmark needs " + ", ".join(n.upper() for n in missing) + " (see docs/deployment.md)"
            )


def _send_postmark(message: Email) -> None:
    resp = httpx.post(
        POSTMARK_URL,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": settings.postmark_server_token,
        },
        json={
            "From": settings.email_from,
            "To": message.to,
            "Subject": message.subject,
            "TextBody": message.text,
            "MessageStream": "outbound",
        },
        timeout=10,
    )
    resp.raise_for_status()


def send_email(to: str, subject: str, text: str) -> bool:
    """Send one plain-text email. Returns True on success; never raises."""
    message = Email(to=to, subject=subject, text=text)
    try:
        if settings.email_backend == "postmark":
            _send_postmark(message)
        else:
            OUTBOX.append(message)
            # WARNING, not INFO: uvicorn hides app INFO logs by default, and in dev this log line IS the email.
            log.warning("[console email] to=%s subject=%s\n%s", to, subject, text)
        return True
    except Exception:  # noqa: BLE001 — an email must never break the request that triggered it
        log.exception("Sending email %r failed", subject)
        return False
