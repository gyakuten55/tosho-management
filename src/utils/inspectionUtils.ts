import { addMonths, addYears, format } from 'date-fns'

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
 * クレーン年次点検日から1年ごとの点検日を自動計算する
 * @param annualInspectionDate 基準となるクレーン年次点検日
 * @returns 基準点検日から1年間隔の年次点検日配列
 */
export function calculateAnnualInspectionDates(annualInspectionDate: Date): Date[] {
  const inspectionDates: Date[] = []
  const baseDate = new Date(annualInspectionDate)
  const today = new Date()
  const twoYearsFromNow = addYears(today, 2)
  
  // 基準年次点検日から1年ごとの点検日を計算
  // まず基準日以降の次回年次点検日を見つける
  let nextAnnualInspectionDate = new Date(baseDate)
  
  // 基準日が過去の場合、次回の1年周期年次点検日を見つける
  while (nextAnnualInspectionDate < today) {
    nextAnnualInspectionDate = addYears(nextAnnualInspectionDate, 1)
  }
  
  // 次回年次点検日から2年先まで1年ごとの点検日を生成
  let currentDate = new Date(nextAnnualInspectionDate)
  while (currentDate <= twoYearsFromNow) {
    inspectionDates.push(new Date(currentDate))
    currentDate = addYears(currentDate, 1)
  }
  
  return inspectionDates
}

/**
 * 次回のクレーン年次点検日を取得
 * @param annualInspectionDate 基準となるクレーン年次点検日
 * @returns 次回のクレーン年次点検日
 */
export function getNextAnnualInspectionDate(annualInspectionDate: Date): Date {
  const inspectionDates = calculateAnnualInspectionDates(annualInspectionDate)
  return inspectionDates[0] || addYears(new Date(), 1)
}

/**
 * 車両に対応するすべての点検日を取得（通常点検とクレーン年次点検を分けて管理）
 * @param inspectionDate 基準となる点検日
 * @param craneAnnualInspectionDate クレーン年次点検日（クレーン車の場合）
 * @returns 点検日の配列（タイプ付き）
 */
export function getAllInspectionDates(inspectionDate: Date, craneAnnualInspectionDate?: Date): Array<{date: Date, type: string}> {
  const inspections: Array<{date: Date, type: string}> = []
  
  // 通常の3ヶ月点検を追加
  const regularInspections = calculateInspectionDates(inspectionDate)
  regularInspections.forEach(date => {
    inspections.push({ date, type: '点検' })
  })
  
  // クレーン年次点検を追加（設定されている場合）
  if (craneAnnualInspectionDate) {
    const annualInspections = calculateAnnualInspectionDates(craneAnnualInspectionDate)
    annualInspections.forEach(date => {
      inspections.push({ date, type: 'クレーン年次点検' })
    })
  }
  
  // 日付順にソート
  return inspections.sort((a, b) => a.date.getTime() - b.date.getTime())
}