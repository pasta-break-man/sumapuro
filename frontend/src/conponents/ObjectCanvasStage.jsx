import React from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";

/**
 * Konva キャンバス：オブジェクトの矩形・ラベル・Transformer
 */
export default function ObjectCanvasStage({
  stageWidth,
  stageHeight,
  items,
  selectedIds,
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
          {items.filter((item) => !item.parentId).map((item) => (
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
