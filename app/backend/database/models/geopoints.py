from database.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float
from sqlalchemy import Enum as SQLAlchemyEnum
from enum import StrEnum

class GeoStatusEnum(StrEnum):
    VISITED = "Visited"
    NOT_VISITED = "Not Visited"

class GeoPointModel(Base):
    __tablename__ = 'geopoints'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    geo_latitude: Mapped[float] = mapped_column(Float, nullable=True)
    geo_longitude: Mapped[float] = mapped_column(Float, nullable=True)
    geo_link: Mapped[str] = mapped_column(String(256), nullable=True)
    status: Mapped[GeoStatusEnum] = mapped_column(SQLAlchemyEnum(GeoStatusEnum), nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=True)