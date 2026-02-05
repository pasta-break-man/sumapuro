import React from "react";
import { Stage, Layer, Rect } from "react-konva";

export default function RoomFrame() {
  const ROOM = {
    width: 600,
    height: 400,
    wall: 10, // 壁の太さ
  };

  return (
    <Stage
      width={ROOM.width}
      height={ROOM.height}
      style={{
        border: "1px solid #ccc",
        background: "#f9fafb",
      }}
    >
      <Layer>
        {/* 上の壁 */}
        <Rect
          x={0}
          y={0}
          width={ROOM.width}
          height={ROOM.wall}
          fill="#374151"
        />

        {/* 下の壁 */}
        <Rect
          x={0}
          y={ROOM.height - ROOM.wall}
          width={ROOM.width}
          height={ROOM.wall}
          fill="#374151"
        />

        {/* 左の壁 */}
        <Rect
          x={0}
          y={0}
          width={ROOM.wall}
          height={ROOM.height}
          fill="#374151"
        />

        {/* 右の壁 */}
        <Rect
          x={ROOM.width - ROOM.wall}
          y={0}
          width={ROOM.wall}
          height={ROOM.height}
          fill="#374151"
        />
      </Layer>
    </Stage>
  );
}
