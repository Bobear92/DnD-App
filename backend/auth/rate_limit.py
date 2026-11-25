"""Request throttles keyed on (client IP, email) — failed logins and password-reset requests (post-deploy T2 / T4).

``LOGIN``: after MAX_FAILURES failed logins for the same (IP, email) inside WINDOW_SECONDS, further attempts get 429 until
the oldest failure ages out; a successful login clears that key. ``FORGOT_PASSWORD``: at most 5 reset emails per
(IP, email) an hour, so the endpoint can't be used to flood someone's inbox. Keyed on IP + email so one attacker can't
lock a victim out from everywhere, and one shared IP (a household) doesn't lock out everyone on it.

In memory on purpose: production runs ONE Render instance, so a process-local dict is the whole picture; it resets on
restart/deploy, which only ever loosens it. If the backend is ever scaled out, move this to the database or Redis.
"""
import math
import time
from collections import defaultdict, deque
from threading import Lock

MAX_FAILURES = 10
WINDOW_SECONDS = 15 * 60


class Throttle:
    """At most ``limit`` events per (IP, email) in any ``window`` seconds."""

    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self._events: dict[tuple[str, str], deque] = defaultdict(deque)
        self._lock = Lock()

    @staticmethod
    def _key(ip: str | None, email: str) -> tuple[str, str]:
        return (ip or "unknown", email.strip().lower())

    def _prune(self, q: deque, now: float) -> None:
        while q and now - q[0] >= self.window:
            q.popleft()

    def retry_after(self, ip: str | None, email: str, now: float | None = None) -> int:
        """Seconds until another event is allowed; 0 = allowed now."""
        now = time.monotonic() if now is None else now
        with self._lock:
            q = self._events.get(self._key(ip, email))
            if not q:
                return 0
            self._prune(q, now)
            if len(q) < self.limit:
                return 0
            return max(1, math.ceil(self.window - (now - q[0])))

    def record(self, ip: str | None, email: str, now: float | None = None) -> None:
        now = time.monotonic() if now is None else now
        with self._lock:
            q = self._events[self._key(ip, email)]
            self._prune(q, now)
            q.append(now)

    def clear(self, ip: str | None, email: str) -> None:
        with self._lock:
            self._events.pop(self._key(ip, email), None)

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


LOGIN = Throttle(MAX_FAILURES, WINDOW_SECONDS)
FORGOT_PASSWORD = Throttle(5, 60 * 60)


# The login throttle's original function API (auth/routes.py and the tests use these).
def retry_after(ip: str | None, email: str, now: float | None = None) -> int:
    return LOGIN.retry_after(ip, email, now)


def record_failure(ip: str | None, email: str, now: float | None = None) -> None:
    LOGIN.record(ip, email, now)


def record_success(ip: str | None, email: str) -> None:
    LOGIN.clear(ip, email)


def reset() -> None:
    """Clear every throttle (tests)."""
    LOGIN.reset()
    FORGOT_PASSWORD.reset()
