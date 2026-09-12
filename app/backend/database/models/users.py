from database.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from sqlalchemy import (
    Integer,
    String,
    DateTime,
    func,
    Date,
    ForeignKey,
    UniqueConstraint, Boolean
)
from sqlalchemy import Enum as SQLAlchemyEnum
from typing import Optional
from enum import StrEnum
from datetime import date, datetime, timezone, timedelta
from database.validators import users as validators
from security.passwords import hash_password, verify_password
from security.utils import generate_secure_token

class GenderEnum(StrEnum):
    NOT_SPECIFIED = "Not Specified"
    MALE = "Male"
    FEMALE = "Female"

class UserModel(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key = True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    _hashed_password: Mapped[str] = mapped_column("hashed_password", String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    profile: Mapped[Optional["UserProfileModel"]] = relationship(
        "UserProfileModel",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    activation_token: Mapped[Optional["ActivationTokenModel"]] = relationship(
        "ActivationTokenModel",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    password_reset_token: Mapped[Optional["PasswordResetTokenModel"]] = relationship(
        "PasswordResetTokenModel",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    refresh_tokens: Mapped[Optional[list["RefreshTokenModel"]]] = relationship(
        "RefreshTokenModel",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    @classmethod
    def create(cls, email: str, raw_password: str) -> "UserModel":
        user = cls(emal=email)
        user.password = raw_password
        return user

    @property
    def password(self) -> str:
        raise AttributeError('Password is not a readable attribute. Use the setter to set the password')

    @password.setter
    def password(self, raw_password: str) -> None:
        validators.validate_password_strength(raw_password)
        self._hashed_password = hash_password(raw_password)

    def verify_password(self, raw_password: str) -> bool:
        return verify_password(raw_password, self._hashed_password)

    @validates('email')
    def validate_email(self, key: str, value: str) -> str:
        return validators.validate_email(value.lower())


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key = True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(256), nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(256))
    gender: Mapped[GenderEnum] = mapped_column(SQLAlchemyEnum(GenderEnum), nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True)

    user: Mapped[UserModel] = relationship("UserModel", back_populates="profile")

    __table_args__ = (UniqueConstraint("user_id"),)


class TokenBaseModel(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(Integer, primary_key = True, autoincrement=True)
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, default=generate_secure_token)
    expires: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc) + timedelta(days=1))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

class ActivationTokenModel(TokenBaseModel):
    __tablename__ = "activation_tokens"
    user: Mapped[UserModel] = relationship("UserModel", back_populates="activation_token")

    __table_args__ = (UniqueConstraint("user_id"),)


class PasswordResetTokenModel(TokenBaseModel):
    __tablename__ = "password_reset_tokens"
    user: Mapped[UserModel] = relationship("UserModel", back_populates="password_reset_token")

    __table_args__ = (UniqueConstraint("user_id"),)

class RefreshTokenModel(TokenBaseModel):
    __tablename__ = "refresh_tokens"
    user: Mapped[UserModel] = relationship("UserModel", back_populates="refresh_tokens")
    token: Mapped[str] = mapped_column(
        String(512),
        unique=True,
        nullable=False,
        default=generate_secure_token
    )

    @classmethod
    def create(cls, user_id: int, days_valid: int, token: str) -> "RefreshTokenModel":
        expires = datetime.now(timezone.utc) + timedelta(days=days_valid)
        return cls(user_id=user_id, token=token, expires=expires)