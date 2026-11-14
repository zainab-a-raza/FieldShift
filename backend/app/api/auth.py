"""Authentication endpoints for farmer accounts."""
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.models.database import get_connection
from app.models.schemas import AuthResponse, LoginRequest, SignUpRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
SESSION_COOKIE = "fieldshift_session"
SESSION_DAYS = 30


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256$310000${salt.hex()}${derived_key.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        derived_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(derived_key.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _user_response(row) -> UserResponse:
    return UserResponse(id=row["id"], full_name=row["full_name"], email=row["email"])


def _create_session(user_id: str) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = _utc_now() + timedelta(days=SESSION_DAYS)
    conn = get_connection()
    conn.execute(
        "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (_token_hash(token), user_id, expires_at.isoformat()),
    )
    conn.commit()
    conn.close()
    return token, expires_at


def _set_session_cookie(response: Response, token: str, expires_at: datetime) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        secure=False,
        samesite="lax",
        expires=expires_at,
        max_age=SESSION_DAYS * 24 * 60 * 60,
    )


def _get_user_from_session(session_token: str | None):
    if not session_token:
        return None
    conn = get_connection()
    row = conn.execute(
        """
        SELECT users.*
        FROM auth_sessions
        JOIN users ON users.id = auth_sessions.user_id
        WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?
        """,
        (_token_hash(session_token), _utc_now().isoformat()),
    ).fetchone()
    conn.close()
    return row


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, response: Response):
    conn = get_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ? COLLATE NOCASE", (payload.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    conn.execute(
        "INSERT INTO users (id, full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, payload.full_name.strip(), payload.email.lower(), _hash_password(payload.password), _utc_now().isoformat()),
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    token, expires_at = _create_session(user_id)
    _set_session_cookie(response, token, expires_at)
    return AuthResponse(user=_user_response(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response):
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (payload.email,)).fetchone()
    conn.close()
    if not user or not _verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    token, expires_at = _create_session(user["id"])
    _set_session_cookie(response, token, expires_at)
    return AuthResponse(user=_user_response(user))


@router.get("/me", response_model=UserResponse)
def current_user(fieldshift_session: str | None = Cookie(default=None)):
    user = _get_user_from_session(fieldshift_session)
    if not user:
        raise HTTPException(status_code=401, detail="You are not signed in.")
    return _user_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, fieldshift_session: str | None = Cookie(default=None)):
    if fieldshift_session:
        conn = get_connection()
        conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (_token_hash(fieldshift_session),))
        conn.commit()
        conn.close()
    response.delete_cookie(SESSION_COOKIE)
