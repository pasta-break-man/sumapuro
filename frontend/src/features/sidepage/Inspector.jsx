import React, { useState } from 'react';
import { useInventory } from 'C:\sumapuro\frontend\src\features\items\tentative_item.js'; // さっき作ったやつ

export const Inspector = ({ selectedObjectId }) => {
  // あなたの作ったロジックを呼び出す
  // selectedObjectId（例："shelf-1"）を渡すと、その中身（items）と操作関数が返ってくる
  const { items, addItem, removeItem } = useInventory(selectedObjectId);

  // 入力フォーム用の一時的なState
  const [nameInput, setNameInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("薬"); // デフォルト値など

  const handleAdd = () => {
    if (!nameInput) return;
    addItem(nameInput, categoryInput); // サーバーへ送信！
    setNameInput(""); // 入力欄クリア
  };

  if (!selectedObjectId) {
    return <div className="inspector">オブジェクトを選択してください</div>;
  }

  return (
    <div className="inspector p-4 border-l bg-white h-full">
      <h2 className="text-xl font-bold mb-4">収納の内容</h2>
      <p className="text-gray-500 mb-4">ID: {selectedObjectId}</p>

      {/* 入力フォーム */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="mb-2">
          <label className="block text-sm">名前</label>
          <input 
            type="text" 
            className="border w-full p-1"
            placeholder="例: ロキソニン"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm">属性（カテゴリ）</label>
          <select 
            className="border w-full p-1"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
          >
            <option value="薬">薬</option>
            <option value="本">本</option>
            <option value="フィギュア">フィギュア</option>
            <option value="食品">食品</option>
            {/* 必要に応じて自由入力にしてもOK */}
          </select>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-1 rounded w-full"
        >
          追加
        </button>
      </div>

      {/* アイテムリスト表示 */}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center border-b pb-1">
            <div>
              <span className="font-bold">{item.name}</span>
              <span className="text-xs text-gray-500 ml-2">[{item.category}]</span>
            </div>
            <button 
              onClick={() => removeItem(item.id)}
              className="text-red-500 text-sm"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};