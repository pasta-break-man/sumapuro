// Canvas上に配置可能なオブジェクトを定義
// AI使用．確認済み

export const OBJECT_TYPES = [
  {
    id: "book-shelf",
    label: "本棚",
    width: 100,
    height: 50,
    fill: "#49eb34",
    // 画像は public フォルダに置き、/ファイル名 で指定（絶対パス C:/ はブラウザでは使えません）
    imageUrl: "/本棚.jpg",
  },
  {
    id: "shelf-small",
    label: "小棚",
    width: 120,
    height: 50,
    fill: "#4f46e5",
    imageUrl: "/小棚.png",
  },
  {
    id: "box-storage",
    label: "箱型収納",
    width: 60,
    height: 60,
    fill: "#16a34a",
    imageUrl: "/箱.jpg",
  },
  {
    id: "closet",
    label: "クローゼット",
    width: 300,
    height: 100,
    fill: "#f97316",
    imageUrl: "/クローゼット.png",
  },
  {
    id: "bed",
    label: "ベッド",
    width: 300,
    height: 100,
    fill: "#f97316",
    imageUrl: "/ベッド.png",
  }
];

