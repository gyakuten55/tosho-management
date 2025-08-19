import { addMonths, format } from 'date-fns'

/**
 * 点検日から3ヶ月ごとの点検日を自動計算する
 * @param inspectionDate 基準となる点検日
 * @returns 基準点検日から3ヶ月間隔の点検日配列
 */
export function calculateInspectionDates(inspectionDate: Date): Date[] {
  const inspectionDates: Date[] = []
  const baseDate = new Date(inspectionDate)
  const today = new Date()
  const twoYearsFromNow = addMonths(today, 24)
  
  // 基準点検日から3ヶ月ごとの点検日を計算
  // まず基準日以降の次回点検日を見つける
  let nextInspectionDate = new Date(baseDate)
  
  // 基準日が過去の場合、次回の3ヶ月周期点検日を見つける
  while (nextInspectionDate < today) {
    nextInspectionDate = addMonths(nextInspectionDate, 3)
  }
  
  // 次回点検日から2年先まで3ヶ月ごとの点検日を生成
  let currentDate = new Date(nextInspectionDate)
  while (currentDate <= twoYearsFromNow) {
    inspectionDates.push(new Date(currentDate))
    currentDate = addMonths(currentDate, 3)
  }
  
  return inspectionDates
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