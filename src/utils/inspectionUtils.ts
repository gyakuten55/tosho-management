import { addMonths, format } from 'date-fns'

/**
 * 点検日から3ヶ月ごとの点検日を自動計算する
 * @param inspectionDate 基準となる点検日
 * @returns 基準点検日から3ヶ月間隔の点検日配列
 */
export function calculateInspectionDates(inspectionDate: Date): Date[] {
  const inspectionDates: Date[] = []
  let currentDate = new Date(inspectionDate)
  
  // 基準点検日から過去方向に3ヶ月ずつ遡って点検日を計算
  // 現在日から2年先まで
  const today = new Date()
  const twoYearsFromNow = addMonths(today, 24)
  
  // 基準点検日から過去に遡って基準点を見つける
  while (currentDate > today) {
    currentDate = addMonths(currentDate, -3)
  }
  
  // 設定した基準点検日が今日以降の場合は含める
  const baseInspectionDate = new Date(inspectionDate)
  if (baseInspectionDate >= today && !inspectionDates.some(date => date.getTime() === baseInspectionDate.getTime())) {
    inspectionDates.push(baseInspectionDate)
  }
  
  // 現在日以降の点検日を計算
  while (currentDate <= twoYearsFromNow) {
    if (currentDate >= today && !inspectionDates.some(date => date.getTime() === currentDate.getTime())) {
      inspectionDates.push(new Date(currentDate))
    }
    currentDate = addMonths(currentDate, 3)
  }
  
  // 日付順にソート
  return inspectionDates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * 次回の3ヶ月点検日を取得
 * @param inspectionDate 基準となる点検日
 * @returns 次回の3ヶ月点検日
 */
export function getNextInspectionDate(inspectionDate: Date): Date {
  const inspectionDates = calculateInspectionDates(inspectionDate)
  return inspectionDates[0] || addMonths(new Date(), 3)
}

/**
 * 車両に対応するすべての点検日を取得（車検・クレーン年次点検も統一）
 * @param inspectionDate 基準となる点検日
 * @param hasCrane クレーン車かどうか
 * @returns 点検日の配列（タイプ付き）
 */
export function getAllInspectionDates(inspectionDate: Date, hasCrane: boolean = false): Array<{date: Date, type: string}> {
  const inspections: Array<{date: Date, type: string}> = []
  
  // すべての点検日を追加（すべて同じ「点検」として扱う）
  const allInspections = calculateInspectionDates(inspectionDate)
  allInspections.forEach(date => {
    inspections.push({ date, type: '点検' })
  })
  
  // 日付順にソート
  return inspections.sort((a, b) => a.date.getTime() - b.date.getTime())
}