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

  const addObjectFromType = useCallback((type) => {
    const { id: typeId, width, height, fill, label } = type;
    setItems((prev) => [
      ...prev,
      {
        id: `${typeId}-${Date.now()}`,
        typeId,
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width,
        height,
        fill,
        label,
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

  // 登録ポップアップで「登録」: 1行追加して閉じる（contentsActions 使用）
  const confirmRegisterAdd = useCallback(() => {
    if (!popupItemId) return;
    const item = items.find((x) => x.id === popupItemId);
    if (!item) return;
    const currentContents = item.contents ?? [];
    const nextContents = addContentRow(currentContents, registerDraft);
    updateItem(popupItemId, { contents: nextContents });
    closeRegisterPopup();
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

  // 選択行を削除（contentsActions 使用）
  const deleteSelectedRows = useCallback(() => {
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
  };
};
