import React, { useState } from "react";
import KonvaCanvas from "../App.jsx";

// AI使用．確認済み
export default function CanvasPage() {
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <div
      style={{
        height: "100vh",
        position: "relative", // ← 重ねるために必須
        background: "#f3f4f6",
      }}
    >
      {/* キャンバス */}
      <KonvaCanvas />

      {/* ツールバー（重ね表示） */}
      {showToolbar && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 280,
            padding: 12,
            background: "#ffffff",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 1000, // ← Konvaより上
          }}
        >
          <button onClick={() => setShowToolbar(false)}>閉じる</button>

          <h3 style={{ marginTop: 12 }}>オブジェクト</h3>
          <p>棚</p>
        </div>
      )}

      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          オブジェクトを表示
        </button>
      )}
    </div>
  );
}
