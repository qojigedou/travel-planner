from pydantic import BaseModel, EmailStr, field_validator
from database.validators.users import validate_password_strength
class BaseEmailPasswordSchema(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "from_attributes": True
    }

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        return validate_password_strength(value)

class PasswordResetRequestSchema(BaseEmailPasswordSchema):
    email: EmailStr

class PasswordResetCompleteRequestSSchema(BaseEmailPasswordSchema):
    token: str

class UserLoginResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserRegistrationResponseSchema(BaseModel):
    id: int
    email: EmailStr

    model_config = {
        "from_attributes": True
    }

class UserRegistrationRequestSchema(BaseEmailPasswordSchema):
    pass

class UserLoginRequestSchema(BaseEmailPasswordSchema):
    pass


class MessageResponseSchema(BaseModel):
    message: str

class TokenRefreshRequestSchema(BaseModel):
    refresh_token: str

class TokenRefreshResponseSchema(BaseModel):
    access_token: str
    refresh_token: str = "bearer"

class PasswordResetCompleteRequestSchema(BaseEmailPasswordSchema):
    token: str