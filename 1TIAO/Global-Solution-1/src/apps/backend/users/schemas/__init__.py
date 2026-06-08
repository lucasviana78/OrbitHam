"""User API schemas."""
from __future__ import annotations

from ninja import Schema
from pydantic import EmailStr, Field


class RegisterIn(Schema):
    """Input schema for user registration."""

    email: EmailStr
    username: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(Schema):
    """Input schema for login."""

    email: EmailStr
    password: str = Field(min_length=1)


class UserOut(Schema):
    """Public representation of a user."""

    id: int
    email: str
    username: str
