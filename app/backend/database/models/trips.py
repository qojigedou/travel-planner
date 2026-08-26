from sqlalchemy import String, Date
from database.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Enum as SQLAlchemyEnum
from enum import StrEnum
import datetime

class TripStatusEnum(StrEnum):
    PLANNED = "Planned"
    ACTIVE = "Active"
    DONE = "Done"

class TripModel(Base):
    __tablename__ = 'trips'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=True, default="Hi Trip")
    status: Mapped[TripStatusEnum] = mapped_column(SQLAlchemyEnum(TripStatusEnum), nullable=False)
    date: Mapped[datetime.datetime] = mapped_column(Date, nullable=False)

