import React from "react";
import { Stage, Layer, Rect } from "react-konva";


export default function RoomCanvas() {
  const ROOM = {
    width: 600,
    height: 400,
    wall: 12,
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 8 }}>
        部屋の基本形（家具なし）
      </div>

      <Stage
        width={ROOM.width}
        height={ROOM.height}
        style={{ border: "1px solid #d34040", background: "#f3f4f6" }}
      >
        <Layer>
          {/* 上 */}
          <Rect x={0} y={0} width={ROOM.width} height={ROOM.wall} fill="#374151" />
          {/* 下 */}
          <Rect
            x={0}
            y={ROOM.height - ROOM.wall}
            width={ROOM.width}
            height={ROOM.wall}
            fill="#374151"
          />
          {/* 左 */}
          <Rect
            x={0}
            y={0}
            width={ROOM.wall}
            height={ROOM.height}
            fill="#374151"
          />
          {/* 右 */}
          <Rect
            x={ROOM.width - ROOM.wall}
            y={0}
            width={ROOM.wall}
            height={ROOM.height}
            fill="#374151"
          />
        </Layer>
      </Stage>
    </div>
  );
}
