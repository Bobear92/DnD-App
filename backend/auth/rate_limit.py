"""Failed-login throttle (post-deploy T2 security hardening).

After MAX_FAILURES failed logins for the same (client IP, email) inside WINDOW_SECONDS, further attempts get 429 until
the oldest failure ages out. A successful login clears that key. Keyed on IP + email so one attacker can't lock a
victim out from everywhere, and one shared IP (a household) doesn't lock out everyone on it.

In memory on purpose: production runs ONE Render instance, so a process-local dict is the whole picture; it resets on
restart/deploy, which only ever loosens it. If the backend is ever scaled out, move this to the database or Redis.
"""
import math
import time
from collections import defaultdict, deque
from threading import Lock

MAX_FAILURES = 10
WINDOW_SECONDS = 15 * 60

_failures: dict[tuple[str, str], deque] = defaultdict(deque)
_lock = Lock()


def _key(ip: str | None, email: str) -> tuple[str, str]:
    return (ip or "unknown", email.strip().lower())


def _prune(q: deque, now: float) -> None:
    while q and now - q[0] >= WINDOW_SECONDS:
        q.popleft()


def retry_after(ip: str | None, email: str, now: float | None = None) -> int:
    """Seconds until another attempt is allowed; 0 = allowed now."""
    now = time.monotonic() if now is None else now
    with _lock:
        q = _failures.get(_key(ip, email))
        if not q:
            return 0
        _prune(q, now)
        if len(q) < MAX_FAILURES:
            return 0
        return max(1, math.ceil(WINDOW_SECONDS - (now - q[0])))


def record_failure(ip: str | None, email: str, now: float | None = None) -> None:
    now = time.monotonic() if now is None else now
    with _lock:
        q = _failures[_key(ip, email)]
        _prune(q, now)
        q.append(now)


def record_success(ip: str | None, email: str) -> None:
    with _lock:
        _failures.pop(_key(ip, email), None)


def reset() -> None:
    """Clear all state (tests)."""
    with _lock:
        _failures.clear()
