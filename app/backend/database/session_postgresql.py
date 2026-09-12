from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from dotenv import load_dotenv
from contextlib import contextmanager
from config import get_settings

settings = get_settings()

POSTGRESQL_DB_URL = (f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
                           f"{settings.POSTGRES_HOST}:{settings.POSTGRES_DB_PORT}/{settings.POSTGRES_DB}")

if not POSTGRESQL_DB_URL:
    raise RuntimeError("POSTGRESQL_DB_URL is not set")

postgresql_engine = create_engine(POSTGRESQL_DB_URL)
PostgresqlSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=postgresql_engine
)

def get_postgres_db() -> Generator[Session, None, None]:
    db = PostgresqlSessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_postgresql_db_contextmanager() -> Generator[Session, None, None]:
    db = PostgresqlSessionLocal()
    try:
        yield db
    finally:
        db.close()