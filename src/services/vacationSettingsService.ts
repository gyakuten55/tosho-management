import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { VacationSettings } from '@/types'

type VacationSettingsRow = Database['public']['Tables']['vacation_settings']['Row']
type VacationSettingsInsert = Database['public']['Tables']['vacation_settings']['Insert']
type VacationSettingsUpdate = Database['public']['Tables']['vacation_settings']['Update']

export class VacationSettingsService {
  static async get(): Promise<VacationSettings> {
    const { data, error } = await supabase
      .from('vacation_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 設定が存在しない場合はデフォルト設定を作成
        return this.createDefault()
      }
      throw new Error(`Failed to fetch vacation settings: ${error.message}`)
    }

    return this.mapToVacationSettings(data)
  }

  static async update(settings: VacationSettings): Promise<VacationSettings> {
    const settingsData: VacationSettingsUpdate = {
      minimum_off_days_per_month: settings.minimumOffDaysPerMonth,
      maximum_off_days_per_month: settings.maximumOffDaysPerMonth,
      notification_date: settings.notificationDate,
      team_monthly_weekday_limits: settings.teamMonthlyWeekdayLimits as any,
      specific_date_limits: settings.specificDateLimits as any,
      settings_data: {
        blackoutDates: settings.blackoutDates.map(d => d.toISOString()),
        holidayDates: settings.holidayDates.map(d => d.toISOString()),
        maxDriversOffPerDay: settings.maxDriversOffPerDay,
        globalMaxDriversOffPerDay: settings.globalMaxDriversOffPerDay,
        monthlyWeekdayLimits: settings.monthlyWeekdayLimits,
        periodLimits: settings.periodLimits,
        monthlyLimits: settings.monthlyLimits,
        weeklyLimits: settings.weeklyLimits
      } as any
    }

    // 設定が存在するかチェック
    const { data: existingData } = await supabase
      .from('vacation_settings')
      .select('id')
      .limit(1)
      .single()

    let data, error
    if (existingData) {
      // 更新
      const result = await supabase
        .from('vacation_settings')
        .update(settingsData)
        .eq('id', existingData.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // 新規作成
      const result = await supabase
        .from('vacation_settings')
        .insert(settingsData)
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      throw new Error(`Failed to update vacation settings: ${error.message}`)
    }

    if (!data) {
      return this.createDefault()
    }
    
    return this.mapToVacationSettings(data)
  }

  static async resetToDefault(): Promise<VacationSettings> {
    // 既存の設定を削除して新しいデフォルト設定を作成
    const { error: deleteError } = await supabase
      .from('vacation_settings')
      .delete()
      .neq('id', 0) // すべてのレコードを削除

    if (deleteError) {
      console.warn('Failed to delete existing settings:', deleteError.message)
    }

    return this.createDefault()
  }

  static async createDefault(): Promise<VacationSettings> {
    // 全チーム・全月・全曜日のデフォルト上限値を設定
    const teams = ['配送センターチーム', '常駐チーム', 'Bチーム', '外部ドライバー']
    const teamMonthlyWeekdayLimits: any = {}
    
    teams.forEach(team => {
      teamMonthlyWeekdayLimits[team] = {}
      // 1月から12月まで
      for (let month = 1; month <= 12; month++) {
        teamMonthlyWeekdayLimits[team][month] = {}
        // 日曜日(0)から土曜日(6)まで
        for (let weekday = 0; weekday <= 6; weekday++) {
          // チーム別のデフォルト値を設定
          let defaultLimit = 0
          switch (team) {
            case '配送センターチーム':
              defaultLimit = 2
              break
            case '常駐チーム':
              defaultLimit = 1
              break
            case 'Bチーム':
              defaultLimit = 1
              break
            case '外部ドライバー':
              defaultLimit = 2
              break
            default:
              defaultLimit = 1
          }
          teamMonthlyWeekdayLimits[team][month][weekday] = defaultLimit
        }
      }
    })

    const defaultSettings: VacationSettings = {
      minimumOffDaysPerMonth: 9,
      maximumOffDaysPerMonth: 12,
      notificationDate: 25,
      teamMonthlyWeekdayLimits,
      specificDateLimits: {},
      blackoutDates: [],
      holidayDates: [],
      maxDriversOffPerDay: {
        '配送センターチーム': 2,
        '常駐チーム': 1,
        'Bチーム': 1,
        '外部ドライバー': 2
      },
      globalMaxDriversOffPerDay: 5,
      monthlyWeekdayLimits: {},
      periodLimits: [],
      monthlyLimits: {},
      weeklyLimits: {}
    }

    return this.update(defaultSettings)
  }

  private static mapToVacationSettings(row: VacationSettingsRow): VacationSettings {
    const settingsData = row.settings_data as any || {}
    let teamMonthlyWeekdayLimits = row.team_monthly_weekday_limits as any || {}
    
    // データ整合性の確保: teamMonthlyWeekdayLimitsが空の場合は初期化
    const teams = ['配送センターチーム', '常駐チーム', 'Bチーム', '外部ドライバー']
    const hasValidData = teams.some(team => teamMonthlyWeekdayLimits[team])
    
    if (!hasValidData) {
      // デフォルト値で初期化
      teamMonthlyWeekdayLimits = {}
      teams.forEach(team => {
        teamMonthlyWeekdayLimits[team] = {}
        for (let month = 1; month <= 12; month++) {
          teamMonthlyWeekdayLimits[team][month] = {}
          for (let weekday = 0; weekday <= 6; weekday++) {
            let defaultLimit = 1
            switch (team) {
              case '配送センターチーム':
                defaultLimit = 2
                break
              case '常駐チーム':
                defaultLimit = 1
                break
              case 'Bチーム':
                defaultLimit = 1
                break
              case '外部ドライバー':
                defaultLimit = 2
                break
            }
            teamMonthlyWeekdayLimits[team][month][weekday] = defaultLimit
          }
        }
      })
    }
    
    return {
      minimumOffDaysPerMonth: row.minimum_off_days_per_month,
      maximumOffDaysPerMonth: row.maximum_off_days_per_month,
      notificationDate: row.notification_date,
      teamMonthlyWeekdayLimits,
      specificDateLimits: row.specific_date_limits as any || {},
      blackoutDates: (settingsData.blackoutDates || []).map((d: string) => new Date(d)),
      holidayDates: (settingsData.holidayDates || []).map((d: string) => new Date(d)),
      maxDriversOffPerDay: settingsData.maxDriversOffPerDay || {
        '配送センターチーム': 2,
        '常駐チーム': 1,
        'Bチーム': 1,
        '外部ドライバー': 2
      },
      globalMaxDriversOffPerDay: settingsData.globalMaxDriversOffPerDay || 5,
      monthlyWeekdayLimits: settingsData.monthlyWeekdayLimits || {},
      periodLimits: settingsData.periodLimits || [],
      monthlyLimits: settingsData.monthlyLimits || {},
      weeklyLimits: settingsData.weeklyLimits || {}
    }
  }
}