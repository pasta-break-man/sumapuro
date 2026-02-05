import React from "react";

const POPUP_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const CARD_STYLE = {
  width: 360,
  padding: 16,
  borderRadius: 8,
  background: "#020617",
  color: "#e5e7eb",
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};

const BTN_BASE = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #4b5563",
  background: "#111827",
  color: "#e5e7eb",
  fontSize: 12,
  cursor: "pointer",
};

/**
 * オブジェクト中身閲覧ポップアップ（名前変更・選択削除・＋で登録ポップアップへ）
 */
export default function ContentsViewPopup({
  popupItemId,
  items,
  popupContents,
  selectionMode,
  selectedRowIndices,
  renameEditing,
  renameDraft,
  onRenameDraftChange,
  onRenameApply,
  onRenameCancel,
  onRenameStart,
  onEnterSelectionMode,
  onOpenRegisterPopup,
  onCancelSelectionMode,
  onDeleteSelectedRows,
  onToggleRowSelection,
  onClosePopup,
  renameObject,
  nestedObjectNames = [],
}) {
  const popupItem = items.find((i) => i.id === popupItemId);
  const titleName = popupItem?.name ?? popupItem?.label ?? "オブジェクト";

  return (
    <div style={POPUP_STYLE}>
      <div style={CARD_STYLE}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          {renameEditing ? (
            <>
              <input
                type="text"
                value={renameDraft}
                onChange={(e) => onRenameDraftChange(e.target.value)}
                placeholder="オブジェクト名"
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 13,
                  width: 140,
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  const newName = renameDraft.trim();
                  if (newName) {
                    renameObject(popupItemId, newName);
                    onRenameApply(newName);
                  }
                }}
                style={{
                  ...BTN_BASE,
                  border: "1px solid #22c55e",
                  background: "#16a34a",
                }}
              >
                適用
              </button>
              <button type="button" onClick={onRenameCancel} style={BTN_BASE}>
                キャンセル
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRenameStart(popupItem?.name ?? popupItem?.label ?? "オブジェクト")}
              style={BTN_BASE}
            >
              名前変更
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{titleName}の中身</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={onEnterSelectionMode}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid #4b5563",
                background: "#111827",
                color: "#e5e7eb",
                fontSize: 18,
                lineHeight: "10px",
                cursor: "pointer",
              }}
            >
              -
            </button>
            <button
              type="button"
              onClick={onOpenRegisterPopup}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid #4b5563",
                background: "#111827",
                color: "#e5e7eb",
                fontSize: 18,
                lineHeight: "10px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>

        {nestedObjectNames.length > 0 && (
          <div
            style={{
              marginBottom: 8,
              padding: "8px 10px",
              borderRadius: 6,
              background: "#0f172a",
              fontSize: 13,
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: 4 }}>入っているオブジェクト</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {nestedObjectNames.map((name, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#1e293b",
                    color: "#e5e7eb",
                  }}
                >
                  {name || "オブジェクト"}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectionMode && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              onClick={onCancelSelectionMode}
              style={{
                ...BTN_BASE,
                background: "#020617",
              }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onDeleteSelectedRows}
              disabled={selectedRowIndices.length === 0}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #dc2626",
                background: "#991b1b",
                color: "#e5e7eb",
                fontSize: 12,
                cursor: selectedRowIndices.length === 0 ? "not-allowed" : "pointer",
                opacity: selectedRowIndices.length === 0 ? 0.6 : 1,
              }}
            >
              削除
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {popupContents.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: "#9ca3af",
                padding: "8px 4px",
              }}
            >
              中身はまだ登録されていません。
            </div>
          ) : (
            popupContents.map((row, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: selectionMode
                    ? "24px 1fr 1fr 0.8fr"
                    : "1fr 1fr 0.8fr",
                  gap: 8,
                  alignItems: "center",
                  padding: "6px 4px",
                  borderRadius: 4,
                  background: selectedRowIndices.includes(index)
                    ? "#1e3a5f"
                    : "transparent",
                }}
              >
                {selectionMode && (
                  <button
                    type="button"
                    onClick={() => onToggleRowSelection(index)}
                    style={{
                      width: 20,
                      height: 20,
                      padding: 0,
                      border: "1px solid #6b7280",
                      borderRadius: 4,
                      background: selectedRowIndices.includes(index)
                        ? "#3b82f6"
                        : "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    {selectedRowIndices.includes(index) ? "✓" : ""}
                  </button>
                )}
                <span style={{ fontSize: 13 }}>{row.name || "—"}</span>
                <span style={{ fontSize: 13 }}>{row.category || "—"}</span>
                <span style={{ fontSize: 13 }}>{row.count ?? "—"}</span>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onClosePopup}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
