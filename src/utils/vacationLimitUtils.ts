import { VacationSettings, VacationLimitResult, VacationLimitPriority, PeriodLimit } from '@/types'

/**
 * 指定された日付の休暇上限人数を階層型優先順位に基づいて計算
 * @param date 対象日付
 * @param settings 休暇設定
 * @returns 計算結果（上限人数、適用ルール、詳細情報）
 */
export function getVacationLimitForDate(date: Date, settings: VacationSettings): VacationLimitResult {
  const dateStr = formatDateToString(date, 'YYYY-MM-DD')
  const month = date.getMonth() + 1  // 0-based to 1-based
  const weekday = date.getDay()      // 0=Sunday, 1=Monday, ...
  // 1. 特定日付設定（最優先）
  if (settings.specificDateLimits && settings.specificDateLimits[dateStr]) {
    return {
      limit: settings.specificDateLimits[dateStr],
      appliedRule: VacationLimitPriority.SPECIFIC_DATE,
      ruleName: '特定日付設定',
      ruleDetails: `${dateStr} の個別設定: ${settings.specificDateLimits[dateStr]}人`
    }
  }

  // 2. 月別曜日上限設定
  if (settings.monthlyWeekdayLimits && 
      settings.monthlyWeekdayLimits[month] && 
      settings.monthlyWeekdayLimits[month][weekday] !== undefined) {
    return {
      limit: settings.monthlyWeekdayLimits[month][weekday],
      appliedRule: VacationLimitPriority.MONTHLY_WEEKLY,
      ruleName: '月別曜日上限設定',
      ruleDetails: `${month}月の${getWeekdayName(weekday)}: ${settings.monthlyWeekdayLimits[month][weekday]}人`
    }
  }

  // 3. 期間設定をチェック
  if (settings.periodLimits) {
    for (const period of settings.periodLimits) {
      if (period.isActive && isDateInPeriod(date, period)) {
        return {
          limit: period.limit,
          appliedRule: VacationLimitPriority.PERIOD,
          ruleName: '期間設定',
          ruleDetails: `${period.name} (${period.startDate}〜${period.endDate}): ${period.limit}人`
        }
      }
    }
  }

  // 4. 月別設定
  if (settings.monthlyLimits && settings.monthlyLimits[month]) {
    return {
      limit: settings.monthlyLimits[month],
      appliedRule: VacationLimitPriority.MONTHLY,
      ruleName: '月別設定',
      ruleDetails: `${month}月の設定: ${settings.monthlyLimits[month]}人`
    }
  }

  // 5. 曜日設定
  if (settings.weeklyLimits && settings.weeklyLimits[weekday]) {
    return {
      limit: settings.weeklyLimits[weekday],
      appliedRule: VacationLimitPriority.WEEKLY,
      ruleName: '曜日設定',
      ruleDetails: `${getWeekdayName(weekday)}の設定: ${settings.weeklyLimits[weekday]}人`
    }
  }

  // 6. 基本設定（最下位）
  return {
    limit: settings.globalMaxDriversOffPerDay,
    appliedRule: VacationLimitPriority.GLOBAL_DEFAULT,
    ruleName: '基本設定',
    ruleDetails: `全体の基本上限: ${settings.globalMaxDriversOffPerDay}人`
  }
}

/**
 * 指定された日付が期間内にあるかをチェック
 * @param date 対象日付
 * @param period 期間設定
 * @returns 期間内にある場合true
 */
function isDateInPeriod(date: Date, period: PeriodLimit): boolean {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // MM-DD形式をパース
  const [startMonth, startDay] = period.startDate.split('-').map(Number)
  const [endMonth, endDay] = period.endDate.split('-').map(Number)
  
  // 年末年始のような年をまたぐ期間の処理
  if (startMonth > endMonth) {
    // 例: 12-25 から 01-07 (年末年始)
    return (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay) ||
      (month > startMonth) ||
      (month < endMonth)
    )
  } else {
    // 通常の期間
    return (
      (month > startMonth || (month === startMonth && day >= startDay)) &&
      (month < endMonth || (month === endMonth && day <= endDay))
    )
  }
}

/**
 * 日付を指定形式の文字列に変換
 * @param date 日付
 * @param format 形式 ('YYYY-MM-DD' など)
 * @returns フォーマットされた文字列
 */
function formatDateToString(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}

/**
 * 曜日番号を日本語名に変換
 * @param weekday 曜日番号 (0=日曜日, 1=月曜日, ...)
 * @returns 曜日名
 */
function getWeekdayName(weekday: number): string {
  const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
  return weekdays[weekday] || '不明'
}

/**
 * 月番号を日本語名に変換
 * @param month 月番号 (1-12)
 * @returns 月名
 */
export function getMonthName(month: number): string {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months[month - 1] || '不明'
}

/**
 * 指定期間内の全日付に対して休暇上限を計算
 * @param startDate 開始日
 * @param endDate 終了日  
 * @param settings 休暇設定
 * @returns 日付ごとの上限計算結果
 */
export function getVacationLimitsForDateRange(
  startDate: Date, 
  endDate: Date, 
  settings: VacationSettings
): { [dateString: string]: VacationLimitResult } {
  const results: { [dateString: string]: VacationLimitResult } = {}
  
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = formatDateToString(current, 'YYYY-MM-DD')
    results[dateStr] = getVacationLimitForDate(current, settings)
    current.setDate(current.getDate() + 1)
  }
  
  return results
}

/**
 * 設定の重複や矛盾をチェック
 * @param settings 休暇設定
 * @returns 検証結果
 */
export function validateVacationSettings(settings: VacationSettings): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // 基本設定の妥当性チェック
  if (settings.globalMaxDriversOffPerDay <= 0) {
    errors.push('全体の基本上限は1人以上である必要があります')
  }

  // 期間設定の重複チェック
  if (settings.periodLimits) {
    for (let i = 0; i < settings.periodLimits.length; i++) {
      for (let j = i + 1; j < settings.periodLimits.length; j++) {
        const period1 = settings.periodLimits[i]
        const period2 = settings.periodLimits[j]
        if (period1.isActive && period2.isActive && periodsOverlap(period1, period2)) {
          warnings.push(`期間設定「${period1.name}」と「${period2.name}」が重複しています`)
        }
      }
    }
  }

  // 設定値の範囲チェック
  Object.values(settings.monthlyLimits || {}).forEach((limit, index) => {
    if (limit < 0) {
      errors.push(`${index + 1}月の設定値が負の値です`)
    }
  })

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}

/**
 * 二つの期間が重複するかをチェック
 * @param period1 期間1
 * @param period2 期間2
 * @returns 重複する場合true
 */
function periodsOverlap(period1: PeriodLimit, period2: PeriodLimit): boolean {
  // 簡略化された重複チェック（実際の実装では年をまたぐ期間も考慮が必要）
  const [start1Month, start1Day] = period1.startDate.split('-').map(Number)
  const [end1Month, end1Day] = period1.endDate.split('-').map(Number)
  const [start2Month, start2Day] = period2.startDate.split('-').map(Number)
  const [end2Month, end2Day] = period2.endDate.split('-').map(Number)

  // 詳細な重複チェックロジックを実装
  // ここでは簡易版として、月が重複する場合のみチェック
  return !(end1Month < start2Month || end2Month < start1Month)
}