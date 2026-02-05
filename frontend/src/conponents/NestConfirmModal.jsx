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
  width: 320,
  padding: 20,
  borderRadius: 8,
  background: "#020617",
  color: "#e5e7eb",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

/**
 * オブジェクトを別オブジェクトに重ねたときの入れ子確認モーダル
 */
export default function NestConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={OVERLAY_STYLE}>
      <div style={CARD_STYLE}>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          オブジェクトを中に入れますか？
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
            いいえ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #22c55e",
              background: "#16a34a",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            はい
          </button>
        </div>
      </div>
    </div>
  );
}
