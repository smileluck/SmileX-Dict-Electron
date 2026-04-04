from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        plain_password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(plain_password, hashed_password)


SPECIAL_CHARS = set("!@#$%^&*()_+-=[]{}|;:',.<>?/`~")


def validate_password_strength(password: str) -> str | None:
    if len(password) < 8:
        return "密码需要至少8个字符"
    if not any(c.isupper() for c in password):
        return "密码需要包含大写字母"
    if not any(c.islower() for c in password):
        return "密码需要包含小写字母"
    if not any(c.isdigit() for c in password):
        return "密码需要包含数字"
    if not any(c in SPECIAL_CHARS for c in password):
        return "密码需要包含特殊字符(!@#等)"
    if any(not c.isalnum() and c not in SPECIAL_CHARS for c in password):
        return "密码只能包含字母、数字和特殊字符"
    return None
