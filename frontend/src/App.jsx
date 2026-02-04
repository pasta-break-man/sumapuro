import React, { useMemo, useState } from "react";
import { Stage, Layer, Rect, Text, Transformer } from "react-konva";

export default function KonvaCanvas() {
  const [items, setItems] = useState([
    { id: "a", x: 60, y: 60, w: 140, h: 90, fill: "#4f46e5", label: "棚A" },
    { id: "b", x: 260, y: 140, w: 140, h: 90, fill: "#16a34a", label: "棚B" },
  ]);

  const [selectedId, setSelectedId] = useState(null);

  // 画面サイズ：とりあえず固定（後でレスポンシブ化可）
  const stageSize = useMemo(() => ({ width: 900, height: 520 }), []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        選択中: {selectedId ?? "なし"}（クリックで選択 / ドラッグで移動 / 角でリサイズ）
      </div>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        style={{ border: "1px solid #333", background: "#111" }}
        onMouseDown={(e) => {
          // 空白クリックで選択解除
          if (e.target === e.target.getStage()) setSelectedId(null);
        }}
      >
        <Layer>
          {items.map((it) => (
            <KonvaItem
              key={it.id}
              item={it}
              isSelected={it.id === selectedId}
              onSelect={() => setSelectedId(it.id)}
              onChange={(next) => {
                setItems((prev) => prev.map((p) => (p.id === it.id ? next : p)));
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

function KonvaItem({ item, isSelected, onSelect, onChange }) {
  const shapeRef = React.useRef(null);
  const trRef = React.useRef(null);

  React.useEffect(() => {
    if (!isSelected) return;
    if (!trRef.current || !shapeRef.current) return;

    trRef.current.nodes([shapeRef.current]);
    trRef.current.getLayer().batchDraw();
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={item.x}
        y={item.y}
        width={item.w}
        height={item.h}
        fill={item.fill}
        cornerRadius={10}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ ...item, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // transform後はscaleをwidth/heightに反映し、scaleは戻す
          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            w: Math.max(30, node.width() * scaleX),
            h: Math.max(30, node.height() * scaleY),
          });
        }}
      />

      <Text
        x={item.x}
        y={item.y - 22}
        text={item.label}
        fontSize={16}
        fill="#e5e7eb"
        onClick={onSelect}
        onTap={onSelect}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
        />
      )}
    </>
  );
}