import React from "react";

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 52,
};

const CARD_STYLE = {
  width: 280,
  padding: 20,
  borderRadius: 8,
  background: "#020617",
  color: "#e5e7eb",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

/**
 * オブジェクト削除確認モーダル（1秒長押しで表示）
 */
export default function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={OVERLAY_STYLE}>
      <div style={CARD_STYLE}>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          このオブジェクトを削除しますか？
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #dc2626",
              background: "#991b1b",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
