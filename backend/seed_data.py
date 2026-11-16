"""DEV ONLY: creates test users with KNOWN passwords, including an ADMIN (admin@dndapp.com /
admin123). Never run against production — refuse_non_local_database() enforces that. Production's
admin is a normal registration with is_admin flipped by hand (docs/deployment.md › Data operations).

The schema comes from `alembic upgrade head`; this script no longer creates tables.
"""
from sqlalchemy.engine import make_url

from config import settings
from shared.database import SessionLocal
from auth.models import User
from shared.security import hash_password

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


def refuse_non_local_database(database_url: str = None) -> None:
    host = make_url(database_url or settings.database_url).host or "localhost"
    if host not in LOCAL_HOSTS:
        raise SystemExit(
            f"seed_data.py creates an admin with a known password and is DEV ONLY; refusing to run "
            f"against database host {host!r}. Use the normal registration flow instead."
        )


def create_test_users():
    """Create test users for development"""
    refuse_non_local_database()
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping seed.")
            return
        
        # Create admin user
        admin = User(
            email="admin@dndapp.com",
            username="admin",
            password_hash=hash_password("admin123"),
            is_admin=True
        )
        
        # Create test players
        player1 = User(
            email="alice@example.com",
            username="alice",
            password_hash=hash_password("password123"),
            is_admin=False
        )
        
        player2 = User(
            email="bob@example.com",
            username="bob",
            password_hash=hash_password("password123"),
            is_admin=False
        )
        
        player3 = User(
            email="charlie@example.com",
            username="charlie",
            password_hash=hash_password("password123"),
            is_admin=False
        )
        
        # Add all users
        db.add_all([admin, player1, player2, player3])
        db.commit()
        
        print("✅ Test users created successfully!")
        print("\n📝 Test User Credentials:")
        print("\nAdmin:")
        print("  Email: admin@dndapp.com")
        print("  Password: admin123")
        print("\nPlayers:")
        print("  Email: alice@example.com | Password: password123")
        print("  Email: bob@example.com | Password: password123")
        print("  Email: charlie@example.com | Password: password123")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    refuse_non_local_database()

    print("\nCreating test users...")
    create_test_users()