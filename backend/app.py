from flask import Flask, jsonify, request
from flask_cors import CORS

from database import init_db, get_db
from backdatas import Item

app = Flask(__name__)
CORS(app)

# 起動時にテーブル作成
init_db()


@app.route("/api/data", methods=["GET"])
def get_data():
    data = {
        "message": "Hello from Python Flask!",
        "status": "success",
    }
    return jsonify(data)


@app.route("/api/contents", methods=["POST"])
def add_content():
    """オブジェクト中身を1行追加（フロントの「登録」で呼ぶ）"""
    body = request.get_json()
    if not body or "object_id" not in body:
        return jsonify({"error": "object_id is required"}), 400

    object_id = body.get("object_id", "")
    name = body.get("name", "")
    category = body.get("category", "")
    count = int(body.get("count", 0)) if body.get("count") is not None else 0

    db = next(get_db())
    try:
        row = Item(
            storage_id=object_id,
            name=name,
            category=category,
            count=count,
        )
        db.add(row)
        db.commit()
        db.refresh(row)  # commit 後に id を取得
        return jsonify({"id": row.id, "status": "created"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
