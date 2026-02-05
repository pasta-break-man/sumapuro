import React, { useRef, useState, useEffect } from "react";
import ObjectMenuWithCanvas from "./ObjectMenuWithCanvas";
import { OBJECT_TYPES } from "./objects";

const API_BASE = "http://localhost:5000";

/**
 * キャンバスページ：右スライドのオブジェクトメニュー + キャンバス
 * メニュー構成はここで定義（object.jsx の挙動に合わせる）
 */
export default function CanvasPage() {
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const canvasRef = useRef(null);

  // キャンバスページを開いたとき（サーバ再起動・リロードでキャンバスが空になるため DB も初期化）
  useEffect(() => {
    fetch(`${API_BASE}/api/db/reset`, { method: "POST" }).catch(() => {});
  }, []);

  const handleAddObject = (type) => {
    if (canvasRef.current?.addObjectFromType) {
      canvasRef.current.addObjectFromType(type);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        background: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* キャンバス（メニューは持たない） */}
      <ObjectMenuWithCanvas ref={canvasRef} />

      {/* 右トグルボタン */}
      <button
        onClick={() => setToolbarOpen((v) => !v)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2000,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "#fff",
          color: "#111827",
          cursor: "pointer",
        }}
      >
        {toolbarOpen ? "→ 閉じる" : "← 開く"}
      </button>

      {/* 右スライドパネル：オブジェクトメニュー */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: 300,
          padding: 12,
          background: "#ffffff",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 1500,
          transform: toolbarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
        }}
      >
        <h3 style={{ margin: "4px 0 12px", color: "#111827" }}>オブジェクト</h3>
        <p style={{ fontSize: 12, color: "#374151", marginBottom: 12 }}>
          クリックで左側に配置。ドラッグでキャンバスにドロップできます。
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {OBJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(t));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => handleAddObject(t)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#111827",
                cursor: "grab",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
