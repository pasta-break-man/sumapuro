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
    """テーブル名として使うために安全な文字のみ残す（SQL インジェクション対策）"""
    if not name or not isinstance(name, str):
        return "object_unnamed"
    # 英数字・日本語・アンダースコアのみ許可、他は _ に
    s = re.sub(r"[^a-zA-Z0-9_\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]", "_", name.strip())
    return s[:80] if s else "object_unnamed"


def ensure_object_table(table_name):
    """オブジェクト名のテーブルがなければ作成"""
    safe = sanitize_table_name(table_name)
    with engine.connect() as conn:
        conn.execute(
            text(
                f'CREATE TABLE IF NOT EXISTS "{safe}" '
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, count INTEGER)"
            )
        )
        conn.commit()


@app.route("/api/data", methods=["GET"])
def get_data():
    data = {
        "message": "Hello from Python Flask!",
        "status": "success",
    }
    return jsonify(data)


@app.route("/api/contents", methods=["POST"])
def add_content():
    """オブジェクト中身を1行追加。テーブル名＝オブジェクト名。"""
    body = request.get_json()
    if not body or "object_name" not in body:
        return jsonify({"error": "object_name is required"}), 400

    object_name = body.get("object_name", "")
    row_name = body.get("name", "")
    category = body.get("category", "")
    count = int(body.get("count", 0)) if body.get("count") is not None else 0

    table_name = sanitize_table_name(object_name)
    ensure_object_table(object_name)

    with engine.connect() as conn:
        conn.execute(
            text(
                f'INSERT INTO "{table_name}" (name, category, count) VALUES (:name, :category, :count)'
            ),
            {"name": row_name, "category": category, "count": count},
        )
        conn.commit()
        row = conn.execute(text("SELECT last_insert_rowid()")).scalar()

    return jsonify({"id": row, "status": "created"}), 201


@app.route("/api/objects/rename", methods=["POST"])
def rename_object_table():
    """オブジェクト（テーブル）の名前変更"""
    body = request.get_json()
    if not body or "old_name" not in body or "new_name" not in body:
        return jsonify({"error": "old_name and new_name are required"}), 400

    old_name = sanitize_table_name(body["old_name"])
    new_name = sanitize_table_name(body["new_name"])
    if old_name == new_name:
        return jsonify({"status": "ok"}), 200

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": old_name},
        ).first()
        if not row:
            return jsonify({"status": "ok"}), 200
        conn.execute(text(f'ALTER TABLE "{old_name}" RENAME TO "{new_name}"'))
        conn.commit()
    return jsonify({"status": "renamed"}), 200


@app.route("/api/objects/<path:object_name>", methods=["DELETE"])
def drop_object_table(object_name):
    """オブジェクト削除時にそのテーブルを削除"""
    table_name = sanitize_table_name(object_name)
    with engine.connect() as conn:
        conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
        conn.commit()
    return jsonify({"status": "deleted"}), 200


@app.route("/api/contents/delete", methods=["POST"])
def delete_contents():
    """オブジェクト中身の指定行を削除（object_name と indices）"""
    body = request.get_json()
    if not body or "object_name" not in body or "indices" not in body:
        return jsonify({"error": "object_name and indices are required"}), 400

    object_name = body.get("object_name", "")
    indices = body.get("indices", [])
    if not isinstance(indices, list):
        return jsonify({"error": "indices must be an array"}), 400

    table_name = sanitize_table_name(object_name)
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
            {"n": table_name},
        ).first()
        if not row:
            return jsonify({"status": "ok"}), 200

        # id を id 昇順で取得し、指定インデックスの行を削除
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
