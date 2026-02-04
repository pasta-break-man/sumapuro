/**
 * オブジェクト中身の「追加」「削除」の挙動をまとめたファイル
 */

/** 1行分のデフォルト値 */
export const DEFAULT_CONTENT_ROW = { name: "", category: "", count: 0 };

/**
 * 中身リストに1行追加する（純粋関数）
 * @param {Array<{ name: string, category: string, count: number }>} contents
 * @param {{ name: string, category: string, count: number }} row
 * @returns {Array} 新しい contents 配列
 */
export function addContentRow(contents, row) {
  const normalized = {
    name: String(row?.name ?? "").trim(),
    category: String(row?.category ?? "").trim(),
    count: Number(row?.count) || 0,
  };
  return [...(contents ?? []), normalized];
}

/**
 * 指定インデックスの行を削除する（純粋関数）
 * @param {Array} contents
 * @param {number[]} indicesToDelete 削除する行のインデックス（0始まり）
 * @returns {Array} 新しい contents 配列
 */
export function deleteContentRowsByIndices(contents, indicesToDelete) {
  const set = new Set(indicesToDelete);
  return (contents ?? []).filter((_, i) => !set.has(i));
}
