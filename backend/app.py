import re
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text

from database import engine, init_db

app = Flask(__name__)
CORS(app)

# 既存の items テーブル用（init_db で作成）
init_db()


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


def get_next_table_name(type_id):
    """type_id に対し、未使用の連番を付けたテーブル名を生成し、テーブルを作成して返す。例: book-shelf -> book-shelf_1"""
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
            if t == "items":
                continue
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


@app.route("/api/data", methods=["GET"])
def get_data():
    data = {
        "message": "Hello from Python Flask!",
        "status": "success",
    }
    return jsonify(data)


@app.route("/api/objects/next-table-name", methods=["POST"])
def create_next_table():
    """新規オブジェクト用に type_id からテーブル名を発行し、テーブルを作成する。例: book-shelf -> book-shelf_1"""
    body = request.get_json()
    if not body or "type_id" not in body:
        return jsonify({"error": "type_id is required"}), 400
    type_id = body.get("type_id", "")
    table_name = get_next_table_name(type_id)
    return jsonify({"table_name": table_name}), 201


@app.route("/api/contents", methods=["POST"])
def add_content():
    """オブジェクト中身を1行追加。table_name でテーブルを指定。object_name, nest_type, parent_table_name を持つ。"""
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
def rename_object_in_table():
    """指定テーブル内の object_name を一括更新（テーブル名は変更しない）"""
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
def drop_object_table(table_name):
    """オブジェクト削除時にそのテーブルを削除（table_name は type_id_数 形式）"""
    from urllib.parse import unquote

    decoded = unquote(table_name)
    name = sanitize_table_name(decoded)
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE IF EXISTS "{name}"'))
    return jsonify({"status": "deleted"}), 200


@app.route("/api/contents/delete", methods=["POST"])
def delete_contents():
    """オブジェクト中身の指定行を削除（table_name と indices）"""
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


@app.route("/api/db/reset", methods=["POST"])
def reset_db():
    """オブジェクト用テーブルをすべて削除し、キャンバス初期化に合わせる"""
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        ).fetchall()
        for (name,) in tables:
            if name == "items":
                continue
            conn.execute(text(f'DROP TABLE IF EXISTS "{name}"'))
        conn.commit()
    return jsonify({"status": "reset"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
