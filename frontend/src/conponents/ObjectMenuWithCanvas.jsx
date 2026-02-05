import React, { useRef, useEffect } from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";
import { OBJECT_TYPES } from "./objects";
import { useCanvasEditor } from "./useCanvasEditor";

/**
 * objects.js で定義したオブジェクト一覧をメニューとして表示し、
 * クリックでCanvas上に追加、その後ドラッグで移動できるコンポーネント
 */
const ObjectMenuWithCanvas = () => {
  const stageWidth = 900;
  const stageHeight = 520;

  const {
    items,
    selectedIds,
    popupItemId,
    popupContents,
    selectionMode,
    selectedRowIndices,
    registerPopupOpen,
    registerDraft,
    addObjectFromType,
    handleDragEnd,
    toggleSelect,
    clearSelection,
    openPopupFor,
    closePopup,
    openRegisterPopup,
    closeRegisterPopup,
    updateRegisterDraft,
    confirmRegisterAdd,
    enterSelectionMode,
    cancelSelectionMode,
    toggleRowSelection,
    deleteSelectedRows,
    resizeItem,
    moveSelectedBy,
    deleteConfirmItemId,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
  } = useCanvasEditor({ stageWidth, stageHeight });

  const LONG_PRESS_MS = 1000;
  const longPressTimerRef = useRef(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPressTimer = (itemId) => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      openDeleteConfirm(itemId);
    }, LONG_PRESS_MS);
  };

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

  // Transformer 用の ref（単一選択時にのみ有効にするシンプルな実装）
  const trRef = useRef(null);
  const shapeRefs = useRef({});
  const lastDragPosRef = useRef(null);

  // 単一選択時に Transformer を選択中ノードに紐付ける
  useEffect(() => {
    if (!trRef.current) return;

    if (selectedIds.length === 1) {
      const node = shapeRefs.current[selectedIds[0]];
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, items]);

  return (
    <div style={{ padding: 16, display: "flex", gap: 16 }}>
      {/* 左側：オブジェクト選択メニュー */}
      <div
        style={{
          width: 240,
          border: "1px solid #444",
          borderRadius: 8,
          padding: 12,
          background: "#111827",
          color: "#e5e7eb",
          fontSize: 14,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          オブジェクトメニュー（仮）
        </div>
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          クリックするとCanvas中央付近に追加され、ドラッグで移動できます。
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {OBJECT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => addObjectFromType(type)}
              style={{
                padding: "6px 8px",
                textAlign: "left",
                borderRadius: 6,
                border: "1px solid #4b5563",
                background: "#1f2937",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 右側：Canvas */}
      <div>
        <Stage
          width={stageWidth}
          height={stageHeight}
          style={{ border: "1px solid #333", background: "#020617" }}
          onMouseDown={(e) => {
            // 背景クリックで選択解除
            if (e.target === e.target.getStage()) {
              clearSelection();
            }
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) {
              clearSelection();
            }
          }}
        >
          <Layer>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <Rect
                  ref={(node) => {
                    if (node) shapeRefs.current[item.id] = node;
                  }}
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={item.height}
                  fill={item.fill}
                  stroke={selectedIds.includes(item.id) ? "#facc15" : undefined}
                  strokeWidth={selectedIds.includes(item.id) ? 3 : 0}
                  shadowBlur={selectedIds.includes(item.id) ? 8 : 0}
                  cornerRadius={10}
                  draggable
                  onMouseDown={() => startLongPressTimer(item.id)}
                  onTouchStart={() => startLongPressTimer(item.id)}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchEnd={clearLongPressTimer}
                  onDragStart={(e) => {
                    clearLongPressTimer();
                    lastDragPosRef.current = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                  }}
                  onDragMove={(e) => {
                    const last = lastDragPosRef.current;
                    if (!last) {
                      lastDragPosRef.current = {
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                      return;
                    }
                    const dx = e.target.x() - last.x;
                    const dy = e.target.y() - last.y;
                    if (dx || dy) {
                      moveSelectedBy(dx, dy);
                      lastDragPosRef.current = {
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                    }
                  }}
                  onDragEnd={(e) => {
                    lastDragPosRef.current = null;
                    handleDragEnd(item.id, e);
                  }}
                  onClick={() => toggleSelect(item.id)}
                  onTap={() => toggleSelect(item.id)}
                  onDblClick={() => openPopupFor(item.id)}
                  onDblTap={() => openPopupFor(item.id)}
                  onTransformEnd={(e) => {
                    const node = shapeRefs.current[item.id];
                    if (!node) return;

                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    node.scaleX(1);
                    node.scaleY(1);

                    resizeItem(item.id, {
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * scaleX,
                      height: node.height() * scaleY,
                    });
                  }}
                />
                <Text
                  x={item.x}
                  y={item.y - 20}
                  text={item.name ?? item.label}
                  fontSize={14}
                  fill="#e5e7eb"
                  onMouseDown={() => startLongPressTimer(item.id)}
                  onTouchStart={() => startLongPressTimer(item.id)}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchEnd={clearLongPressTimer}
                  onClick={() => toggleSelect(item.id)}
                  onTap={() => toggleSelect(item.id)}
                  onDblClick={() => openPopupFor(item.id)}
                  onDblTap={() => openPopupFor(item.id)}
                />
              </React.Fragment>
            ))}

            {selectedIds.length === 1 && (
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  // 極端に小さくならないように制限
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* 中身閲覧ポップアップ（編集不可・＋／－で登録・削除モード） */}
      {popupItemId && !registerPopupOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: 360,
              padding: 16,
              borderRadius: 8,
              background: "#020617",
              color: "#e5e7eb",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              {items.find((i) => i.id === popupItemId)?.label ?? "オブジェクト"}の中身
            </h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={enterSelectionMode}
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
                  onClick={openRegisterPopup}
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
                  onClick={cancelSelectionMode}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedRows}
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
                      background:
                        selectedRowIndices.includes(index) ? "#1e3a5f" : "transparent",
                    }}
                  >
                    {selectionMode && (
                      <button
                        type="button"
                        onClick={() => toggleRowSelection(index)}
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
                onClick={closePopup}
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
      )}

      {/* 登録用ポップアップ（＋押下で表示・名前・分類・数で1行登録） */}
      {registerPopupOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 51,
          }}
        >
          <div
            style={{
              width: 320,
              padding: 16,
              borderRadius: 8,
              background: "#020617",
              color: "#e5e7eb",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              登録
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13 }}>
                名前
                <input
                  type="text"
                  value={registerDraft.name}
                  onChange={(e) =>
                    updateRegisterDraft({ name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 4,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                  }}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                分類
                <select
                  value={registerDraft.category}
                  onChange={(e) =>
                    updateRegisterDraft({ category: e.target.value })
                  }
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 4,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                  }}
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
                  onChange={(e) =>
                    updateRegisterDraft({ count: e.target.value })
                  }
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 4,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                  }}
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
                onClick={closeRegisterPopup}
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
                onClick={confirmRegisterAdd}
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
      )}

      {/* オブジェクト削除確認（1秒長押しで表示） */}
      {deleteConfirmItemId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 52,
          }}
        >
          <div
            style={{
              width: 280,
              padding: 20,
              borderRadius: 8,
              background: "#020617",
              color: "#e5e7eb",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
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
                onClick={closeDeleteConfirm}
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
                onClick={confirmDelete}
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
      )}
    </div>
  );
};

export default ObjectMenuWithCanvas;

