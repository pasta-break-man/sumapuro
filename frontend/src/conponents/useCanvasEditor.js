import { useMemo, useState, useCallback } from "react";
import {
  addContentRow,
  deleteContentRowsByIndices,
  DEFAULT_CONTENT_ROW,
} from "./contentsActions";

const MIN_SIZE = 20;

/** 2つの矩形が重なっているか */
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

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

  // 入れ子確認ポップアップ（別オブジェクトに重ねてドロップしたとき）
  const [nestConfirmPending, setNestConfirmPending] = useState(null);

  // ポップアップ内で入れ子オブジェクトの中身を表示しているときのその id（null なら親を表示）
  const [viewingNestedId, setViewingNestedId] = useState(null);

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

  const updateNestedItem = useCallback((parentId, nestedId, patchOrFn) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? {
              ...item,
              nestedItems: (item.nestedItems ?? []).map((n) =>
                n.id === nestedId
                  ? {
                      ...n,
                      ...(typeof patchOrFn === "function"
                        ? patchOrFn(n)
                        : patchOrFn),
                    }
                  : n
              ),
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
    setItems((prev) => {
      const existingNames = prev.map((i) => i.name ?? i.label ?? "");
      let displayName = label;
      if (existingNames.includes(label)) {
        let n = 2;
        while (existingNames.includes(label + n)) n += 1;
        displayName = label + n;
      }
      return [
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
          name: displayName,
          contents: [],
          parentId: undefined,
        },
      ];
    });
  }, [stageWidth, stageHeight]);

  const handleDragEnd = useCallback((id, e) => {
    updateItem(id, { x: e.target.x(), y: e.target.y() });
  }, [updateItem]);

  // ドラッグ終了時：別オブジェクトに重なっていれば入れ子確認ポップアップ、でなければ通常の位置更新
  const handleDragEndWithNestCheck = useCallback(
    (id, e) => {
      const newX = e.target.x();
      const newY = e.target.y();
      const dragged = items.find((i) => i.id === id);
      if (!dragged) return;
      const dragRect = {
        x: newX,
        y: newY,
        width: dragged.width,
        height: dragged.height,
      };
      const overlapped = items.find(
        (other) =>
          other.id !== id &&
          rectsOverlap(dragRect, {
            x: other.x,
            y: other.y,
            width: other.width,
            height: other.height,
          })
      );
      if (overlapped) {
        setNestConfirmPending({
          dragItemId: id,
          newX,
          newY,
          targetItemId: overlapped.id,
        });
        return;
      }
      handleDragEnd(id, e);
    },
    [items, handleDragEnd]
  );

  // 入れ子確定：子を items から削除し、親の nestedItems に移す。DB は触らない（子のテーブルも残す）
  const confirmNest = useCallback(() => {
    if (!nestConfirmPending) return;
    const { dragItemId, newX, newY, targetItemId } = nestConfirmPending;
    const dragItem = items.find((i) => i.id === dragItemId);
    if (!dragItem) {
      setNestConfirmPending(null);
      return;
    }
    const nestedEntry = {
      ...dragItem,
      x: newX,
      y: newY,
      parentId: targetItemId,
    };
    setItems((prev) =>
      prev
        .filter((i) => i.id !== dragItemId)
        .map((i) =>
          i.id === targetItemId
            ? { ...i, nestedItems: [...(i.nestedItems || []), nestedEntry] }
            : i
        )
    );
    setSelectedIds((prev) => prev.filter((id) => id !== dragItemId));
    setNestConfirmPending(null);
  }, [nestConfirmPending, items]);

  const cancelNest = useCallback(() => {
    setNestConfirmPending(null);
  }, []);

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
    setViewingNestedId(null);
    setSelectionMode(false);
    setSelectedRowIndices([]);
  }, [items]);

  // 中身閲覧ポップアップを閉じる（登録ポップアップも閉じる）
  const closePopup = useCallback(() => {
    setPopupItemId(null);
    setViewingNestedId(null);
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

  const currentPopupItem = useMemo(() => {
    const parent = items.find((x) => x.id === popupItemId);
    if (!parent) return null;
    if (viewingNestedId) {
      return parent.nestedItems?.find((n) => n.id === viewingNestedId) ?? null;
    }
    return parent;
  }, [items, popupItemId, viewingNestedId]);

  const popupContents = useMemo(() => {
    return currentPopupItem?.contents ?? [];
  }, [currentPopupItem]);

  const openNestedContents = useCallback((nestedId) => {
    setViewingNestedId(nestedId);
    setSelectionMode(false);
    setSelectedRowIndices([]);
  }, []);

  const closeNestedView = useCallback(() => {
    setViewingNestedId(null);
  }, []);

  // 登録ポップアップで「登録」: 1行追加して閉じる ＋ バックエンドに保存（親／入れ子どちらでも可）
  const confirmRegisterAdd = useCallback(async () => {
    if (!popupItemId || !currentPopupItem) return;
    const currentContents = currentPopupItem.contents ?? [];
    const nextContents = addContentRow(currentContents, registerDraft);
    if (currentPopupItem.parentId) {
      updateNestedItem(popupItemId, currentPopupItem.id, { contents: nextContents });
    } else {
      updateItem(popupItemId, { contents: nextContents });
    }
    closeRegisterPopup();

    const objectName = currentPopupItem.name ?? currentPopupItem.label ?? "オブジェクト";
    try {
      await fetch(`${API_BASE}/api/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_name: objectName,
          name: registerDraft.name ?? "",
          category: registerDraft.category ?? "",
          count: registerDraft.count ?? 0,
        }),
      });
    } catch (_) {}
  }, [popupItemId, currentPopupItem, registerDraft, updateItem, updateNestedItem, closeRegisterPopup]);

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

  // 選択行を削除（画面上＋DB に反映）（親／入れ子どちらでも可）
  const deleteSelectedRows = useCallback(async () => {
    if (!popupItemId || !currentPopupItem || selectedRowIndices.length === 0)
      return;
    const currentContents = currentPopupItem.contents ?? [];
    const nextContents = deleteContentRowsByIndices(
      currentContents,
      selectedRowIndices
    );
    if (currentPopupItem.parentId) {
      updateNestedItem(popupItemId, currentPopupItem.id, { contents: nextContents });
    } else {
      updateItem(popupItemId, { contents: nextContents });
    }
    setSelectionMode(false);
    setSelectedRowIndices([]);

    const objectName = currentPopupItem.name ?? currentPopupItem.label ?? "";
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
  }, [popupItemId, currentPopupItem, selectedRowIndices, updateItem, updateNestedItem]);

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

  // 入れ子オブジェクトをキャンバスに戻す（ドラッグでポップアップ外にドロップしたとき）
  const unnestToCanvas = useCallback(
    (parentId, nestedItemId, position) => {
      const parent = items.find((i) => i.id === parentId);
      const nested = parent?.nestedItems?.find((n) => n.id === nestedItemId);
      if (!parent || !nested) return;
      const x =
        position?.x != null
          ? Math.max(0, Math.min(position.x, stageWidth - (nested.width ?? 120)))
          : (stageWidth - (nested.width ?? 120)) / 2;
      const y =
        position?.y != null
          ? Math.max(0, Math.min(position.y, stageHeight - (nested.height ?? 50)))
          : (stageHeight - (nested.height ?? 50)) / 2;
      const { parentId: _, ...restored } = { ...nested, x, y };
      setItems((prev) =>
        prev
          .map((i) =>
            i.id === parentId
              ? {
                  ...i,
                  nestedItems: (i.nestedItems ?? []).filter(
                    (n) => n.id !== nestedItemId
                  ),
                }
              : i
          )
          .concat([restored])
      );
      if (viewingNestedId === nestedItemId) setViewingNestedId(null);
    },
    [items, stageWidth, stageHeight, viewingNestedId]
  );

  // 長押しで削除確認を開く
  const openDeleteConfirm = useCallback((id) => {
    setDeleteConfirmItemId(id);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmItemId(null);
  }, []);

  // 削除実行（画面上から削除し、対応する DB テーブル（オブジェクト名）も削除）
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmItemId) return;
    const item = items.find((i) => i.id === deleteConfirmItemId);
    const objectNameToDrop = item?.name ?? item?.label ?? null;

    setItems((prev) => prev.filter((i) => i.id !== deleteConfirmItemId));
    setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmItemId));
    setDeleteConfirmItemId(null);
    if (popupItemId === deleteConfirmItemId) {
      setPopupItemId(null);
      setRegisterPopupOpen(false);
    }

    if (objectNameToDrop) {
      try {
        await fetch(
          `${API_BASE}/api/objects/${encodeURIComponent(objectNameToDrop)}`,
          { method: "DELETE" }
        );
      } catch (_) {}
    }
  }, [deleteConfirmItemId, popupItemId, items]);

  // 名前変更（表示名更新 ＋ DB のテーブル名も変更）（親／入れ子どちらでも可）
  const renameObject = useCallback(
    async (id, newName, opts = {}) => {
      const { isNested = false, parentId } = opts;
      const item = isNested && parentId
        ? items.find((i) => i.id === parentId)?.nestedItems?.find((n) => n.id === id)
        : items.find((x) => x.id === id);
      if (!item || !newName.trim()) return;
      const oldName = item.name ?? item.label ?? "";
      if (isNested && parentId) {
        updateNestedItem(parentId, id, { name: newName.trim() });
      } else {
        updateItem(id, { name: newName.trim() });
      }
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
    [items, updateItem, updateNestedItem]
  );

  return {
    items,
    selectedIds,
    popupItemId,
    currentPopupItem,
    popupContents,
    viewingNestedId,
    openNestedContents,
    closeNestedView,
    unnestToCanvas,
    selectionMode,
    selectedRowIndices,
    registerPopupOpen,
    registerDraft,
    addObjectFromType,
    handleDragEnd,
    handleDragEndWithNestCheck,
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
    nestConfirmPending,
    confirmNest,
    cancelNest,
    renameObject,
  };
};
