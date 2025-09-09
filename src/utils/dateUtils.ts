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
 * 現在の日付を取得（デバッグ用環境変数を優先）
 */
export const getCurrentDate = (): Date => {
  const debugDate = process.env.NEXT_PUBLIC_DEBUG_DATE
  console.log('getCurrentDate - Debug date from env:', debugDate)
  
  if (debugDate) {
    const [year, month, day] = debugDate.split('-').map(Number)
    const date = new Date(year, month - 1, day, 0, 0, 0, 0)
    console.log('getCurrentDate - Using debug date:', {
      input: debugDate,
      parsed: { year, month: month - 1, day },
      result: date.toISOString(),
      formatted: formatDateForDB(date)
    })
    return date
  }
  
  const now = new Date()
  console.log('getCurrentDate - Using current date:', {
    result: now.toISOString(),
    formatted: formatDateForDB(now)
  })
  return now
}

/**
 * 現在の日付をYYYY-MM-DD形式で取得（ローカル時間基準）
 */
export const getCurrentDateString = (): string => {
  return formatDateForDB(getCurrentDate())
}

/**
 * 日付文字列（YYYY-MM-DD）をDateオブジェクトに変換
 * タイムゾーンの問題を避けるため、ローカル時間で作成
 */
export const parseDBDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  // 時刻を0:00に統一してタイムゾーンの影響を完全に排除
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  console.log('parseDBDate debug:', { input: dateString, year, month, day, output: date.toISOString(), formatted: formatDateForDB(date) })
  return date
}