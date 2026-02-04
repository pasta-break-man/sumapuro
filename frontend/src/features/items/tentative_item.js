import { useState, useEffect } from 'react';

// 仮のAPIエンドポイント（バックエンド担当と相談して決める）
const API_URL = "http://localhost:8000/items";

export const useInventory = (selectedStorageId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ① 選択された収納（storageId）が変わったら、中身をサーバーから取ってくる
  useEffect(() => {
    if (!selectedStorageId) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      try {
        // 例: GET /items?storage_id=shelf-1
        const res = await fetch(`${API_URL}?storage_id=${selectedStorageId}`);
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("データ取得失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedStorageId]);

  // ② アイテムを追加する関数
  const addItem = async (name, category) => {
    try {
      const newItem = {
        name: name,         // ロキソニン
        category: category, // 薬
        storage_id: selectedStorageId
      };

      // サーバーに保存 (POST)
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        const savedItem = await res.json();
        // 画面上のリストも更新（再取得せずに追加分だけ足すと高速）
        setItems((prev) => [...prev, savedItem]);
      }
    } catch (error) {
      console.error("追加失敗:", error);
    }
  };

  // ③ アイテムを削除する関数
  const removeItem = async (itemId) => {
    try {
      await fetch(`${API_URL}/${itemId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("削除失敗:", error);
    }
  };

  return { items, addItem, removeItem, loading };
};