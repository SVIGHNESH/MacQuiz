from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from app.core.config import settings

# Force the psycopg (v3) driver for Postgres URLs. SQLAlchemy maps the bare
# `postgresql://` (and Heroku/Supabase-style `postgres://`) scheme to psycopg2 by
# default, but this app installs psycopg v3 (requirements.txt: psycopg[binary]) and
# uses the psycopg3-only `prepare_threshold` connect arg below. Without this rewrite,
# create_engine() eagerly `import psycopg2` at module load, which isn't installed, so
# uvicorn crashes on boot before binding a port (Render reports it only as a port-scan
# timeout). An explicit driver (e.g. `postgresql+psycopg://`) is respected as-is.
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = 'postgresql+psycopg://' + DATABASE_URL[len('postgres://'):]
elif DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = 'postgresql+psycopg://' + DATABASE_URL[len('postgresql://'):]

# Create engine with appropriate settings for MySQL
# Remove SQLite-specific connect_args
connect_args = {}
if DATABASE_URL.startswith('sqlite'):
    connect_args = {"check_same_thread": False}
elif DATABASE_URL.startswith('postgresql'):
    # Supabase's :6543 endpoint is the transaction pooler (PgBouncer transaction mode),
    # which does not support server-side prepared statements. psycopg3 issues them by
    # default, causing "prepared statement already exists" errors under concurrency.
    connect_args = {"prepare_threshold": None}

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,  # Verify connections before using
    "pool_recycle": 3600,   # Recycle connections after 1 hour
    "echo": False,
}

# Vercel/Serverless: disable connection pooling to avoid stale pooled connections across invocations
if os.getenv('VERCEL') or os.getenv('SERVERLESS'):
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
