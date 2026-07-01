"""One-time database bootstrap.

Creates/updates schema and seeds the admin user. Run this once per deploy
(e.g. as a Render pre-deploy/release command, or manually against the
production DATABASE_URL before/after a Vercel deploy) - NOT on every
process start. Running it against an already-bootstrapped database is
safe and idempotent.

Usage:
    python -m app.bootstrap
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.models.models import User
from app.core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


def ensure_user_profile_image_column() -> None:
    """Best-effort schema compatibility for databases created before profile_image existed."""
    inspector = inspect(engine)
    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "profile_image" in user_columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN profile_image TEXT"))


def init_admin() -> None:
    """Create the initial admin user if it doesn't exist."""
    admin_email = (settings.ADMIN_EMAIL or "").strip()
    admin_password = (settings.ADMIN_PASSWORD or "").strip()

    if not admin_email or not admin_password:
        print("ℹ️  ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin bootstrap")
        return

    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.email == admin_email).first()
        if admin_exists:
            # Keep env credentials as the recovery source of truth for admin access.
            if not verify_password(admin_password, admin_exists.hashed_password):
                admin_exists.hashed_password = get_password_hash(admin_password)
                admin_exists.is_active = True
                db.commit()
                print("✅ Admin password synchronized from environment")
            else:
                print("ℹ️  Admin user already exists")
            return

        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            first_name="Admin",
            last_name="User",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        try:
            db.commit()
            print(f"✅ Admin user created: {admin_email}")
        except IntegrityError:
            # Another bootstrap run may create admin concurrently; ignore duplicate.
            db.rollback()
            print("ℹ️  Admin user already exists (detected during commit)")
    finally:
        db.close()


def run_bootstrap() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_user_profile_image_column()
    init_admin()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_bootstrap()
    print("✅ Database bootstrap complete")
