import hashlib
import json
import os
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

jwt = JWTManager(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])


# JWT エラー時は 401 で返す。code で原因を区別（原因特定用）
@jwt.unauthorized_loader
def unauthorized_callback(reason):
    # ここが鳴る = リクエストに JWT が含まれていない（Cookie が送られていない可能性が高い）
    print("[JWT] 401 unauthorized:", reason)
    return jsonify({
        "msg": reason or "ログインが必要です",
        "code": "missing",
        "detail": "Cookie が送信されていません。同一オリジンでない（例: フロント 5173 / バック 5000）とブラウザが Cookie を送らない場合があります。",
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(reason):
    # ここが鳴る = Cookie はあるがトークンの中身が壊れている・改ざん
    print("[JWT] 401 invalid_token:", reason)
    return jsonify({
        "msg": reason or "トークンが無効です",
        "code": "invalid",
    }), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    # ここが鳴る = トークン有効期限切れ
    print("[JWT] 401 expired_token")
    return jsonify({
        "msg": "トークンの有効期限が切れました",
        "code": "expired",
    }), 401


# アカウント管理: backend フォルダの JSON ファイル（サーバ落ちても永続）
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ACCOUNTS_JSON = os.path.join(BACKEND_DIR, "accounts.json")
DATA_DIR = os.path.join(BACKEND_DIR, "data")
_user_engines = {}


def load_accounts():
    if not os.path.exists(ACCOUNTS_JSON):
        return []
    try:
        with open(ACCOUNTS_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def save_accounts(accounts):
    with open(ACCOUNTS_JSON, "w", encoding="utf-8") as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)


def username_to_db_key(username):
    """アカウント毎に一意なDBファイル名用キー。日本語なども別ユーザなら別DBになる。"""
    if not username or not isinstance(username, str):
        return "anonymous"
    raw = username.strip().encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:32]


def _ensure_user_meta_and_map(engine, username, key):
    """DB内に meta テーブルでユーザー名を保存し、user_map.json にユーザー→ファイル名を追記。"""
    with engine.connect() as conn:
        conn.execute(
            text("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
        )
        conn.execute(
            text("INSERT OR REPLACE INTO meta (key, value) VALUES ('username', :u)"),
            {"u": username},
        )
        conn.commit()
    map_path = os.path.join(DATA_DIR, "user_map.json")
    try:
        m = {}
        if os.path.exists(map_path):
            with open(map_path, "r", encoding="utf-8") as f:
                m = json.load(f)
    except Exception:
        m = {}
    m[username] = f"{key}.db"
    try:
        with open(map_path, "w", encoding="utf-8") as f:
            json.dump(m, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def get_engine_for_user(username):
    """アカウント毎のDBエンジン（data/{hash}.db）。サーバ落ちてもファイルは残る。"""
    key = username_to_db_key(username)
    if key not in _user_engines:
        os.makedirs(DATA_DIR, exist_ok=True)
        path = os.path.join(DATA_DIR, f"{key}.db")
        uri = f"sqlite:///{path}"
        _user_engines[key] = create_engine(
            uri.replace("\\", "/"),
            connect_args={"check_same_thread": False},
        )
        _ensure_user_meta_and_map(_user_engines[key], username, key)
    return _user_engines[key]


def sanitize_table_name(name):
    """テーブル名として安全な文字のみ残す（type_id_1 形式: 英数字・ハイフン・アンダースコア）"""
    if not name or not isinstance(name, str):
        return "object_unnamed"
    s = re.sub(r"[^a-zA-Z0-9_\-]", "", name.strip())
    return s[:80] if s else "object_unnamed"


def sanitize_type_id(type_id):
    """type_id 用（英数字・ハイフンのみ。連番付きテーブル名のプレフィックス）"""
    if not type_id or not isinstance(type_id, str):
        return "object"
    s = re.sub(r"[^a-zA-Z0-9\-]", "", type_id.strip())
    return s[:60] if s else "object"


def escape_like(value):
    """LIKE 句で % _ をリテラルとして検索するためにエスケープする（部分一致用）"""
    if not value:
        return value
    return str(value).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# 中身テーブルのカラム: id, object_name, name, category, count, nest_type, parent_table_name
CONTENT_TABLE_COLS = (
    "id INTEGER PRIMARY KEY AUTOINCREMENT, "
    "object_name TEXT, "
    "name TEXT, "
    "category TEXT, "
    "count INTEGER, "
    "nest_type INTEGER, "
    "parent_table_name TEXT"
)


def get_next_table_name(engine, type_id):
    """type_id に対し、未使用の連番を付けたテーブル名を生成し、テーブルを作成して返す。"""
    prefix = sanitize_type_id(type_id)
    if not prefix:
        prefix = "object"
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        ).fetchall()
        existing = []
        for (t,) in tables:
            if t.startswith(prefix + "_"):
                suffix = t[len(prefix) + 1 :]
                if suffix.isdigit():
                    existing.append(int(suffix))
        next_num = max(existing, default=0) + 1
        table_name = f"{prefix}_{next_num}"
        table_name = sanitize_table_name(table_name)
        conn.execute(
            text(
                f'CREATE TABLE IF NOT EXISTS "{table_name}" ({CONTENT_TABLE_COLS})'
            )
        )
        conn.commit()
    return table_name


def get_current_user_engine():
    """JWT から現在ユーザを取得し、そのアカウント用の DB エンジンを返す。未認証は 401。"""
    identity = get_jwt_identity()
    if not identity:
        return None, None
    # identity はログイン時に文字列（username）で保存している
    username = identity if isinstance(identity, str) else (identity.get("username") if isinstance(identity, dict) else None)
    if not username:
        return None, None
    return username, get_engine_for_user(username)


@app.route("/api/data", methods=["GET"])
def get_data():
    data = {
        "message": "Hello from Python Flask!",
        "status": "success",
    }
    return jsonify(data)


@app.route("/api/objects/next-table-name", methods=["POST"])
@jwt_required()
def create_next_table():
    """新規オブジェクト用に type_id からテーブル名を発行し、テーブルを作成する（アカウント毎DB）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json()
    if not body or "type_id" not in body:
        return jsonify({"error": "type_id is required"}), 400
    type_id = body.get("type_id", "")
    table_name = get_next_table_name(engine, type_id)
    return jsonify({"table_name": table_name}), 201


@app.route("/api/contents", methods=["POST"])
@jwt_required()
def add_content():
    """オブジェクト中身を1行追加（アカウント毎DB）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json()
    if not body or "table_name" not in body:
        return jsonify({"error": "table_name is required"}), 400

    table_name = sanitize_table_name(body.get("table_name", ""))
    if not table_name:
        return jsonify({"error": "table_name is invalid"}), 400

    object_name = body.get("object_name", "")
    row_name = body.get("name", "")
    category = body.get("category", "")
    count = int(body.get("count", 0)) if body.get("count") is not None else 0
    nest_type = int(body.get("nest_type", 0))
    if nest_type not in (0, 1, 2):
        nest_type = 0
    parent_table_name = body.get("parent_table_name") or None
    if parent_table_name is not None:
        parent_table_name = sanitize_table_name(str(parent_table_name)) or None

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": table_name},
        ).first()
        if not row:
            return jsonify({"error": f"table {table_name} does not exist"}), 404

        conn.execute(
            text(
                f'INSERT INTO "{table_name}" '
                "(object_name, name, category, count, nest_type, parent_table_name) "
                "VALUES (:object_name, :name, :category, :count, :nest_type, :parent_table_name)"
            ),
            {
                "object_name": object_name,
                "name": row_name,
                "category": category,
                "count": count,
                "nest_type": nest_type,
                "parent_table_name": parent_table_name,
            },
        )
        conn.commit()
        row_id = conn.execute(text("SELECT last_insert_rowid()")).scalar()

    return jsonify({"id": row_id, "status": "created"}), 201


@app.route("/api/objects/rename", methods=["POST"])
@jwt_required()
def rename_object_in_table():
    """指定テーブル内の object_name を一括更新（アカウント毎DB）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json()
    if not body or "table_name" not in body or "new_name" not in body:
        return jsonify({"error": "table_name and new_name are required"}), 400

    table_name = sanitize_table_name(body.get("table_name", ""))
    new_name = (body.get("new_name") or "").strip()
    if not table_name:
        return jsonify({"error": "table_name is invalid"}), 400

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": table_name},
        ).first()
        if not row:
            return jsonify({"status": "ok"}), 200

        conn.execute(
            text(f'UPDATE "{table_name}" SET object_name = :new_name'),
            {"new_name": new_name},
        )
        conn.commit()
    return jsonify({"status": "renamed"}), 200


@app.route("/api/objects/<path:table_name>", methods=["DELETE"])
@jwt_required()
def drop_object_table(table_name):
    """オブジェクト削除時にそのテーブルを削除（アカウント毎DB）。"""
    from urllib.parse import unquote

    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    decoded = unquote(table_name)
    name = sanitize_table_name(decoded)
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE IF EXISTS "{name}"'))
    return jsonify({"status": "deleted"}), 200


@app.route("/api/contents/delete", methods=["POST"])
@jwt_required()
def delete_contents():
    """オブジェクト中身の指定行を削除（アカウント毎DB）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json()
    if not body or "table_name" not in body or "indices" not in body:
        return jsonify({"error": "table_name and indices are required"}), 400

    table_name = sanitize_table_name(body.get("table_name", ""))
    indices = body.get("indices", [])
    if not table_name:
        return jsonify({"error": "table_name is invalid"}), 400
    if not isinstance(indices, list):
        return jsonify({"error": "indices must be an array"}), 400

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": table_name},
        ).first()
        if not row:
            return jsonify({"status": "ok"}), 200

        ids_result = conn.execute(
            text(f'SELECT id FROM "{table_name}" ORDER BY id')
        ).fetchall()
        ids_list = [r[0] for r in ids_result]
        to_delete = [ids_list[i] for i in indices if 0 <= i < len(ids_list)]
        if to_delete:
            placeholders = ", ".join(f":id{i}" for i in range(len(to_delete)))
            params = {f"id{i}": v for i, v in enumerate(to_delete)}
            conn.execute(
                text(f'DELETE FROM "{table_name}" WHERE id IN ({placeholders})'),
                params,
            )
            conn.commit()
    return jsonify({"status": "deleted"}), 200


