import React from "react";
import { Stage, Layer, Rect, Image, Transformer } from "react-konva";
import useImage from "use-image";

/**
 * 画像付きオブジェクト用（useImage をフックで使うため別コンポーネント）
 */
const SEARCH_HIGHLIGHT_COLOR = "#ffff00";

function ObjectImageShape({
  item,
  selectedIds,
  highlightTableNames,
  shapeRefs,
  startLongPressTimer,
  clearLongPressTimer,
  handleDragEnd,
  toggleSelect,
  openPopupFor,
  moveSelectedBy,
  resizeItem,
  lastDragPosRef,
}) {
  const [image] = useImage(item.imageUrl || "");
  const isSelected = selectedIds.includes(item.id);
  const isSearchHighlight = highlightTableNames.includes(item.tableName);
  const strokeColor = isSelected ? "#facc15" : isSearchHighlight ? SEARCH_HIGHLIGHT_COLOR : undefined;
  const strokeWidth = isSelected || isSearchHighlight ? 5 : 0;
  const shadowBlur = isSelected || isSearchHighlight ? 8 : 0;
  const commonProps = {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    stroke: strokeColor,
    strokeWidth,
    shadowBlur,
    draggable: true,
    onMouseDown: () => startLongPressTimer(item.id),
    onTouchStart: () => startLongPressTimer(item.id),
    onMouseUp: clearLongPressTimer,
    onMouseLeave: clearLongPressTimer,
    onTouchEnd: clearLongPressTimer,
    onDragStart: (e) => {
      clearLongPressTimer();
      lastDragPosRef.current = { x: e.target.x(), y: e.target.y() };
    },
    onDragMove: (e) => {
      const last = lastDragPosRef.current;
      if (!last) {
        lastDragPosRef.current = { x: e.target.x(), y: e.target.y() };
        return;
      }
      const dx = e.target.x() - last.x;
      const dy = e.target.y() - last.y;
      if (dx || dy) {
        moveSelectedBy(dx, dy);
        lastDragPosRef.current = { x: e.target.x(), y: e.target.y() };
      }
    },
    onDragEnd: (e) => {
      lastDragPosRef.current = null;
      handleDragEnd(item.id, e);
    },
    onClick: () => toggleSelect(item.id),
    onTap: () => toggleSelect(item.id),
    onDblClick: () => openPopupFor(item.id),
    onDblTap: () => openPopupFor(item.id),
  };

  // 画像がまだ読み込めていない／失敗した場合は矩形で表示（オブジェクトが消えて見えないのを防ぐ）
  if (!image) {
    return (
      <Rect
        ref={(node) => {
          if (node) shapeRefs.current[item.id] = node;
        }}
        {...commonProps}
        fill={item.fill || "#6b7280"}
        cornerRadius={10}
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
    );
  }

  return (
    <Image
      ref={(node) => {
        if (node) shapeRefs.current[item.id] = node;
      }}
      image={image}
      {...commonProps}
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
  );
}

/**
 * Konva キャンバス：オブジェクトの矩形または画像・Transformer
 */
export default function ObjectCanvasStage({
  stageWidth,
  stageHeight,
  items,
  selectedIds,
  highlightTableNames = [],
  trRef,
  shapeRefs,
  lastDragPosRef,
  stageContainerRef,
  onDragOver,
  onDrop,
  clearSelection,
  startLongPressTimer,
  clearLongPressTimer,
  handleDragEnd,
  toggleSelect,
  openPopupFor,
  moveSelectedBy,
  resizeItem,
}) {
  return (
    <div
      ref={stageContainerRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ display: "inline-block", pointerEvents: "auto" }}
    >
      <Stage
        width={stageWidth}
        height={stageHeight}
        style={{
          border: "1px solid #333",
          background: "#020617",
          userSelect: "none",
          cursor: "default",
        }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) clearSelection();
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) clearSelection();
        }}
      >
        <Layer>
          {items.filter((item) => !item.parentId).map((item) =>
            item.imageUrl ? (
              <ObjectImageShape
                key={item.id}
                item={item}
                selectedIds={selectedIds}
                highlightTableNames={highlightTableNames}
                shapeRefs={shapeRefs}
                startLongPressTimer={startLongPressTimer}
                clearLongPressTimer={clearLongPressTimer}
                handleDragEnd={handleDragEnd}
                toggleSelect={toggleSelect}
                openPopupFor={openPopupFor}
                moveSelectedBy={moveSelectedBy}
                resizeItem={resizeItem}
                lastDragPosRef={lastDragPosRef}
              />
            ) : (
              <Rect
                key={item.id}
                ref={(node) => {
                  if (node) shapeRefs.current[item.id] = node;
                }}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={item.fill}
                stroke={
                  selectedIds.includes(item.id)
                    ? "#facc15"
                    : highlightTableNames.includes(item.tableName)
                      ? SEARCH_HIGHLIGHT_COLOR
                      : undefined
                }
                strokeWidth={
                  selectedIds.includes(item.id) || highlightTableNames.includes(item.tableName)
                    ? 5
                    : 0
                }
                shadowBlur={
                  selectedIds.includes(item.id) || highlightTableNames.includes(item.tableName)
                    ? 8
                    : 0
                }
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
            )
          )}

          {selectedIds.length === 1 && (
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
