from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from contextlib import contextmanager

POSTGRESQL_DB_URL = os.getenv("POSTGRESQL_DB_URL")
postgres_engine = create_engine(POSTGRESQL_DB_URL)
PostgresqlSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=postgres_engine
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