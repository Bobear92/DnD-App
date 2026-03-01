from sqlalchemy.orm import Session
from shared.database import SessionLocal, engine, Base
from auth.models import User
from shared.security import hash_password

def create_test_users():
    """Create test users for development"""
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
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created!")
    
    print("\nCreating test users...")
    create_test_users()