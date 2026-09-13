from datetime import datetime, timezone

from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import cast

from config import get_settings, BaseAppSettings, get_jwt_auth_manager
from database.session_postgresql import get_postgres_db
from database.models.users import UserModel, ActivationTokenModel, PasswordResetTokenModel, RefreshTokenModel
from schemas.users import (
    UserRegistrationRequestSchema,
    UserRegistrationResponseSchema,
    MessageResponseSchema,
    UserActivationRequestSchema,
    PasswordResetRequestSchema,
    PasswordResetCompleteRequestSchema,
    UserLoginResponseSchema,
    UserLoginRequestSchema,
    TokenRefreshRequestSchema,
    TokenRefreshResponseSchema
)
from security.interfaces import JWTAuthManagerInterface

router = APIRouter()

@router.post("/register/",
             response_model=UserRegistrationResponseSchema,
             status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegistrationRequestSchema,
                  db: Session = Depends(get_postgres_db)) -> UserRegistrationResponseSchema:
    existing_user = db.query(UserModel).filter_by(email=user_data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with this email {user_data.email} already exists."
        )
    try:
        new_user = UserModel.create(
            email=user_data.email,
            raw_password=user_data.password
        )
        db.add(new_user)
        db.flush()

        activation_token = ActivationTokenModel(user_id=new_user.id)
        db.add(activation_token)

        db.commit()
        db.refresh(new_user)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during user creation."
        )
    else:
        return UserRegistrationResponseSchema.model_validate(new_user)

@router.post("/activate/",
             response_model=MessageResponseSchema,
             status_code=status.HTTP_200_OK,
             )
def activate_account(
        activation_data: UserActivationRequestSchema,
        db: Session = Depends(get_postgres_db)
) -> MessageResponseSchema:
    token_record = db.query(ActivationTokenModel).join(UserModel).filter(
        UserModel.email == activation_data.email,
        ActivationTokenModel.token == activation_data.token
    ).first()

    if (not token_record or cast(datetime, token_record.expires).replace(tzinfo=timezone.utc) < datetime.now(timezone.utc)):
        if token_record:
            db.delete(token_record)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired activation token."
        )

    user = token_record.user
    if user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already active")

    user.is_active = True
    db.delete(token_record)
    db.commit()

    return MessageResponseSchema(message="User account activated successfully.")

def request_password_reset_token(
        data: PasswordResetRequestSchema,
        db: Session = Depends(get_postgres_db),
) -> MessageResponseSchema:
    user = db.query(UserModel).filter_by(email=data.email).first()

    if not user or not user.is_active:
        return MessageResponseSchema(
            message="If you are registered, you will receive an email with instructions."
        )

    db.query(PasswordResetTokenModel).filter_by(user_id=user.id).delete()

    reset_token = PasswordResetTokenModel(user_id=cast(int, user.id))
    db.add(reset_token)
    db.commit()

    return MessageResponseSchema(
        message="If you are registered, you will receive an email with instructions."
    )

@router.post(
    "/reset-password/complete/",
    response_model=MessageResponseSchema,
    description="Reset a user's password if a valid token is provided.",
    status_code=status.HTTP_200_OK,
)
def reset_password(
        data: PasswordResetCompleteRequestSchema,
        db: Session = Depends(get_postgres_db),
) -> MessageResponseSchema:

    user = db.query(UserModel).filter_by(email=data.email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or token."
        )

    token_record = db.query(PasswordResetTokenModel).filter_by(user_id=user.id).first()

    expires_at = cast(datetime, token_record.expires_at).replace(tzinfo=timezone.utc)

    if not token_record or token_record.token != data.token or expires_at < datetime.now(timezone.utc):
        if token_record:
            db.delete(token_record)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or token."
        )

    try:
        user.password = data.password
        db.delete(token_record)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting the password."
        )

    return MessageResponseSchema(message="Password reset successfully.")

@router.post(
    "/login/",
    response_model=UserLoginResponseSchema,
    description="Authenticate a user and return access and refresh tokens.",
    status_code=status.HTTP_201_CREATED,
)
def login_user(
        login_data: UserLoginRequestSchema,
        db: Session = Depends(get_postgres_db),
        settings: BaseAppSettings = Depends(get_settings),
        jwt_manager: JWTAuthManagerInterface = Depends(get_jwt_auth_manager),
) -> UserLoginResponseSchema:

    user = cast(UserModel, db.query(UserModel).filter_by(email=login_data.email).first())
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not activated.",
        )

    jwt_refresh_token = jwt_manager.create_refresh_token({"user_id": user.id})

    try:
        refresh_token = RefreshTokenModel.create(
            user_id=user.id,
            days_valid=settings.LOGIN_TIME_DAYS,
            token=jwt_refresh_token
        )
        db.add(refresh_token)
        db.flush()
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the request.",
        )

    jwt_access_token = jwt_manager.create_access_token({"user_id": user.id})
    return UserLoginResponseSchema(
        access_token=jwt_access_token,
        refresh_token=jwt_refresh_token,
    )

@router.post(
    "/refresh/",
    response_model=TokenRefreshResponseSchema,
    description="Refresh the access token using a valid refresh token.",
    status_code=status.HTTP_200_OK,
)
def refresh_access_token(
        token_data: TokenRefreshRequestSchema,
        db: Session = Depends(get_postgres_db),
        jwt_manager: JWTAuthManagerInterface = Depends(get_jwt_auth_manager),
) -> TokenRefreshResponseSchema:
    """
    Endpoint to refresh an access token.

    Validates the provided refresh token, extracts the user ID from it, and issues
    a new access token. If the token is invalid or expired, an error is returned.
    """
    try:
        decoded_token = jwt_manager.decode_refresh_token(token_data.refresh_token)
        user_id = decoded_token.get("user_id")
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    refresh_token_record = db.query(RefreshTokenModel).filter_by(token=token_data.refresh_token).first()
    if not refresh_token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found.",
        )

    user = db.query(UserModel).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    new_access_token = jwt_manager.create_access_token({"user_id": user_id})

    return TokenRefreshResponseSchema(access_token=new_access_token)
