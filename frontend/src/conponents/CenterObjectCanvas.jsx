import React from "react";
import { Stage, Layer, Rect } from "react-konva";

/**
 * 二次元キャンパス中央に1つだけ矩形オブジェクトを配置するコンポーネント
 */
const CenterObjectCanvas = () => {
  const stageWidth = 900;
  const stageHeight = 520;

  const rectWidth = 120;
  const rectHeight = 80;

  const rectX = (stageWidth - rectWidth) / 2;
  const rectY = (stageHeight - rectHeight) / 2;

  return (
    <div style={{ padding: 16 }}>
      <Stage
        width={stageWidth}
        height={stageHeight}
        style={{ border: "1px solid #333", background: "#111" }}
      >
        <Layer>
          <Rect
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            fill="#4f46e5"
            cornerRadius={10}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CenterObjectCanvas;

