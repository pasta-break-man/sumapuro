# app.py（例）
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, set_access_cookies, unset_jwt_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)

# JWT設定
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False          # 開発時。https本番ではTrue
app.config["JWT_COOKIE_SAMESITE"] = "Lax"        # 別サイト運用なら None + Secure を検討
app.config["JWT_COOKIE_CSRF_PROTECT"] = False    # 開発簡略（本番はTrue推奨）

jwt = JWTManager(app)

# CORS（Cookie送受信するので supports_credentials=True）
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

DB_PATH = "app.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

init_db()

@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or len(password) < 8:
        return jsonify({"message": "username と 8文字以上のpasswordが必要"}), 400

    pwhash = generate_password_hash(password)
    conn = get_conn()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, pwhash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"message": "username は既に使われています"}), 409
    conn.close()
    return jsonify({"ok": True}), 201

@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    conn = get_conn()
    row = conn.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"message": "IDまたはパスワードが違います"}), 401

    access_token = create_access_token(identity={"id": row["id"], "username": row["username"]})
    resp = jsonify({"ok": True, "user": {"id": row["id"], "username": row["username"]}})
    set_access_cookies(resp, access_token)
    return resp, 200

@app.get("/api/auth/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    return jsonify({"user": identity}), 200

@app.post("/api/auth/logout")
def logout():
    resp = jsonify({"ok": True})
    unset_jwt_cookies(resp)
    return resp, 200