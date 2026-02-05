import React from "react";

const CATEGORY_OPTIONS = [
  "",
  "薬",
  "本",
  "服",
  "パンツ",
  "ゲーム",
  "サプリメント",
  "CD",
  "DVD",
  "雑貨",
];

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 51,
};

const CARD_STYLE = {
  width: 320,
  padding: 16,
  borderRadius: 8,
  background: "#020617",
  color: "#e5e7eb",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

const INPUT_STYLE = {
  width: "100%",
  marginTop: 4,
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid #4b5563",
  background: "#020617",
  color: "#e5e7eb",
};

/**
 * 中身1行登録用ポップアップ（名前・分類・数）
 */
export default function RegisterPopup({
  registerDraft,
  onDraftChange,
  onConfirm,
  onCancel,
}) {
  return (
    <div style={OVERLAY_STYLE}>
      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          登録
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13 }}>
            名前
            <input
              type="text"
              value={registerDraft.name}
              onChange={(e) => onDraftChange({ name: e.target.value })}
              style={INPUT_STYLE}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            分類
            <select
              value={registerDraft.category}
              onChange={(e) => onDraftChange({ category: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">分類を選択</option>
              {CATEGORY_OPTIONS.filter(Boolean).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            数
            <input
              type="number"
              value={registerDraft.count}
              onChange={(e) => onDraftChange({ count: e.target.value })}
              style={INPUT_STYLE}
            />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
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
              border: "1px solid #22c55e",
              background: "#16a34a",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}