@app.route("/api/contents/search", methods=["POST"])
@jwt_required()
def search_contents():
    """名前・分類で中身を検索（アカウント毎DB）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json() or {}
    search_name = (body.get("name") or "").strip()
    search_category = (body.get("category") or "").strip()
    if not search_name and not search_category:
        return jsonify({"matches": []}), 200

    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        ).fetchall()
        results = []
        for (table_name,) in tables:
            # テーブル名は type_id_N 形式のみ（アンダースコア＋数字で終わる）
            if "_" not in table_name or not table_name.split("_")[-1].isdigit():
                continue
            try:
                # 部分一致: name, category を LIKE %...% で検索（% _ はエスケープ）
                name_pattern = (
                    "%" + escape_like(search_name) + "%" if search_name else "%"
                )
                category_pattern = (
                    "%" + escape_like(search_category) + "%" if search_category else "%"
                )
                rows = conn.execute(
                    text(
                        f'SELECT DISTINCT parent_table_name FROM "{table_name}" '
                        "WHERE name LIKE :name_pattern ESCAPE '\\' AND category LIKE :category_pattern ESCAPE '\\'"
                    ),
                    {"name_pattern": name_pattern, "category_pattern": category_pattern},
                ).fetchall()
                for (parent_table_name,) in rows:
                    results.append(
                        {
                            "table_name": table_name,
                            "parent_table_name": parent_table_name,
                        }
                    )
            except Exception:
                continue
    return jsonify({"matches": results}), 200


def ensure_canvas_state_table(conn):
    conn.execute(
        text(
            "CREATE TABLE IF NOT EXISTS canvas_state (id INTEGER PRIMARY KEY, state TEXT)"
        )
    )
    conn.commit()


@app.route("/api/canvas/state", methods=["GET"])
@jwt_required()
def get_canvas_state():
    """保存されたキャンバス状態を返す（アカウント毎DB）。リロード後も復元。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    with engine.connect() as conn:
        ensure_canvas_state_table(conn)
        row = conn.execute(
            text("SELECT state FROM canvas_state WHERE id = 1")
        ).fetchone()
    if not row or not row[0]:
        return jsonify({"state": None}), 200
    try:
        state = json.loads(row[0])
    except Exception:
        return jsonify({"state": None}), 200
    return jsonify({"state": state}), 200


