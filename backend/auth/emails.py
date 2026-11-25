"""The account emails' wording (plain text). Sent through shared/email.py from route background tasks."""
from config import settings
from shared.email import send_email


def send_password_reset(email: str, username: str, raw_token: str) -> None:
    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
    send_email(
        email,
        "Reset your password",
        f"Hi {username},\n\n"
        f"Someone (hopefully you) asked to reset the password for your account. Open this link to choose a new one:\n\n"
        f"{link}\n\n"
        f"The link works once and expires in {settings.password_reset_minutes} minutes. "
        f"If you didn't ask for this, ignore this email — your password stays the same.\n",
    )


def send_password_changed(email: str, username: str) -> None:
    send_email(
        email,
        "Your password was changed",
        f"Hi {username},\n\nYour password was just changed, and every device that was logged in has been signed out.\n"
        f"If this wasn't you, reset it again straight away from the login page.\n",
    )


def send_welcome(email: str, username: str) -> None:
    send_email(
        email,
        "Welcome!",
        f"Hi {username},\n\nYour account is ready. A Game Master can now invite you to a campaign by your username "
        f"({username}); invitations appear on your campaign list for you to accept.\n\n"
        f"Log in: {settings.frontend_url.rstrip('/')}/login\n",
    )


def send_new_account_notice(username: str) -> None:
    """Tell the admin someone signed up. The user's email is deliberately left out of it."""
    if not settings.admin_notify_email:
        return
    send_email(settings.admin_notify_email, f"New account: {username}", f"A new account was registered: {username}\n")
