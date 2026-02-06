// AI使用．確認済み

import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ObjectMenuWithCanvas from "./ObjectMenuWithCanvas";
import { OBJECT_TYPES } from "./objects";
import { CATEGORY_OPTIONS } from "./RegisterPopup";
import { useAuth } from "./login";

const API_BASE = "http://localhost:5000";

/**
 * ログアウト確認ポップアップ（はい / いいえ）
 */
function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
    >
      <div
        style={{
          width: 280,
          padding: 20,
          borderRadius: 8,
          background: "#fff",
          color: "#111827",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <p style={{ fontSize: 14, marginBottom: 16 }}>ログアウトしますか？</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#111827",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            いいえ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #dc2626",
              background: "#dc2626",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            はい
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * キャンバスページ：右スライドのオブジェクトメニュー + キャンバス
 * メニュー構成はここで定義（object.jsx の挙動に合わせる）
 */
export default function CanvasPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [panelTab, setPanelTab] = useState("objects"); // "objects" | "search"
  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [highlightTableNames, setHighlightTableNames] = useState([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const canvasRef = useRef(null);

  // キャンバスサイズをブラウザの表示領域に合わせる（右パネル 300px を除く）
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 520 });
  useEffect(() => {
    const update = () => {
      const panelWidth = toolbarOpen ? 300 : 0;
      setCanvasSize({
        width: Math.max(400, window.innerWidth - panelWidth - 32),
        height: Math.max(300, window.innerHeight - 32),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [toolbarOpen]);

  const handleLogoutConfirm = async () => {
    setLogoutConfirmOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleAddObject = async (type) => {
    if (canvasRef.current?.addObjectFromType) {
      await canvasRef.current.addObjectFromType(type);
    }
  };

  const handleSearch = async () => {
    if (!searchName.trim() && !searchCategory.trim()) {
      setHighlightTableNames([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/contents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: searchName.trim(),
          category: searchCategory.trim(),
        }),
      });
      const data = await res.json();
      const matches = data?.matches ?? [];
      const tableSet = new Set();
      matches.forEach((m) => {
        tableSet.add(m.table_name);
        if (m.parent_table_name) tableSet.add(m.parent_table_name);
      });
      setHighlightTableNames(Array.from(tableSet));
    } catch (_) {
      setHighlightTableNames([]);
    }
  };

  const clearSearch = () => {
    setSearchName("");
    setSearchCategory("");
    setHighlightTableNames([]);
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100vh",
        position: "relative",
        background: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      <ObjectMenuWithCanvas
        ref={canvasRef}
        highlightTableNames={highlightTableNames}
        stageWidth={canvasSize.width}
        stageHeight={canvasSize.height}
      />

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
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setPanelTab("objects")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: panelTab === "objects" ? "#e0e7ff" : "#fff",
              color: "#111827",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            オブジェクト
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("search")}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: panelTab === "search" ? "#e0e7ff" : "#fff",
              color: "#111827",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            検索
          </button>
        </div>

        {panelTab === "objects" ? (
          <>
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
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
              検索。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#374151" }}>
                名前
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="例: 薬"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ fontSize: 12, color: "#374151" }}>
                分類
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
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
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleSearch}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #4f46e5",
                    background: "#4f46e5",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  検索
                </button>
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#111827",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  クリア
                </button>
              </div>
              {highlightTableNames.length > 0 && (
                <p style={{ fontSize: 12, color: "#059669" }}>
                  {highlightTableNames.length} 件のオブジェクトを強調表示中
                </p>
              )}
            </div>
          </>
        )}
        </div>

        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fef2f2",
            color: "#991b1b",
            cursor: "pointer",
            fontSize: 13,
            width: "100%",
          }}
        >
          ログアウト
        </button>
      </div>

      {logoutConfirmOpen && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </div>
  );
}
