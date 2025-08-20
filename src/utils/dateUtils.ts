/**
 * タイムゾーンを考慮した日付フォーマット関数
 */

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換（ローカル時間基準）
 * toISOString()はUTCを基準とするため、日本時間では日付がずれる可能性がある
 * この関数はローカル時間を基準に日付を変換する
 */
export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 現在の日付をYYYY-MM-DD形式で取得（ローカル時間基準）
 */
export const getCurrentDateString = (): string => {
  return formatDateForDB(new Date())
}

/**
 * 日付文字列（YYYY-MM-DD）をDateオブジェクトに変換
 * タイムゾーンの問題を避けるため、ローカル時間で作成
 */
export const parseDBDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}