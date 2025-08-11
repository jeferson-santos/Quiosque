import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import RoleEnum


class UserBase(BaseModel):
    username: str = Field(..., min_length=4)
    role: RoleEnum


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    def validate_password(cls, v):
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserOut(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class UserPasswordUpdate(BaseModel):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    def validate_password(cls, v):
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserRoleUpdate(BaseModel):
    role: Literal["waiter", "administrator"]
