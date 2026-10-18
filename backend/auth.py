"""Users and login sessions, stored in a local SQLite file.

Passwords are scrypt hashes. Login returns a random bearer token; only its SHA-256 is
stored, so a copied database can't be used to log in. Manage users with manage.py.
"""

import hashlib
import hmac
import os
import secrets
import sqlite3
import threading
import time
from contextlib import contextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

DB_PATH = Path(os.environ.get("SONMIC_DB_PATH", Path(__file__).parent / "sonmic.db"))
SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

MAX_LOGIN_FAILURES = 5
LOCKOUT_SECONDS = 15 * 60


@contextmanager
def db():
    # One short-lived connection per call: FastAPI runs sync handlers on a thread pool.
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            );
            """
        )


# --- Passwords ---------------------------------------------------------------

_SCRYPT = {"n": 2**14, "r": 8, "p": 1, "dklen": 64}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), **_SCRYPT)
    return hmac.compare_digest(digest.hex(), digest_hex)


# Unknown usernames are checked against this, so they take as long as wrong passwords
# and response time doesn't reveal which usernames exist.
_DUMMY_HASH = hash_password(secrets.token_hex(16))


def normalize_username(username: str) -> str:
    return username.strip().lower()


# --- Users (used by manage.py) -----------------------------------------------


def set_user(username: str, password: str) -> None:
    with db() as conn:
        conn.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?) "
            "ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash",
            (normalize_username(username), hash_password(password), int(time.time())),
        )
        # A new password signs that user out everywhere.
        conn.execute("DELETE FROM sessions WHERE username = ?", (normalize_username(username),))


def remove_user(username: str) -> bool:
    with db() as conn:
        name = normalize_username(username)
        conn.execute("DELETE FROM sessions WHERE username = ?", (name,))
        return conn.execute("DELETE FROM users WHERE username = ?", (name,)).rowcount > 0


def list_users() -> list[str]:
    with db() as conn:
        return [row[0] for row in conn.execute("SELECT username FROM users ORDER BY username")]


# --- Sessions ----------------------------------------------------------------


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(username: str) -> tuple[str, int]:
    token = secrets.token_urlsafe(32)
    expires_at = int(time.time()) + SESSION_TTL_SECONDS
    with db() as conn:
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (int(time.time()),))
        conn.execute(
            "INSERT INTO sessions (token_hash, username, expires_at) VALUES (?, ?, ?)",
            (_token_hash(token), username, expires_at),
        )
    return token, expires_at


def session_user(token: str) -> str | None:
    with db() as conn:
        row = conn.execute(
            "SELECT username FROM sessions WHERE token_hash = ? AND expires_at > ?",
            (_token_hash(token), int(time.time())),
        ).fetchone()
    return row[0] if row else None


def end_session(token: str) -> None:
    with db() as conn:
        conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))


# --- Login rate limit (in memory: one backend process on one machine) ---------

_failures: dict[str, tuple[int, float]] = {}
_failures_lock = threading.Lock()


def _client_ip(request: Request) -> str:
    # Behind the Cloudflare tunnel every request comes from 127.0.0.1; the real client
    # is in CF-Connecting-IP. The backend only listens on localhost, so that header
    # can only be set by the tunnel or by someone already on this Mac.
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else "?")


def _locked_out(key: str) -> bool:
    with _failures_lock:
        count, reset_at = _failures.get(key, (0, 0.0))
        if reset_at < time.time():
            _failures.pop(key, None)
            return False
        return count >= MAX_LOGIN_FAILURES


def _record_failure(key: str) -> None:
    with _failures_lock:
        count, reset_at = _failures.get(key, (0, 0.0))
        if reset_at < time.time():
            count, reset_at = 0, time.time() + LOCKOUT_SECONDS
        _failures[key] = (count + 1, reset_at)


# --- API ---------------------------------------------------------------------

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    expires_at: int


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    username = session_user(credentials.credentials) if credentials else None
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, request: Request):
    username = normalize_username(body.username)
    key = f"{_client_ip(request)}:{username}"
    if _locked_out(key):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")

    with db() as conn:
        row = conn.execute("SELECT password_hash FROM users WHERE username = ?", (username,)).fetchone()
    valid = verify_password(body.password, row[0] if row else _DUMMY_HASH)
    if not (row and valid):
        _record_failure(key)
        raise HTTPException(status_code=401, detail="Wrong username or password")

    with _failures_lock:
        _failures.pop(key, None)
    token, expires_at = create_session(username)
    return LoginResponse(token=token, username=username, expires_at=expires_at)


@router.get("/me")
def me(username: str = Depends(current_user)):
    return {"username": username}


@router.post("/logout", status_code=204)
def logout(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)):
    if credentials:
        end_session(credentials.credentials)
