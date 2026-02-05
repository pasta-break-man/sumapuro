import { useMemo, useState, useCallback } from "react";
import {
  addContentRow,
  deleteContentRowsByIndices,
  DEFAULT_CONTENT_ROW,
} from "./contentsActions";

const MIN_SIZE = 20;

export const useCanvasEditor = ({ stageWidth, stageHeight }) => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [popupItemId, setPopupItemId] = useState(null);

  // 閲覧ポップアップ: 選択モード（マイナス押下時）
  const [selectionMode, setSelectionMode] = useState(false);

  const [selectedRowIndices, setSelectedRowIndices] = useState([]);

  // 登録用ポップアップ（＋押下で開く）
  const [registerPopupOpen, setRegisterPopupOpen] = useState(false);
  const [registerDraft, setRegisterDraft] = useState({ ...DEFAULT_CONTENT_ROW });

  // オブジェクト削除確認ポップアップ（1秒長押しで表示）
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState(null);

  const updateItem = useCallback((id, patchOrFn) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...(typeof patchOrFn === "function"
                ? patchOrFn(item)
                : patchOrFn),
            }
          : item
      )
    );
  }, []);

  const LEFT_MARGIN = 48;

  const addObjectFromType = useCallback((type, position) => {
    const { id: typeId, width, height, fill, label } = type;
    const x =
      position != null && typeof position.x === "number"
        ? Math.max(0, Math.min(position.x, stageWidth - width))
        : LEFT_MARGIN;
    const y =
      position != null && typeof position.y === "number"
        ? Math.max(0, Math.min(position.y, stageHeight - height))
        : (stageHeight - height) / 2;
    setItems((prev) => [
      ...prev,
      {
        id: `${typeId}-${Date.now()}`,
        typeId,
        x,
        y,
        width,
        height,
        fill,
        label,
        name: label, // テーブル名・表示名（名前変更で更新）
        contents: [],
      },
    ]);
  }, [stageWidth, stageHeight]);

  const handleDragEnd = useCallback((id, e) => {
    updateItem(id, { x: e.target.x(), y: e.target.y() });
  }, [updateItem]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // 中身閲覧ポップアップを開く
  const openPopupFor = useCallback((id) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;
    setPopupItemId(id);
    setSelectionMode(false);
    setSelectedRowIndices([]);
  }, [items]);

  // 中身閲覧ポップアップを閉じる（登録ポップアップも閉じる）
  const closePopup = useCallback(() => {
    setPopupItemId(null);
    setSelectionMode(false);
    setSelectedRowIndices([]);
    setRegisterPopupOpen(false);
    setRegisterDraft({ ...DEFAULT_CONTENT_ROW });
  }, []);

  // 登録ポップアップを開く（＋ボタン）
  const openRegisterPopup = useCallback(() => {
    setRegisterDraft({ ...DEFAULT_CONTENT_ROW });
    setRegisterPopupOpen(true);
  }, []);

  const closeRegisterPopup = useCallback(() => {
    setRegisterPopupOpen(false);
    setRegisterDraft({ ...DEFAULT_CONTENT_ROW });
  }, []);

  const updateRegisterDraft = useCallback((patch) => {
    setRegisterDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const API_BASE = "http://localhost:5000";

  // 登録ポップアップで「登録」: 1行追加して閉じる ＋ バックエンドに保存
  const confirmRegisterAdd = useCallback(async () => {
    if (!popupItemId) return;
    const item = items.find((x) => x.id === popupItemId);
    if (!item) return;
    const currentContents = item.contents ?? [];
    const nextContents = addContentRow(currentContents, registerDraft);
    updateItem(popupItemId, { contents: nextContents });
    closeRegisterPopup();

    try {
      await fetch(`${API_BASE}/api/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_name: item.name ?? item.label ?? "オブジェクト",
          name: registerDraft.name ?? "",
          category: registerDraft.category ?? "",
          count: registerDraft.count ?? 0,
        }),
      });
    } catch (_) {}
  }, [popupItemId, items, registerDraft, updateItem, closeRegisterPopup]);

  // マイナス押下: 選択モードに入る
  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedRowIndices([]);
  }, []);

  // 選択モードキャンセル → 通常閲覧に戻る
  const cancelSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedRowIndices([]);
  }, []);

  const toggleRowSelection = useCallback((index) => {
    setSelectedRowIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  // 選択行を削除（画面上＋DB に反映）
  const deleteSelectedRows = useCallback(async () => {
    if (!popupItemId || selectedRowIndices.length === 0) return;
    const item = items.find((x) => x.id === popupItemId);
    if (!item) return;
    const currentContents = item.contents ?? [];
    const nextContents = deleteContentRowsByIndices(
      currentContents,
      selectedRowIndices
    );
    updateItem(popupItemId, { contents: nextContents });
    setSelectionMode(false);
    setSelectedRowIndices([]);

    const objectName = item.name ?? item.label ?? "";
    if (objectName) {
      try {
        await fetch(`${API_BASE}/api/contents/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            object_name: objectName,
            indices: selectedRowIndices,
          }),
        });
      } catch (_) {}
    }
  }, [popupItemId, items, selectedRowIndices, updateItem]);

  const resizeItem = useCallback((id, { x, y, width, height }) => {
    updateItem(id, {
      x,
      y,
      width: Math.max(MIN_SIZE, width),
      height: Math.max(MIN_SIZE, height),
    });
  }, [updateItem]);

  const moveSelectedBy = useCallback((dx, dy) => {
    if (!dx && !dy) return;
    setItems((prev) =>
      prev.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, x: item.x + dx, y: item.y + dy }
          : item
      )
    );
  }, [selectedIds]);

  const popupContents = useMemo(() => {
    return items.find((x) => x.id === popupItemId)?.contents ?? [];
  }, [popupItemId, items]);

  // 長押しで削除確認を開く
  const openDeleteConfirm = useCallback((id) => {
    setDeleteConfirmItemId(id);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmItemId(null);
  }, []);

  // 削除実行（DB のテーブルも削除）
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmItemId) return;
    const item = items.find((i) => i.id === deleteConfirmItemId);
    const objectName = item?.name ?? item?.label ?? "";
    setItems((prev) => prev.filter((i) => i.id !== deleteConfirmItemId));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmItemId));
    setDeleteConfirmItemId(null);
    if (popupItemId === deleteConfirmItemId) {
      setPopupItemId(null);
      setRegisterPopupOpen(false);
    }
    if (objectName) {
      try {
        await fetch(
          `${API_BASE}/api/objects/${encodeURIComponent(objectName)}`,
          { method: "DELETE" }
        );
      } catch (_) {}
    }
  }, [deleteConfirmItemId, popupItemId, items]);

  // 名前変更（画面上の名前＋DB のテーブル名を変更）
  const renameObject = useCallback(
    async (id, newName) => {
      const item = items.find((x) => x.id === id);
      if (!item || !newName.trim()) return;
      const oldName = item.name ?? item.label ?? "";
      updateItem(id, { name: newName.trim() });
      if (oldName && oldName !== newName.trim()) {
        try {
          await fetch(`${API_BASE}/api/objects/rename`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              old_name: oldName,
              new_name: newName.trim(),
            }),
          });
        } catch (_) {}
      }
    },
    [items, updateItem]
  );

  return {
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
    renameObject,
  };
};
