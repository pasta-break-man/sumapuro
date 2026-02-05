# ファイル一覧（役割）

## フロントエンド

### エントリ・ルート
| ファイル | 役割 |
|----------|------|
| `frontend/src/main.jsx` | エントリポイント。CanvasPage をマウント。 |
| `frontend/src/App.jsx` | 別用の Konva キャンバス例（main では未使用）。 |
| `frontend/src/index.css` | グローバルスタイル。 |
| `frontend/src/App.css` | App 用スタイル。 |

### キャンバスページまわり（conponents）
| ファイル | 役割 |
|----------|------|
| `object.jsx` | キャンバスページ本体。右パネル（オブジェクト一覧・追加ボタン）＋ ObjectMenuWithCanvas。ページ表示時に DB リセット API を呼ぶ。 |
| `ObjectMenuWithCanvas.jsx` | キャンバス＋各種ポップアップの親。useCanvasEditor を利用し、Stage・中身ポップアップ・登録ポップアップ・削除確認・入れ子確認をまとめる。 |
| `ObjectCanvasStage.jsx` | Konva の Stage/Layer。オブジェクトを矩形または画像で描画。単一選択時に Transformer でリサイズ。 |
| `useCanvasEditor.js` | キャンバス用状態とロジック（items, 選択, ポップアップ, ドラッグ, 入れ子, 削除, 名前変更, API 呼び出しなど）をまとめたフック。 |
| `objects.js` | 配置可能なオブジェクト種別の定義（id, label, size, fill, imageUrl）。右パネルの一覧とドロップで使う。 |
| `contentsActions.js` | オブジェクト「中身」の追加・削除の純粋関数（addContentRow, deleteContentRowsByIndices）。 |

### ポップアップ・モーダル
| ファイル | 役割 |
|----------|------|
| `ContentsViewPopup.jsx` | オブジェクト中身閲覧ポップアップ。名前変更・入っているオブジェクト一覧・選択削除・入れ子の名前で中身表示・ドラッグでキャンバスに戻す。 |
| `RegisterPopup.jsx` | 中身 1 行登録用ポップアップ（名前・分類・数）。 |
| `DeleteConfirmModal.jsx` | オブジェクト削除の確認モーダル（長押しで表示）。 |
| `NestConfirmModal.jsx` | 別オブジェクトに重ねたときの「中に入れますか？」確認モーダル。 |

### その他フロント
| ファイル | 役割 |
|----------|------|
| `canvas.jsx` | KonvaCanvas（App.jsx）＋ツールバーを表示する別ページ。 |
| `1R.jsx` | 部屋の基本形（四角の壁）だけの Konva キャンバス。 |
| `features/items/tentative_item.js` | 仮のアイテム用ロジック。 |
| `features/sidepage/Inspector.jsx` | サイド用インスペクター UI。 |

---

## バックエンド

| ファイル | 役割 |
|----------|------|
| `backend/app.py` | Flask API。中身の追加・削除、オブジェクト名変更・削除、DB リセット。オブジェクト名をテーブル名として SQLite で管理。 |
| `backend/database.py` | SQLAlchemy の engine / Session / Base。SQLite（sumapuro.db）の接続設定。 |
| `backend/backdatas.py` | SQLAlchemy モデル（Item 等）。init_db で使う。 |
| `backend/checktable.py` | テーブル確認用の簡易スクリプト。 |
| `backend/sumapuro.db` | SQLite データベースファイル。 |
