"""Alembic owns the schema — deploy ticket T3.

main.py used to run Base.metadata.create_all() at import. That let a model ship without a migration
(it worked on every dev DB, then a fresh production DB was missing the table), and a server started
before `alembic upgrade head` would create tables that alembic then failed on. These pin the pieces
that keep the schema owned by migrations alone. The full model-vs-migration comparison is CI's
`alembic check` (it needs a migrated database, which pytest's create_all-built schema is not).
"""
import os
import re
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]


def _code(path):
    """Source with comments stripped, so a comment explaining the rule doesn't trip it."""
    return "\n".join(line.split("#", 1)[0] for line in path.read_text(encoding="utf-8").splitlines())


def test_app_does_not_create_tables_at_import():
    assert "create_all" not in _code(BACKEND / "main.py")


def test_alembic_env_sees_every_model_the_app_uses():
    # Importing main registers every model; without it autogenerate/check compare against a subset.
    assert re.search(r"^import main\b", _code(BACKEND / "migrations" / "env.py"), re.M)


def test_alembic_env_escapes_percent_in_database_url():
    # ConfigParser treats "%" as interpolation; a percent-encoded password crashed every upgrade.
    assert '.replace("%", "%%")' in _code(BACKEND / "migrations" / "env.py")


def test_production_start_migrates_before_serving():
    script = _code(BACKEND / "start.sh")
    assert script.index("alembic upgrade head") < script.index("uvicorn main:app")
    assert "--reload" not in script
    assert "set -euo pipefail" in script  # a failed migration must stop the start


def test_production_requirements_exclude_test_tools():
    prod = (BACKEND / "requirements.txt").read_text(encoding="utf-8").lower()
    assert "pytest" not in prod
    # httpx stays: the seed scripts production runs use it to download SRD data.
    assert "httpx" in prod


@pytest.mark.skipif(not os.environ.get("CI"), reason="python version pin is checked where CI sets it up")
def test_python_pin_matches_ci():
    pin = (BACKEND.parent / ".python-version").read_text(encoding="utf-8").strip()
    ci = (BACKEND.parent / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    assert f"python-version: '{pin}'" in ci
