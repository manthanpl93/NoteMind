from cryptography.fernet import Fernet
from database import settings


def get_fernet() -> Fernet:
    """Get Fernet instance using the encryption key from settings."""
    return Fernet(settings.encryption_key.encode())


def encrypt_api_key(key: str) -> str:
    """Encrypt an API key and return base64 encoded string."""
    if not key:
        return ""
    fernet = get_fernet()
    encrypted = fernet.encrypt(key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted: str) -> str:
    """Decrypt an encrypted API key back to plaintext."""
    if not encrypted:
        return ""
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted.encode())
    return decrypted.decode()


def mask_api_key(key: str | None) -> str | None:
    """Mask an API key for display (e.g., 'sk-...xxxx')."""
    if not key:
        return None
    if len(key) <= 8:
        return "****"
    return f"{key[:4]}...{key[-4:]}"

