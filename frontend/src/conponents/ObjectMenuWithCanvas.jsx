import React, { useRef, useEffect, useState } from "react";
import { useCanvasEditor } from "./useCanvasEditor";
import ObjectCanvasStage from "./ObjectCanvasStage";
import ContentsViewPopup from "./ContentsViewPopup";
import RegisterPopup from "./RegisterPopup";
import DeleteConfirmModal from "./DeleteConfirmModal";
import NestConfirmModal from "./NestConfirmModal";

/**
 * キャンバス＋ポップアップのみ。メニュー（オブジェクト追加UI）は object.jsx の右パネルに委譲。
 * ref で addObjectFromType を公開し、object.jsx のボタンから呼ぶ。
 */
const ObjectMenuWithCanvas = React.forwardRef(
  ({ highlightTableNames = [], stageWidth = 1500, stageHeight = 800 }, ref) => {

  const {
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
    setObjectImage,
  } = useCanvasEditor({ stageWidth, stageHeight });

  const LONG_PRESS_MS = 1000;
  const longPressTimerRef = useRef(null);
  const [renameEditing, setRenameEditing] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    if (!popupItemId) {
      setRenameEditing(false);
      setRenameDraft("");
    }
  }, [popupItemId]);

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

  const trRef = useRef(null);
  const shapeRefs = useRef({});
  const lastDragPosRef = useRef(null);
  const stageContainerRef = useRef(null);

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

  // items から削除されたオブジェクトの参照（shapeRefs）もクリーンアップしておく
  useEffect(() => {
    const validIds = new Set(items.map((i) => i.id));
    Object.keys(shapeRefs.current).forEach((id) => {
      if (!validIds.has(id)) {
        delete shapeRefs.current[id];
      }
    });
  }, [items]);

  React.useImperativeHandle(ref, () => ({
    addObjectFromType,
  }), [addObjectFromType]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const typeJson = e.dataTransfer.getData("application/json");
    if (!typeJson) return;
    try {
      const type = JSON.parse(typeJson);
      const rect = stageContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      await addObjectFromType(type, { x, y });
    } catch (_) {}
  };

  return (
    <div style={{ padding: 16, pointerEvents: "auto" }}>
      <ObjectCanvasStage
        stageWidth={stageWidth}
        stageHeight={stageHeight}
        items={items}
        selectedIds={selectedIds}
        highlightTableNames={highlightTableNames}
        trRef={trRef}
        shapeRefs={shapeRefs}
        lastDragPosRef={lastDragPosRef}
        stageContainerRef={stageContainerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}

        clearSelection={clearSelection}
        startLongPressTimer={startLongPressTimer}
        clearLongPressTimer={clearLongPressTimer}
        handleDragEnd={handleDragEndWithNestCheck}
        toggleSelect={toggleSelect}
        openPopupFor={openPopupFor}
        moveSelectedBy={moveSelectedBy}
        resizeItem={resizeItem}
      />
 {/* main */}

      {popupItemId && !registerPopupOpen && (
        <ContentsViewPopup
          popupItemId={popupItemId}
          items={items}
          currentPopupItem={currentPopupItem}
          viewingNestedId={viewingNestedId}
          nestedItems={items.find((i) => i.id === popupItemId)?.nestedItems ?? []}
          highlightTableNames={highlightTableNames}
          onOpenNestedContents={openNestedContents}
          onCloseNestedView={closeNestedView}
          onUnnest={unnestToCanvas}
          popupContents={popupContents}
          selectionMode={selectionMode}
          selectedRowIndices={selectedRowIndices}
          renameEditing={renameEditing}
          renameDraft={renameDraft}
          onRenameDraftChange={setRenameDraft}
          onRenameApply={(newName) => {
            setRenameEditing(false);
            setRenameDraft(newName);
          }}
          onRenameCancel={() => {
            setRenameEditing(false);
            setRenameDraft("");
          }}
          onRenameStart={(current) => {
            setRenameDraft(current);
            setRenameEditing(true);
          }}
          onEnterSelectionMode={enterSelectionMode}
          onOpenRegisterPopup={openRegisterPopup}
          onCancelSelectionMode={cancelSelectionMode}
          onDeleteSelectedRows={deleteSelectedRows}
          onToggleRowSelection={toggleRowSelection}
          onClosePopup={closePopup}
          renameObject={renameObject}
          onSetObjectImage={setObjectImage}
        />
      )}

      {registerPopupOpen && (
        <RegisterPopup
          registerDraft={registerDraft}
          onDraftChange={updateRegisterDraft}
          onConfirm={confirmRegisterAdd}
          onCancel={closeRegisterPopup}
        />
      )}

      {deleteConfirmItemId && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={closeDeleteConfirm}
        />
      )}

      {nestConfirmPending && (
        <NestConfirmModal
          onConfirm={confirmNest}
          onCancel={cancelNest}
        />
      )}
    </div>
  );
});

ObjectMenuWithCanvas.displayName = "ObjectMenuWithCanvas";

export default ObjectMenuWithCanvas;
