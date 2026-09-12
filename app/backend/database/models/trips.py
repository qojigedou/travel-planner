from database.models.base import Base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Column, String, Float, Date, Table, ForeignKey
from sqlalchemy import Enum as SQLAlchemyEnum
from enum import StrEnum
import datetime

geopoints_trips = Table(
    "geopoints_trips",
    Base.metadata,
    Column(
        "geopoint_id",
        ForeignKey("geopoints.id", ondelete="CASCADE"),
        primary_key=True, nullable=False
    ),
    Column(
        "trip_id",
        ForeignKey("trips.id", ondelete="CASCADE"),
        primary_key=True, nullable=False
    ),
)

class GeoStatusEnum(StrEnum):
    VISITED = "Visited"
    NOT_VISITED = "Not Visited"

class GeoPointModel(Base):
    __tablename__ = 'geopoints'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    geo_latitude: Mapped[float] = mapped_column(Float, nullable=True)
    geo_longitude: Mapped[float] = mapped_column(Float, nullable=True)
    geo_link: Mapped[str] = mapped_column(String(3000), nullable=True)
    status: Mapped[GeoStatusEnum] = mapped_column(SQLAlchemyEnum(GeoStatusEnum), nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=True)
    addition_date: Mapped[datetime.datetime] = mapped_column(Date, nullable=False) # TODO: Change logic

    trips: Mapped[list["TripModel"]] = relationship(
        "TripModel",
        secondary=geopoints_trips,
        back_populates="geopoints",
    )

    @classmethod
    def default_order_by(cls):
        return [cls.id.desc()]

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

    geopoints: Mapped[list['GeoPointModel']] = relationship(
        "GeoPointModel",
        secondary=geopoints_trips,
        back_populates="trips"
    )

    @classmethod
    def default_order_by(cls):
        return [cls.id.desc()]