@app.route("/api/canvas/state", methods=["POST"])
@jwt_required()
def save_canvas_state():
    """キャンバス状態を保存する（アカウント毎DB）。UI操作でのみ変化。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json() or {}
    state = data.get("state")
    if state is None:
        return jsonify({"error": "state required"}), 400
    with engine.connect() as conn:
        ensure_canvas_state_table(conn)
        conn.execute(
            text("INSERT OR REPLACE INTO canvas_state (id, state) VALUES (1, :s)"),
            {"s": json.dumps(state, ensure_ascii=False)},
        )
        conn.commit()
    return jsonify({"status": "saved"}), 200


@app.route("/api/db/reset", methods=["POST"])
@jwt_required()
def reset_db():
    """そのアカウントのオブジェクト用テーブルとキャンバス状態をクリア（明示的初期化用）。"""
    _, engine = get_current_user_engine()
    if not engine:
        return jsonify({"error": "unauthorized"}), 401
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        ).fetchall()
        for (name,) in tables:
            conn.execute(text(f'DROP TABLE IF EXISTS "{name}"'))
        conn.commit()
    return jsonify({"status": "reset"}), 200


@app.route("/api/auth/register", methods=["POST"])
def register():
    """新規登録。アカウント名は完全一致で重複不可。backend/accounts.json に保存。"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username:
        return jsonify({"message": "アカウント名を入力してください"}), 400
    accounts = load_accounts()
    for a in accounts:
        if a.get("username") == username:
            return jsonify({"message": "このアカウント名は既に使われています"}), 409
    pwhash = generate_password_hash(password)
    accounts.append({"username": username, "password_hash": pwhash})
    save_accounts(accounts)
    return jsonify({"ok": True}), 201


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """ログイン。accounts.json で完全一致のアカウント名を検索。"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    accounts = load_accounts()
    for a in accounts:
        if a.get("username") == username:
            if check_password_hash(a.get("password_hash", ""), password):
                # identity は文字列必須（dict だと "Subject must be a string" で 401 になる）
                access_token = create_access_token(identity=username)
                resp = jsonify({"ok": True, "user": {"id": username, "username": username}})
                set_access_cookies(resp, access_token)
                return resp, 200
            break
    return jsonify({"message": "IDまたはパスワードが違います"}), 401


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def auth_me():
    identity = get_jwt_identity()
    # identity は文字列（username）。フロントは { id, username } を期待するので揃える
    username = identity if isinstance(identity, str) else (identity.get("username") if isinstance(identity, dict) else None)
    return jsonify({"user": {"id": username, "username": username}}), 200


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    resp = jsonify({"ok": True})
    unset_jwt_cookies(resp)
    return resp, 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
