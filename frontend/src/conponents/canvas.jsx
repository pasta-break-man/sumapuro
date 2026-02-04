import React, { useState } from "react";
import RoomCanvas from "../../components/canvas/RoomCanvas";

export default function CanvasPage() {
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        position: "relative",
      }}
    >
      {/* キャンバス領域 */}
      <div
        style={{
          flex: 1,
          background: "#f3f4f6",
        }}
      >
        <RoomCanvas />
      </div>

      {/* 右ツールバー */}
      {showToolbar ? (
        <div
          style={{
            width: 300,
            borderLeft: "1px solid #ddd",
            padding: 12,
            background: "#ffffff",
          }}
        >
          <button onClick={() => setShowToolbar(false)}>
            ツールバーを閉じる
          </button>

          <h3 style={{ marginTop: 12 }}>ツールバー</h3>
          <p>ここに操作UIを置く</p>
        </div>
      ) : (
        <button
          onClick={() => setShowToolbar(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
          }}
        >
          ツールバーを表示
        </button>
      )}
    </div>
  );
}
