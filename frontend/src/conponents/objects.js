// Canvas上に配置可能なオブジェクトを定義
// AI使用．確認済み

export const OBJECT_TYPES = [
  {
    id: "shelf-small",
    label: "小さめの棚",
    width: 120,
    height: 50,
    fill: "#4f46e5",
    // imageUrl: "/images/shelf-small.png",
  },
  {
    id: "shelf-medium",
    label: "中くらいの棚",
    width: 180,
    height: 60,
    fill: "#16a34a",
    // imageUrl: "/images/shelf-medium.png",
  },
  {
    id: "shelf-large",
    label: "大きめの棚",
    width: 240,
    height: 70,
    fill: "#f97316",
    // imageUrl: "/images/shelf-large.png",
  },
  {
    id: "book-shelf",
    label: "本棚",
    width: 100,
    height: 50,
    fill: "#49eb34",
    // 画像は public フォルダに置き、/ファイル名 で指定（絶対パス C:/ はブラウザでは使えません）
    imageUrl: "/1503833.jpg",
  },
];

