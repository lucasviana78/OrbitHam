"""Custom exceptions raised by the users service layer."""
from __future__ import annotations


class UserNotFoundException(Exception):
    """Raised when a user cannot be located."""

    def __init__(self, message: str = "Usuário não encontrado") -> None:
        super().__init__(message)


class EmailAlreadyExistsException(Exception):
    """Raised when registering with an email that is already taken."""

    def __init__(self, message: str = "Email já cadastrado") -> None:
        super().__init__(message)


class UsernameAlreadyExistsException(Exception):
    """Raised when registering with a username that is already taken."""

    def __init__(self, message: str = "Nome de usuário já cadastrado") -> None:
        super().__init__(message)


class AuthenticationFailedException(Exception):
    """Raised when credentials are invalid."""

    def __init__(self, message: str = "Credenciais inválidas") -> None:
        super().__init__(message)


class InvalidTokenException(Exception):
    """Raised when a JWT is missing, expired or malformed."""

    def __init__(self, message: str = "Token inválido ou expirado") -> None:
        super().__init__(message)
