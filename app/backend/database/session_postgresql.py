from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Union, Any

from contextlib import contextmanager

POSTGRESQL_DB_URL = "postgresql://postgres_user:postgres_password@localhost:5432/postgres"

postgres_engine = create_engine(POSTGRESQL_DB_URL)
PostgresqlSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=postgres_engine)

def get_postgres_db() -> Union[Session, Any, None]:
    try:
        yield PostgresqlSessionLocal()
    finally:
        PostgresqlSessionLocal().close()

@contextmanager
def get_postgresql_db_contextmanager() -> Union[Session, Any, None]:
    try:
        yield PostgresqlSessionLocal()
    finally:
        PostgresqlSessionLocal().close()