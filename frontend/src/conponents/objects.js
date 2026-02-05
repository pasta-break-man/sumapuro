// Canvas上に配置可能な「棚っぽい」オブジェクト定義をまとめたファイル
// 必要に応じてここに種類を追加していく想定
// imageUrl: オプション。指定するとキャンバス上でその画像で表示（URL または public フォルダからの相対パス）

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
    // imageUrl: "/images/bookshelf.png",
  },
];

