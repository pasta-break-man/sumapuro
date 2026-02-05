import React, { useMemo, useState } from "react";
import KonvaCanvas from "../App.jsx";

export default function CanvasPage() {
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [selectedTool, setSelectedTool] = useState(null);

  const tools = useMemo(
    () => [
      { id: "shelf", label: "棚" },
      { id: "desk", label: "机" },
      { id: "chair", label: "椅子" },
    ],
    []
  );

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        background: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* キャンバス */}
      <KonvaCanvas selectedTool={selectedTool} />

      {/* トグルボタン（常に表示） */}
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
          cursor: "pointer",
        }}
      >
        {toolbarOpen ? "→ 閉じる" : "← 開く"}
      </button>

      {/* 右からスライドするツールバー */}
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

          // ✅ スライド（右→左）
          transform: toolbarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
        }}
      >
        <h3 style={{ margin: "4px 0 12px" }}>オブジェクト</h3>

        {/* ボタン一覧 */}
        <div style={{ display: "grid", gap: 8 }}>
          {tools.map((t) => {
            const active = selectedTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTool(t.id)} 
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: active ? "2px solid #111827" : "1px solid #e5e7eb",
                  background: active ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                {t.label}
                {active ? "（選択中）" : ""}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
        </div>
      </div>
    </div>
  );
}