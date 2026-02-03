from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# React(別ポート)からのアクセスを許可する設定
CORS(app)

@app.route('/api/data', methods=['GET'])
def get_data():
    # Reactに返すデータ (JSON形式)
    data = {
        "message": "Hello from Python Flask!",
        "status": "success"
    }
    return jsonify(data)

if __name__ == '__main__':
    # 5000番ポートでサーバーを起動
    app.run(debug=True, port=5000)