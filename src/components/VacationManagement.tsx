'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Calendar,
  Plus,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Smartphone,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VacationRequest, MonthlyVacationStats, VacationSettings, VacationNotification, Driver, Vehicle, Holiday } from '@/types'
import { VacationService } from '@/services/vacationService'
import { DriverService } from '@/services/driverService'
import { VacationSettingsService } from '@/services/vacationSettingsService'
import { NotificationService } from '@/services/notificationService'
import { HolidayService } from '@/services/holidayService'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface DailyVacationInfo {
  date: Date
  vacations: {
    driverId: number
    driverName: string
    team: string
    isExternalDriver: boolean
  }[]
  nightShifts: {
    driverId: number
    driverName: string
    team: string
    isExternalDriver: boolean
  }[]
  workingDrivers: {
    driverId: number
    driverName: string
    team: string
    isExternalDriver: boolean
  }[]
  totalOffCount: number
  internalDriverOffCount: number
  externalDriverOffCount: number
  nightShiftCount: number
  workingCount: number
}

interface VacationManagementProps {
  // Props are optional now as we load data from Supabase
  vacationSettings?: VacationSettings
  drivers?: Driver[]
  vehicles?: Vehicle[]
  onVacationSettingsChange?: (settings: VacationSettings) => void
  onVehiclesChange?: (vehicles: Vehicle[]) => void
}

export default function VacationManagement({
  vacationSettings: propVacationSettings,
  drivers: propDrivers,
  vehicles: propVehicles,
  onVacationSettingsChange,
  onVehiclesChange
}: VacationManagementProps) {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [vacationStats, setVacationStats] = useState<MonthlyVacationStats[]>([])
  const [vacationNotifications, setVacationNotifications] = useState<VacationNotification[]>([])
  const [vacationSettings, setVacationSettings] = useState<VacationSettings | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<'working' | 'day_off' | 'night_shift'>('day_off')
  const [statsMonth, setStatsMonth] = useState(new Date()) // 統計タブ用の月選択state
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all') // モーダル内のチームフィルター
  const [quickUpdateLoading, setQuickUpdateLoading] = useState<Set<number>>(new Set()) // クイック更新中のドライバーID
  const [quickTeamFilter, setQuickTeamFilter] = useState<string>('all') // クイック設定セクション用のチームフィルター
  const [quickSortDirection, setQuickSortDirection] = useState<'asc' | 'desc'>('asc') // 勤務状態のソート方向（asc: 休暇→夜勤→出勤, desc: 出勤→夜勤→休暇）
  const [specialNotes, setSpecialNotes] = useState<Map<number, { enabled: boolean; note: string }>>(new Map()) // ドライバーIDごとの特記事項管理
  const [holidaySyncLoading, setHolidaySyncLoading] = useState(false) // 祝日同期ローディング状態
  const [holidays, setHolidays] = useState<Holiday[]>([]) // 祝日データ

  // 特記事項をデータベースに自動保存する関数
  const saveSpecialNoteToDatabase = async (driverId: number, note: string, enabled: boolean) => {
    if (!selectedDate) return

    try {
      // 既存の勤務状態レコードを探す
      const existingRequest = vacationRequests.find(req =>
        req.driverId === driverId && 
        isSameDay(req.date, selectedDate) &&
        req.id > 0 // DBに保存済み
      )

      if (existingRequest) {
        // 既存レコードがある場合は特記事項を更新
        const updatedRequestData = {
          ...existingRequest,
          hasSpecialNote: enabled,
          specialNote: enabled ? note : undefined
        }

        const savedRequest = await VacationService.update(existingRequest.id, updatedRequestData)
        setVacationRequests(vacationRequests.map(req => 
          req.id === existingRequest.id ? savedRequest : req
        ))
      }
    } catch (error) {
      console.error('特記事項の保存に失敗しました:', error)
    }
  }

  // デバウンス用のタイマー管理
  const [debounceTimers, setDebounceTimers] = useState<Map<number, NodeJS.Timeout>>(new Map())

  // 特記事項管理用ヘルパー関数
  const updateSpecialNote = (driverId: number, enabled: boolean, note: string = '') => {
    setSpecialNotes(prev => {
      const newMap = new Map(prev)
      newMap.set(driverId, { enabled, note })
      return newMap
    })

    // 既存のタイマーをクリア
    const existingTimer = debounceTimers.get(driverId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 新しいタイマーを設定（500ms後に自動保存）
    const newTimer = setTimeout(() => {
      saveSpecialNoteToDatabase(driverId, note, enabled)
      setDebounceTimers(prev => {
        const newMap = new Map(prev)
        newMap.delete(driverId)
        return newMap
      })
    }, 500)

    setDebounceTimers(prev => {
      const newMap = new Map(prev)
      newMap.set(driverId, newTimer)
      return newMap
    })
  }

  const getSpecialNote = (driverId: number) => {
    return specialNotes.get(driverId) || { enabled: false, note: '' }
  }

  // エスケープキーでモーダルを閉じる
  useEscapeKey(() => {
    if (showVacationForm) {
      setShowVacationForm(false)
    }
  }, showVacationForm)

  // デバッグ: selectedWorkStatusの変更を追跡
  useEffect(() => {
    console.log('VacationManagement - selectedWorkStatus changed:', selectedWorkStatus)
  }, [selectedWorkStatus])

  useEffect(() => {
    loadVacationData()
  }, [])

  // 既存のvacationRequestsから特記事項をspecialNotesに読み込む（選択日が変更された時のみ）
  useEffect(() => {
    if (!selectedDate) return
    
    setSpecialNotes(prevSpecialNotes => {
      const newSpecialNotes = new Map<number, { enabled: boolean; note: string }>()
      
      // 選択された日付の特記事項のみを読み込み
      vacationRequests.forEach(request => {
        if (isSameDay(request.date, selectedDate)) {
          // データベースに保存済みの特記事項があればセット
          if (request.hasSpecialNote && request.specialNote) {
            newSpecialNotes.set(request.driverId, {
              enabled: true,
              note: request.specialNote
            })
          }
          // UI側で設定した特記事項も保持（データベース未保存でも維持）
          else if (prevSpecialNotes.has(request.driverId)) {
            const existing = prevSpecialNotes.get(request.driverId)
            if (existing && existing.enabled) {
              newSpecialNotes.set(request.driverId, existing)
            }
          }
        }
      })
      
      return newSpecialNotes
    })
  }, [selectedDate])

  // Props経由で設定が変更された場合の反映
  useEffect(() => {
    if (propVacationSettings && JSON.stringify(propVacationSettings) !== JSON.stringify(vacationSettings)) {
      setVacationSettings(propVacationSettings)
    }
  }, [propVacationSettings])

  // デバッグ: vacationSettingsが変更された時にログ出力
  useEffect(() => {
    if (vacationSettings) {
      console.log('VacationManagement - vacationSettings updated:', {
        specificDateLimits: vacationSettings.specificDateLimits,
        teamMonthlyWeekdayLimits: Object.keys(vacationSettings.teamMonthlyWeekdayLimits || {}),
        settingsKeys: Object.keys(vacationSettings)
      })
    }
  }, [vacationSettings])

  const loadVacationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all required data in parallel
      // 常に最新の設定を取得するため、プロップスよりもデータベースを優先
      const [requests, settings, driversData, vehiclesData, notifications] = await Promise.all([
        VacationService.getAll(),
        VacationSettingsService.get(),
        propDrivers ? Promise.resolve(propDrivers) : DriverService.getAll(),
        propVehicles ? Promise.resolve(propVehicles) : Promise.resolve([]),
        NotificationService.getAll()
      ])
      
      console.log('VacationManagement - loadVacationData:', {
        settingsFromDB: settings,
        specificDateLimits: settings.specificDateLimits,
        teamMonthlyWeekdayLimits: Object.keys(settings.teamMonthlyWeekdayLimits || {}),
        rawRequestsCount: requests.length
      })

      // 重複データを排除 - 同じdriver_id + dateの組み合わせで最新のレコード（最大のid）のみ保持
      const uniqueRequests = requests.reduce((acc, current) => {
        const key = `${current.driverId}|${current.date.toISOString().split('T')[0]}`
        const existing = acc.get(key)
        
        if (!existing || current.id > existing.id) {
          acc.set(key, current)
        }
        return acc
      }, new Map<string, VacationRequest>())
      
      const deduplicatedRequests = Array.from(uniqueRequests.values())
      
      if (deduplicatedRequests.length !== requests.length) {
        console.log(`重複データを排除しました: ${requests.length}件 → ${deduplicatedRequests.length}件`)
      }

      setVacationRequests(deduplicatedRequests)
      setVacationSettings(settings)
      setDrivers(driversData)
      setVehicles(vehiclesData)
      setVacationNotifications(notifications)
      calculateVacationStats(requests, driversData, settings)
    } catch (err) {
      console.error('Failed to load vacation data:', err)
      setError('休暇データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const calculateVacationStats = (requests: VacationRequest[], driversData: Driver[] = drivers, settings: VacationSettings | null = vacationSettings) => {
    // 月別統計の計算ロジック
    const statsMap = new Map<string, MonthlyVacationStats>()
    
    requests.forEach(request => {
      const key = `${request.driverId}_${request.date.getFullYear()}_${request.date.getMonth() + 1}`
      
      if (!statsMap.has(key)) {
        const driver = driversData.find(d => d.id === request.driverId)
        if (driver && settings) {
          statsMap.set(key, {
            driverId: request.driverId,
            driverName: request.driverName,
            team: request.team,
            employeeId: request.employeeId,
            year: request.date.getFullYear(),
            month: request.date.getMonth() + 1,
            totalOffDays: 0,
            requiredMinimumDays: settings.minimumOffDaysPerMonth,
            remainingRequiredDays: settings.minimumOffDaysPerMonth,
          })
        }
      }
      
      const stat = statsMap.get(key)
      if (stat && request.isOff) {
        stat.totalOffDays += 1
        stat.remainingRequiredDays = Math.max(0, stat.requiredMinimumDays - stat.totalOffDays)
      }
    })
    
    setVacationStats(Array.from(statsMap.values()))
  }
  

  // ソート用のstate
  const [sortField, setSortField] = useState<'driverName' | 'totalOffDays' | 'remainingRequiredDays' | 'team' | 'employeeId' | 'requiredMinimumDays'>('driverName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 指定日付とチームに対する休暇上限を取得する関数
  const getVacationLimitForDate = (date: Date, team: string): number => {
    if (!vacationSettings) return 3 // デフォルト値
    
    // タイムゾーンの影響を避けるため、ローカル日付文字列を使用
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12
    const day = date.getDate()
    const weekday = date.getDay() // 0-6（日曜日=0）
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // デバッグ情報を追加
    console.log('getVacationLimitForDate:', {
      inputDate: date,
      dateString,
      team,
      specificDateLimits: vacationSettings.specificDateLimits,
      hasSpecificLimit: !!vacationSettings.specificDateLimits[dateString]?.[team],
      utcDate: date.toISOString().split('T')[0],
      localDate: dateString
    })

    // 1. 特定日付設定（最優先）
    if (vacationSettings.specificDateLimits && vacationSettings.specificDateLimits[dateString]?.[team] !== undefined) {
      console.log('Using specific date limit:', vacationSettings.specificDateLimits[dateString][team])
      return vacationSettings.specificDateLimits[dateString][team]
    }

    // 2. チーム別月別曜日設定
    if (vacationSettings.teamMonthlyWeekdayLimits?.[team]?.[month]?.[weekday] !== undefined) {
      console.log('Using team monthly weekday limit:', vacationSettings.teamMonthlyWeekdayLimits[team][month][weekday])
      return vacationSettings.teamMonthlyWeekdayLimits[team][month][weekday]
    }

    // 3. 旧設定からのフォールバック（後方互換性）
    if (vacationSettings.maxDriversOffPerDay?.[team] !== undefined) {
      console.log('Using legacy team limit:', vacationSettings.maxDriversOffPerDay[team])
      return vacationSettings.maxDriversOffPerDay[team]
    }

    // 4. デフォルト値
    const defaultLimit = vacationSettings.globalMaxDriversOffPerDay || 3
    console.log('Using default limit:', defaultLimit)
    return defaultLimit
  }

  // 初期化時に月間統計を再計算と古いデータの削除、デフォルト出勤設定
  useEffect(() => {
    const recalculateAllStats = () => {
      // 統計データを生成する年月を取得
      const allMonths = new Set<string>()
      const today = new Date()
      
      // 現在の月を含む前後12ヶ月を追加（より広い範囲をカバー）
      for (let monthOffset = -12; monthOffset <= 12; monthOffset++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
        allMonths.add(`${targetDate.getFullYear()}-${targetDate.getMonth() + 1}`)
      }
      
      // 休暇データから年月を抽出
      vacationRequests.forEach(req => {
        const year = req.date.getFullYear()
        const month = req.date.getMonth() + 1
        allMonths.add(`${year}-${month}`)
      })
      
      const newStats: MonthlyVacationStats[] = []
      
      // 各月の統計を生成
      allMonths.forEach(yearMonth => {
        const [yearStr, monthStr] = yearMonth.split('-')
        const year = parseInt(yearStr)
        const month = parseInt(monthStr)
        
        drivers.forEach(driver => {
          if (driver.employeeId.startsWith('E')) return // 配送センター外注は統計に含めない
          
          // その月のドライバーの休暇数を計算
          const monthVacations = vacationRequests.filter(req => 
            req.driverId === driver.id && 
            req.date.getFullYear() === year && 
            req.date.getMonth() + 1 === month &&
            req.workStatus === 'day_off' &&
            !req.isExternalDriver
          )
          
          const totalOffDays = monthVacations.length
          const remainingRequiredDays = Math.max(0, (vacationSettings?.minimumOffDaysPerMonth || 0) - totalOffDays)
          
          newStats.push({
            driverId: driver.id,
            driverName: driver.name,
            team: driver.team,
            employeeId: driver.employeeId,
            year,
            month,
            totalOffDays,
            requiredMinimumDays: vacationSettings?.minimumOffDaysPerMonth || 0,
            remainingRequiredDays,
          })
        })
      })
      
      setVacationStats(newStats)
    }

    // 特定の月の統計データを生成する関数
    const generateStatsForMonth = (targetDate: Date) => {
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1
      const monthKey = `${year}-${month}`
      
      // 既存の統計データから該当月のものを除外
      const existingStats = vacationStats.filter(stat => 
        !(stat.year === year && stat.month === month)
      )
      
      const monthStats: MonthlyVacationStats[] = []
      
      drivers.forEach(driver => {
        if (driver.employeeId.startsWith('E')) return // 配送センター外注は統計に含めない
        
        // その月のドライバーの休暇数を計算
        const monthVacations = vacationRequests.filter(req => 
          req.driverId === driver.id && 
          req.date.getFullYear() === year && 
          req.date.getMonth() + 1 === month &&
          req.workStatus === 'day_off' &&
          !req.isExternalDriver
        )
        
        const totalOffDays = monthVacations.length
        const remainingRequiredDays = Math.max(0, (vacationSettings?.minimumOffDaysPerMonth || 0) - totalOffDays)
        
        monthStats.push({
          driverId: driver.id,
          driverName: driver.name,
          team: driver.team,
          employeeId: driver.employeeId,
          year,
          month,
          totalOffDays,
          requiredMinimumDays: vacationSettings?.minimumOffDaysPerMonth || 0,
          remainingRequiredDays
        })
      })
      
      // 既存の統計データと新しい月の統計データを結合
      setVacationStats([...existingStats, ...monthStats])
    }

    // 1年以上前の休暇データを自動削除（修正版）
    const cleanupOldVacationData = () => {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      oneYearAgo.setHours(0, 0, 0, 0) // 時刻を00:00:00に設定
      
      const filteredRequests = vacationRequests.filter(request => {
        const requestDateOnly = new Date(request.date)
        requestDateOnly.setHours(0, 0, 0, 0) // 時刻を00:00:00に設定
        return requestDateOnly >= oneYearAgo
      })
      
      if (filteredRequests.length !== vacationRequests.length) {
        const deletedCount = vacationRequests.length - filteredRequests.length
        setVacationRequests(filteredRequests)
        console.log(`古い休暇データを自動削除しました: ${deletedCount}件`)
      }
    }

    // 今日から1ヶ月間の全ドライバーをデフォルト出勤に設定
    // 仮想レコード生成を無効化 - 重複データ問題と同期問題を解決するため
    /*
    const initializeDefaultWorkStatus = () => {
      if (drivers.length === 0) return
      
      const today = new Date()
      const oneMonthLater = new Date()
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
      
      const defaultRequests: VacationRequest[] = []
      
      // 今日から1ヶ月間の各日をチェック
      for (let d = new Date(today); d <= oneMonthLater; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d)
        const existingRequests = vacationRequests.filter(req => isSameDay(req.date, currentDate))
        const driversWithStatus = existingRequests.map(req => req.driverId)
        const driversWithoutStatus = drivers.filter(driver => !driversWithStatus.includes(driver.id))
        
        driversWithoutStatus.forEach(driver => {
          defaultRequests.push({
            id: -(Math.floor(Date.now() / 1000) + driver.id),
            driverId: driver.id,
            driverName: driver.name,
            team: driver.team,
            employeeId: driver.employeeId,
            date: new Date(currentDate),
            workStatus: 'working',
            isOff: false,
            type: 'working',
            reason: 'デフォルト出勤',
            status: 'approved',
            requestDate: new Date(),
            isExternalDriver: driver.employeeId.startsWith('E'),
            registeredBy: 'admin' as const
          })
        })
      }
      
      if (defaultRequests.length > 0) {
        // useEffectの外でsetTimeoutを使用してstate更新を遅延実行
        setTimeout(() => {
          setVacationRequests([...vacationRequests, ...defaultRequests])
        }, 0)
      }
    }
    */
    
    if (drivers.length > 0) {
      recalculateAllStats()
      // cleanupOldVacationData() // データが勝手に削除される問題を防ぐためコメントアウト
      // initializeDefaultWorkStatus() // 重複回避のためコメントアウト
    }
  }, [drivers, vacationSettings, setVacationStats]) // vacationRequestsとsetVacationRequestsを依存配列から削除

  // 月25日に未達成ドライバーに通知
  useEffect(() => {
    const checkAndSendNotifications = () => {
      const today = new Date()
      const currentDate = today.getDate()
      
      // 25日のチェック
      if (currentDate === 25) {
        const currentMonth = format(today, 'yyyy-MM')
        const currentStats = vacationStats.filter(stat => 
          `${stat.year}-${String(stat.month).padStart(2, '0')}` === currentMonth &&
          stat.remainingRequiredDays > 0
        )
        
        currentStats.forEach(stat => {
          const notification: VacationNotification = {
            id: -(Math.floor(Date.now() / 1000) + stat.driverId),
            driverId: stat.driverId,
            driverName: stat.driverName,
            type: 'vacation_reminder',
            message: `あと${stat.remainingRequiredDays}日の休暇申請が必要です。月末までに申請してください。`,
            date: today,
            isRead: false,
            priority: 'high'
          }
          
          setVacationNotifications(prev => [...prev, notification])
        })
      }
    }
    
    checkAndSendNotifications()
  }, [vacationStats])

  // 統計タブの月選択時に該当月の統計データを生成
  useEffect(() => {
    if (drivers.length > 0 && currentView === 'stats') {
      const targetMonth = format(statsMonth, 'yyyy-MM')
      const hasStatsForMonth = vacationStats.some(stat => 
        `${stat.year}-${String(stat.month).padStart(2, '0')}` === targetMonth
      )
      
      // 該当月の統計データが存在しない場合は生成する
      if (!hasStatsForMonth) {
        const year = statsMonth.getFullYear()
        const month = statsMonth.getMonth() + 1
        
        // 既存の統計データから該当月のものを除外
        const existingStats = vacationStats.filter(stat => 
          !(stat.year === year && stat.month === month)
        )
        
        const monthStats: MonthlyVacationStats[] = []
        
        drivers.forEach(driver => {
          if (driver.employeeId.startsWith('E')) return // 配送センター外注は統計に含めない
          
          // その月のドライバーの休暇数を計算
          const monthVacations = vacationRequests.filter(req => 
            req.driverId === driver.id && 
            req.date.getFullYear() === year && 
            req.date.getMonth() + 1 === month &&
            req.workStatus === 'day_off' &&
            !req.isExternalDriver
          )
          
          const totalOffDays = monthVacations.length
          const remainingRequiredDays = Math.max(0, (vacationSettings?.minimumOffDaysPerMonth || 0) - totalOffDays)
          
          monthStats.push({
            driverId: driver.id,
            driverName: driver.name,
            team: driver.team,
            employeeId: driver.employeeId,
            year,
            month,
            totalOffDays,
            requiredMinimumDays: vacationSettings?.minimumOffDaysPerMonth || 0,
            remainingRequiredDays
          })
        })
        
        // 既存の統計データと新しい月の統計データを結合
        setVacationStats([...existingStats, ...monthStats])
      }
    }
  }, [statsMonth, currentView, drivers, vacationRequests, vacationSettings, vacationStats, setVacationStats])

  // 祝日データをロード（カレンダーの月が変わった時）
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = calendarDate.getFullYear()
        const yearHolidays = await HolidayService.getByYear(year)
        setHolidays(yearHolidays)
      } catch (error) {
        console.error('Failed to load holidays:', error)
        setHolidays([])
      }
    }
    
    loadHolidays()
  }, [calendarDate])

  // 統計情報を計算（統計タブ用の月を使用）
  const currentMonth = format(currentView === 'stats' ? statsMonth : calendarDate, 'yyyy-MM')
  const currentStats = vacationStats.filter(stat => 
    `${stat.year}-${String(stat.month).padStart(2, '0')}` === currentMonth
  )

  const monthlyStats = {
    totalDrivers: currentStats.length,
    driversWithSufficientVacation: currentStats.filter(stat => stat.remainingRequiredDays === 0).length,
    driversNeedingVacation: currentStats.filter(stat => stat.remainingRequiredDays > 0).length,
    totalVacationDays: currentStats.reduce((sum, stat) => sum + stat.totalOffDays, 0),
    averageVacationDays: currentStats.length > 0 ? 
      Math.round((currentStats.reduce((sum, stat) => sum + stat.totalOffDays, 0) / currentStats.length) * 10) / 10 : 0
  }

  // 祝日チェック関数
  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      format(date, 'yyyy-MM-dd') === format(holiday.date, 'yyyy-MM-dd')
    )
  }

  // 祝日名取得関数
  const getHolidayName = (date: Date) => {
    const holiday = holidays.find(holiday => 
      format(date, 'yyyy-MM-dd') === format(holiday.date, 'yyyy-MM-dd')
    )
    return holiday ? holiday.name : null
  }

  // 指定日の未設定ドライバーをデフォルト出勤に設定（非同期で実行）
  // 仮想レコード生成を無効化 - 重複データ問題と同期問題を解決するため
  /*
  const ensureAllDriversHaveWorkStatus = useCallback((date: Date) => {
    const existingRequests = vacationRequests.filter(req => isSameDay(req.date, date))
    const driversWithStatus = existingRequests.map(req => req.driverId)
    const driversWithoutStatus = drivers.filter(driver => !driversWithStatus.includes(driver.id))
    
    if (driversWithoutStatus.length > 0) {
      const newRequests: VacationRequest[] = driversWithoutStatus.map(driver => ({
        id: -(Math.floor(Date.now() / 1000) + driver.id),
        driverId: driver.id,
        driverName: driver.name,
        team: driver.team,
        employeeId: driver.employeeId,
        date: date,
        workStatus: 'working',
        isOff: false,
        type: 'working',
        reason: 'デフォルト出勤',
        status: 'approved',
        requestDate: new Date(),
        isExternalDriver: driver.employeeId.startsWith('E'),
        registeredBy: 'admin' as const
      }))
      
      // レンダリング外でstate更新を実行
      setTimeout(() => {
        setVacationRequests([...vacationRequests, ...newRequests])
      }, 0)
    }
  }, [drivers, vacationRequests, setVacationRequests])
  */

  // カレンダーの日付情報を生成（6週間分の完全なカレンダーグリッド）
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate)
    const monthEnd = endOfMonth(calendarDate)
    
    // カレンダーグリッドの開始と終了（前月末から翌月初まで含む）
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜日開始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }) // 日曜日開始
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return days.map(day => {
      const dayRequests = vacationRequests.filter(req => isSameDay(req.date, day))
      
      // レンダリング中はstateを更新せず、データのみ計算
      const driversWithStatus = dayRequests.map(req => req.driverId)
      const driversWithoutStatus = drivers.filter(driver => !driversWithStatus.includes(driver.id))
      
      // 仮想レコードを無効化 - 実データのみ表示
      const virtualWorkingDrivers: any[] = []
      
      const dayVacations = dayRequests.filter(req => req.workStatus === 'day_off')
      const dayNightShifts = dayRequests.filter(req => req.workStatus === 'night_shift')
      const dayWorking = dayRequests.filter(req => req.workStatus === 'working')
      
      const internalDriverVacations = dayVacations.filter(v => !v.isExternalDriver)
      const externalDriverVacations = dayVacations.filter(v => v.isExternalDriver)

      return {
        date: day,
        vacations: dayVacations.map(v => ({
          driverId: v.driverId,
          driverName: v.driverName,
          team: v.team,
          isExternalDriver: v.isExternalDriver
        })),
        nightShifts: dayNightShifts.map(v => ({
          driverId: v.driverId,
          driverName: v.driverName,
          team: v.team,
          isExternalDriver: v.isExternalDriver
        })),
        workingDrivers: [...dayWorking.map(v => ({
          driverId: v.driverId,
          driverName: v.driverName,
          team: v.team,
          isExternalDriver: v.isExternalDriver
        })), ...virtualWorkingDrivers],
        totalOffCount: dayVacations.length,
        internalDriverOffCount: internalDriverVacations.length,
        externalDriverOffCount: externalDriverVacations.length,
        nightShiftCount: dayNightShifts.length,
        workingCount: dayWorking.length
      } as DailyVacationInfo
    })
  }

  // 選択した日付の既存勤務状態を取得
  const getExistingVacations = () => {
    if (!selectedDate) return []
    return vacationRequests.filter(req => 
      isSameDay(req.date, selectedDate) && req.workStatus === 'day_off'
    )
  }

  // 選択した日付の勤務状態を取得（出勤、休暇、夜勤）
  const getWorkStatusForDate = (date: Date) => {
    return vacationRequests.filter(req => isSameDay(req.date, date))
  }

  // チームフィルターを適用した勤務状態を取得
  const getFilteredWorkStatusForDate = (date: Date, teamFilter: string) => {
    const allWorkStatus = getWorkStatusForDate(date)
    
    if (teamFilter === 'all') {
      return allWorkStatus
    }
    
    return allWorkStatus.filter(workStatus => workStatus.team === teamFilter)
  }

  // ドライバー名から担当車両を取得するヘルパー関数
  const getVehicleByDriverName = (driverName: string) => {
    return vehicles.find(vehicle => vehicle.driver === driverName)
  }

  // セルクリック時の処理
  const handleDateClick = (date: Date) => {
    console.log('VacationManagement - handleDateClick: resetting form state')
    // その日のすべてのドライバーがデフォルト出勤状態になるようにする
    // ensureAllDriversHaveWorkStatus(date) // 重複回避のためコメントアウト
    
    setSelectedDate(date)
    setShowVacationForm(true)
    setSelectedDriverId('')
    setSelectedWorkStatus('day_off')
    console.log('VacationManagement - handleDateClick: selectedWorkStatus reset to day_off')
  }



  // 勤務状態登録処理（出勤・休暇・夜勤）
  // 条件分岐で表示内容を決定
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
        <button 
          onClick={loadVacationData}
          className="ml-4 btn-primary"
        >
          再試行
        </button>
      </div>
    )
  }

  if (!vacationSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">設定を読み込み中...</div>
      </div>
    )
  }

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('VacationManagement - handleVacationSubmit: form submitted with values:', {
      selectedDate,
      selectedDriverId,
      selectedWorkStatus
    })
    
    if (!selectedDate || !selectedDriverId) {
      alert('日付とドライバーを選択してください。')
      return
    }

    try {
      // selectedDriverIdが文字列の場合と数値の場合の両方に対応
      let driverIdNumber: number
      if (typeof selectedDriverId === 'string') {
        driverIdNumber = parseInt(selectedDriverId)
        if (isNaN(driverIdNumber)) {
          alert(`無効なドライバーIDです: "${selectedDriverId}"`)
          return
        }
      } else {
        driverIdNumber = selectedDriverId
      }

      const driver = drivers.find(d => d.id === driverIdNumber)
      if (!driver) {
        alert(`ドライバーが見つかりません。\n選択されたID: ${driverIdNumber}\n利用可能なドライバー: ${drivers.map(d => `${d.name}(ID:${d.id})`).join(', ')}`)
        return
      }

      // 既存の勤務状態設定があるかチェック（データベースに保存済みのもののみ）
      const existingRequest = vacationRequests.find(req =>
        req.driverId === driver.id && 
        isSameDay(req.date, selectedDate) &&
        req.id > 0  // 正のIDを持つ（DBに保存済み）レコードのみ
      )

      // 1日あたりの最大休暇人数制限チェック（休暇の場合のみ）
      if (selectedWorkStatus === 'day_off') {
        const existingVacations = getExistingVacations()
        // 同じチームの内部ドライバーのみをカウント
        const existingTeamVacations = existingVacations.filter(v => 
          !v.isExternalDriver && v.team === driver.team
        )
        
        // 新しい統一設定から上限を取得
        const vacationLimit = getVacationLimitForDate(selectedDate, driver.team)
        
        // 上限チェック（0人制限の場合は即座に拒否、それ以外は既存数で判定）
        if (vacationLimit === 0) {
          alert(`この日は休暇登録が禁止されています。（${driver.team}の上限: 0人）`)
          return
        } else if (!driver.employeeId.startsWith('E') && existingTeamVacations.length >= vacationLimit) {
          alert(`この日は既に${vacationLimit}人が休暇を取得しています。（${driver.team}の上限）`)
          return
        }
      }

      const requestData = {
        driverId: driver.id,
        driverName: driver.name,
        team: driver.team,
        employeeId: driver.employeeId,
        date: selectedDate,
        workStatus: selectedWorkStatus,
        isOff: selectedWorkStatus === 'day_off',
        type: selectedWorkStatus,
        reason: '', // 理由は不要
        status: 'approved' as const, // 承認機能なしなので即承認
        requestDate: new Date(),
        isExternalDriver: driver.employeeId.startsWith('E'),
        registeredBy: 'admin' as const
      }
      
      console.log('VacationManagement - Saving vacation request with data:', requestData)

      let savedRequest: VacationRequest
      if (existingRequest) {
        // 既存の設定を更新
        savedRequest = await VacationService.update(existingRequest.id, requestData)
        setVacationRequests(vacationRequests.map(req => 
          req.id === existingRequest.id ? savedRequest : req
        ))
      } else {
        // 新規追加
        savedRequest = await VacationService.create(requestData)
        setVacationRequests([...vacationRequests, savedRequest])
      }
      
      // 統計を更新
      const updatedRequests = existingRequest 
        ? vacationRequests.map(req => req.id === existingRequest.id ? savedRequest : req)
        : [...vacationRequests, savedRequest]
      calculateVacationStats(updatedRequests)
      
      console.log('VacationManagement - Vacation request saved successfully, resetting form')
      setShowVacationForm(false)
      setSelectedDate(null)
      setSelectedDriverId('')
      setSelectedWorkStatus('day_off')
      console.log('VacationManagement - Form reset: selectedWorkStatus set to day_off')
    } catch (err) {
      console.error('Failed to save vacation request:', err)
      alert('休暇申請の保存に失敗しました')
    }
  }

  // ドライバーを勤務状態でソートする関数
  const sortDriversByWorkStatus = (driversToSort: typeof drivers, selectedDate: Date) => {
    return [...driversToSort].sort((a, b) => {
      // 各ドライバーの現在の勤務状態を取得
      const statusA = vacationRequests.find(req => 
        req.driverId === a.id && 
        isSameDay(req.date, selectedDate) &&
        req.id > 0
      )?.workStatus || 'working' // デフォルトは出勤
      
      const statusB = vacationRequests.find(req => 
        req.driverId === b.id && 
        isSameDay(req.date, selectedDate) &&
        req.id > 0
      )?.workStatus || 'working' // デフォルトは出勤

      // 勤務状態の優先順位を設定
      const getStatusPriority = (status: string, driverId: number) => {
        // 特記事項の有無を確認
        const hasSpecialNote = vacationRequests.find(req => 
          req.driverId === driverId && 
          isSameDay(req.date, selectedDate) &&
          req.id > 0
        )?.hasSpecialNote || false

        if (quickSortDirection === 'asc') {
          // 昇順: 休暇 → 休暇の特記 → 夜勤 → 出勤の特記 → 出勤
          if (status === 'day_off') {
            return hasSpecialNote ? 2 : 1  // 休暇の特記は2、休暇は1
          } else if (status === 'night_shift') {
            return 3  // 夜勤は3
          } else if (status === 'working') {
            return hasSpecialNote ? 4 : 5  // 出勤の特記は4、出勤は5
          }
          return 6
        } else {
          // 降順: 出勤 → 出勤の特記 → 夜勤 → 休暇の特記 → 休暇
          if (status === 'working') {
            return hasSpecialNote ? 2 : 1  // 出勤の特記は2、出勤は1
          } else if (status === 'night_shift') {
            return 3  // 夜勤は3
          } else if (status === 'day_off') {
            return hasSpecialNote ? 4 : 5  // 休暇の特記は4、休暇は5
          }
          return 6
        }
      }

      const priorityA = getStatusPriority(statusA, a.id)
      const priorityB = getStatusPriority(statusB, b.id)

      // 勤務状態が同じ場合は名前でソート
      if (priorityA === priorityB) {
        return a.name.localeCompare(b.name, 'ja')
      }

      return priorityA - priorityB
    })
  }

  // クイック勤務状態更新処理（ドライバー名の横のボタン用）
  const handleQuickStatusUpdate = async (driverId: number, workStatus: 'working' | 'day_off' | 'night_shift') => {
    if (!selectedDate) return

    // 既存の勤務状態設定があるかチェック（ドライバー登録の確認用）
    const existingDriverRequest = vacationRequests.find(req =>
      req.driverId === driverId && 
      isSameDay(req.date, selectedDate) &&
      req.id > 0 // DBに保存済み
    )

    // ドライバーが登録した勤務状態を変更する場合は確認アラート
    if (existingDriverRequest && existingDriverRequest.registeredBy === 'driver') {
      const driverName = drivers.find(d => d.id === driverId)?.name || 'ドライバー'
      const statusText = workStatus === 'day_off' ? '休暇' : workStatus === 'night_shift' ? '夜勤' : '出勤'
      const currentStatusText = existingDriverRequest.workStatus === 'day_off' ? '休暇' : 
                                existingDriverRequest.workStatus === 'night_shift' ? '夜勤' : '出勤'
      
      if (!confirm(`${driverName}が登録した「${currentStatusText}」を「${statusText}」に変更しますか？\n\nドライバーからの登録情報を上書きします。`)) {
        return
      }
    }

    // ローディング状態を開始
    setQuickUpdateLoading(prev => new Set(prev).add(driverId))

    try {
      const driver = drivers.find(d => d.id === driverId)
      if (!driver) {
        alert('ドライバーが見つかりません。')
        return
      }

      // 既存の勤務状態設定があるかチェック（正のIDを持つ実データのみ対象）
      const existingRequest = vacationRequests.find(req =>
        req.driverId === driver.id && 
        isSameDay(req.date, selectedDate) &&
        req.id > 0 // 実データベースレコードのみ
      )
      
      // 重複防止: データベースからも直接確認
      const existingDbRequests = await VacationService.getByDate(selectedDate)
      const existingDbRequest = existingDbRequests.find(req => req.driverId === driver.id)

      // 同じ勤務状態のボタンが押された場合は削除（解除）
      if (existingRequest && existingRequest.workStatus === workStatus && existingRequest.id > 0) {
        await VacationService.delete(existingRequest.id)
        const updatedRequests = vacationRequests.filter(req => req.id !== existingRequest.id)
        setVacationRequests(updatedRequests)
        calculateVacationStats(updatedRequests)
        return
      }

      // 仮想レコード（負のID）がある場合は削除
      if (existingRequest && existingRequest.id < 0) {
        setVacationRequests(vacationRequests.filter(req => req.id !== existingRequest.id))
      }

      // 1日あたりの最大休暇人数制限チェック（休暇の場合のみ）
      if (workStatus === 'day_off') {
        const existingVacations = getExistingVacations()
        // 同じチームの内部ドライバーのみをカウント
        const existingTeamVacations = existingVacations.filter(v => 
          !v.isExternalDriver && v.team === driver.team
        )
        
        // 新しい統一設定から上限を取得
        const vacationLimit = getVacationLimitForDate(selectedDate, driver.team)
        
        // 上限チェック（0人制限の場合は即座に拒否、それ以外は既存数で判定）
        if (vacationLimit === 0) {
          alert(`この日は休暇登録が禁止されています。（${driver.team}の上限: 0人）`)
          return
        } else if (!driver.employeeId.startsWith('E') && existingTeamVacations.length >= vacationLimit) {
          alert(`この日は既に${vacationLimit}人が休暇を取得しています。（${driver.team}の上限）`)
          return
        }
      }

      // 特記事項の情報を取得（既存の設定 or 現在のUI状態）
      const currentSpecialNote = getSpecialNote(driver.id)
      const existingSpecialNote = existingRequest?.hasSpecialNote && existingRequest?.specialNote ? {
        enabled: true,
        note: existingRequest.specialNote
      } : { enabled: false, note: '' }
      
      // UI状態を優先し、なければ既存データを使用
      const finalSpecialNote = currentSpecialNote.enabled || currentSpecialNote.note ? currentSpecialNote : existingSpecialNote
      
      const requestData = {
        driverId: driver.id,
        driverName: driver.name,
        team: driver.team,
        employeeId: driver.employeeId,
        date: selectedDate,
        workStatus: workStatus,
        isOff: workStatus === 'day_off',
        type: workStatus,
        reason: 'クイック登録',
        status: 'approved' as const,
        requestDate: new Date(),
        isExternalDriver: driver.employeeId.startsWith('E'),
        hasSpecialNote: finalSpecialNote.enabled,
        specialNote: finalSpecialNote.enabled ? finalSpecialNote.note : undefined,
        registeredBy: 'admin' as const
      }

      let savedRequest: VacationRequest
      const finalExistingRequest = existingRequest || existingDbRequest
      
      if (finalExistingRequest && finalExistingRequest.id > 0) {
        // 既存の設定を更新
        console.log(`更新: ドライバー ${driver.name}の${selectedDate.toDateString()}の勤務状態`)
        savedRequest = await VacationService.update(finalExistingRequest.id, requestData)
        setVacationRequests(vacationRequests.map(req => 
          req.id === finalExistingRequest.id ? savedRequest : req
        ).filter(req => req.id !== finalExistingRequest.id).concat([savedRequest]))
      } else {
        // 新規追加
        console.log(`新規作成: ドライバー ${driver.name}の${selectedDate.toDateString()}の勤務状態`)
        savedRequest = await VacationService.create(requestData)
        setVacationRequests([...vacationRequests.filter(req => 
          !(req.driverId === driver.id && isSameDay(req.date, selectedDate))
        ), savedRequest])
      }
      
      // 統計を更新
      const updatedRequests = vacationRequests.filter(req => 
        !(req.driverId === driver.id && isSameDay(req.date, selectedDate))
      ).concat([savedRequest])
      calculateVacationStats(updatedRequests)
    } catch (err) {
      console.error('Failed to save vacation request:', err)
      alert('勤務状態の保存に失敗しました')
    } finally {
      // ローディング状態を終了
      setQuickUpdateLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(driverId)
        return newSet
      })
    }
  }

  // 祝日チーム一括設定処理
  const handleHolidayTeamBulkStatus = async (holidayTeam: string, workStatus: 'working' | 'day_off') => {
    if (!selectedDate) return
    
    const teamDrivers = drivers.filter(driver => 
      (driver.team === '配送センターチーム' || driver.team === '配送センター外注') &&
      (driver as any).holidayTeams &&
      (driver as any).holidayTeams.includes(`${holidayTeam}チーム`)
    )

    if (teamDrivers.length === 0) {
      alert(`祝日チーム${holidayTeam}に所属するドライバーがいません。`)
      return
    }

    // 休暇設定の場合は上限チェック
    if (workStatus === 'day_off') {
      // チーム別に分類
      const teamGroups = teamDrivers.reduce((groups, driver) => {
        if (!groups[driver.team]) groups[driver.team] = []
        groups[driver.team].push(driver)
        return groups
      }, {} as { [team: string]: typeof teamDrivers })

      // 各チームの上限をチェック
      for (const [team, driversInTeam] of Object.entries(teamGroups)) {
        const vacationLimit = getVacationLimitForDate(selectedDate, team)
        
        if (vacationLimit === 0) {
          alert(`この日は${team}の休暇申請が禁止されています。（上限: 0人）`)
          return
        }
        
        // 現在の休暇者数（祝日チーム一括設定対象外のドライバー）
        const currentVacations = vacationRequests.filter(req => 
          isSameDay(req.date, selectedDate) && 
          req.workStatus === 'day_off' && 
          req.team === team &&
          !teamDrivers.some(td => td.id === req.driverId) // 今回の設定対象外
        ).length
        
        const newVacationCount = currentVacations + driversInTeam.length
        
        if (newVacationCount > vacationLimit) {
          alert(`${team}の休暇上限を超えます。（現在: ${currentVacations}人 + 追加: ${driversInTeam.length}人 = ${newVacationCount}人、上限: ${vacationLimit}人）`)
          return
        }
      }
    }

    const statusText = workStatus === 'working' ? '出勤' : '休暇'
    const confirmMessage = `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}に祝日チーム${holidayTeam}の全員（${teamDrivers.length}人）を${statusText}に設定しますか？\n\n対象ドライバー:\n${teamDrivers.map(d => `・${d.name} (${d.team})`).join('\n')}\n\n※ 既存の設定は上書きされます。`
    
    if (!confirm(confirmMessage)) return

    try {
      // その日のチームドライバーの既存設定をデータベースから削除
      const existingRequests = vacationRequests.filter(req => 
        isSameDay(req.date, selectedDate) && 
        teamDrivers.some(driver => driver.id === req.driverId) &&
        req.id > 0 // データベースに実際に保存されているレコードのみ
      )
      
      for (const req of existingRequests) {
        await VacationService.delete(req.id)
      }

      let updatedRequests = vacationRequests.filter(req => 
        !(isSameDay(req.date, selectedDate) && teamDrivers.some(driver => driver.id === req.driverId))
      )

      // 指定された勤務状態でチームドライバーをデータベースに保存
      for (const driver of teamDrivers) {
        const requestData = {
          driverId: driver.id,
          driverName: driver.name,
          team: driver.team,
          employeeId: driver.employeeId,
          date: selectedDate,
          workStatus: workStatus,
          isOff: workStatus === 'day_off',
          type: workStatus,
          reason: `祝日チーム${holidayTeam}一括設定`,
          status: 'approved' as const,
          requestDate: new Date(),
          isExternalDriver: driver.employeeId.startsWith('E'),
          registeredBy: 'admin' as const
        }
        
        const savedRequest = await VacationService.create(requestData)
        updatedRequests.push(savedRequest)
      }

      setVacationRequests(updatedRequests)

      // チームドライバーの統計を更新
      teamDrivers.forEach(driver => {
        updateMonthlyStats(driver.id, selectedDate, updatedRequests)
      })

      // フォームをリセット
      setSelectedDriverId('')
      setSelectedWorkStatus('day_off')
    } catch (error) {
      console.error('Failed to update holiday team bulk status:', error)
      alert('祝日チーム一括設定の保存に失敗しました')
    }
  }

  // 全員一括設定処理
  const handleBulkWorkStatus = async (workStatus: 'working' | 'day_off', confirmMessage: string) => {
    if (!selectedDate) return
    
    // ドライバー登録の勤務状態があるかチェック
    const driverRegisteredRequests = vacationRequests.filter(req =>
      isSameDay(req.date, selectedDate) &&
      req.registeredBy === 'driver' &&
      req.id > 0 // DBに保存済み
    )

    // ドライバー登録がある場合の追加確認
    if (driverRegisteredRequests.length > 0) {
      const driverNames = driverRegisteredRequests.map(req => req.driverName).join('、')
      const statusText = workStatus === 'day_off' ? '全員休暇' : '全員出勤'
      
      if (!confirm(`${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}には以下のドライバーが登録した勤務状態があります：\n\n${driverNames}\n\nドライバー登録情報を上書きして「${statusText}」を実行しますか？`)) {
        return
      }
    }
    
    // 休暇設定の場合は上限チェック
    if (workStatus === 'day_off') {
      // チーム別に分類
      const teamGroups = drivers.reduce((groups, driver) => {
        if (!groups[driver.team]) groups[driver.team] = []
        groups[driver.team].push(driver)
        return groups
      }, {} as { [team: string]: typeof drivers })

      // 各チームの上限をチェック
      for (const [team, driversInTeam] of Object.entries(teamGroups)) {
        const vacationLimit = getVacationLimitForDate(selectedDate, team)
        
        if (vacationLimit === 0) {
          alert(`この日は${team}の休暇申請が禁止されています。（上限: 0人）`)
          return
        }
        
        if (driversInTeam.length > vacationLimit) {
          alert(`${team}の休暇上限を超えます。（対象: ${driversInTeam.length}人、上限: ${vacationLimit}人）`)
          return
        }
      }
    }
    
    if (!confirm(confirmMessage)) return

    try {
      // その日のすべての既存設定をデータベースから削除
      const existingRequests = vacationRequests.filter(req => 
        isSameDay(req.date, selectedDate)
      )
      
      for (const req of existingRequests) {
        await VacationService.delete(req.id)
      }

      let updatedRequests = vacationRequests.filter(req => 
        !isSameDay(req.date, selectedDate)
      )

      // 指定された勤務状態で全ドライバーをデータベースに保存
      for (const driver of drivers) {
        const requestData = {
          driverId: driver.id,
          driverName: driver.name,
          team: driver.team,
          employeeId: driver.employeeId,
          date: selectedDate,
          workStatus: workStatus,
          isOff: workStatus === 'day_off',
          type: workStatus,
          reason: '全員一括設定',
          status: 'approved' as const,
          requestDate: new Date(),
          isExternalDriver: driver.employeeId.startsWith('E'),
          registeredBy: 'admin' as const
        }
        
        const savedRequest = await VacationService.create(requestData)
        updatedRequests.push(savedRequest)
      }

      setVacationRequests(updatedRequests)

      // 全ドライバーの統計を更新
      drivers.forEach(driver => {
        updateMonthlyStats(driver.id, selectedDate, updatedRequests)
      })

      // フォームをリセット
      setSelectedDriverId('')
      setSelectedWorkStatus('day_off')
    } catch (error) {
      console.error('Failed to update bulk work status:', error)
      alert('一括設定の保存に失敗しました')
    }
  }

  // 休暇削除処理
  const handleVacationDelete = async (vacationId: number) => {
    const vacationToDelete = vacationRequests.find(req => req.id === vacationId)
    if (!vacationToDelete) return

    try {
      // データベースから削除
      await VacationService.delete(vacationId)
      
      // 削除後、該当ドライバーを明示的に「出勤」状態として登録
      const workingRequest = {
        driverId: vacationToDelete.driverId,
        driverName: vacationToDelete.driverName,
        team: vacationToDelete.team,
        employeeId: vacationToDelete.employeeId,
        date: vacationToDelete.date,
        workStatus: 'working' as const,
        isOff: false,
        type: 'working' as const,
        reason: '休暇削除により出勤に変更',
        status: 'approved' as const,
        requestDate: new Date(),
        isExternalDriver: vacationToDelete.isExternalDriver,
        registeredBy: 'admin' as const
      }
      
      const newWorkingRequest = await VacationService.create(workingRequest)
      
      // 状態を更新（削除されたアイテムを除き、新しい出勤レコードを追加）
      const updatedRequests = vacationRequests
        .filter(req => req.id !== vacationId)
        .concat([newWorkingRequest])
      setVacationRequests(updatedRequests)
      
      // 統計を更新
      updateMonthlyStats(vacationToDelete.driverId, vacationToDelete.date, updatedRequests)
    } catch (error) {
      console.error('Failed to delete vacation request:', error)
      alert('休暇の削除に失敗しました')
    }
  }

  // 祝日データ同期処理
  const handleHolidaySync = async () => {
    setHolidaySyncLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      const previousYear = currentYear - 1
      
      // 過去1年、今年、来年の祝日データを同期
      const years = [previousYear, currentYear, nextYear]
      
      let totalAddedHolidays = 0
      for (const year of years) {
        const addedHolidays = await HolidayService.fetchAndUpdateJapaneseHolidays(year)
        totalAddedHolidays += addedHolidays.length
      }
      
      if (totalAddedHolidays > 0) {
        alert(`祝日データを同期しました。新規追加: ${totalAddedHolidays}件`)
      } else {
        alert('祝日データは既に最新です。')
      }
    } catch (error) {
      console.error('Holiday sync failed:', error)
      alert('祝日データの同期に失敗しました。')
    } finally {
      setHolidaySyncLoading(false)
    }
  }

  const updateMonthlyStats = (driverId: number, date: Date, currentRequests: VacationRequest[]) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    const existingStatIndex = vacationStats.findIndex(stat => 
      stat.driverId === driverId && stat.year === year && stat.month === month
    )

    // その月のドライバーの休暇数を計算（配送センター外注は除外）
    const monthVacations = currentRequests.filter(req => 
      req.driverId === driverId && 
      req.date.getFullYear() === year && 
      req.date.getMonth() + 1 === month &&
      req.workStatus === 'day_off' &&
      !req.isExternalDriver
    )

    const totalOffDays = monthVacations.length
    const remainingRequiredDays = Math.max(0, (vacationSettings?.minimumOffDaysPerMonth || 0) - totalOffDays)

    const driver = drivers.find(d => d.id === driverId)
    if (!driver) return

    const newStat: MonthlyVacationStats = {
      driverId,
      driverName: driver.name,
      team: driver.team,
      employeeId: driver.employeeId,
      year,
      month,
      totalOffDays,
      requiredMinimumDays: vacationSettings?.minimumOffDaysPerMonth || 0,
      remainingRequiredDays
    }

    if (existingStatIndex >= 0) {
      const updatedStats = [...vacationStats]
      updatedStats[existingStatIndex] = newStat
      setVacationStats(updatedStats)
    } else {
      setVacationStats([...vacationStats, newStat])
    }
  }

  // カレンダービューのレンダリング
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays()
    
    return (
      <div className="space-y-6">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {format(calendarDate, 'yyyy年MM月', { locale: ja })}
            </h2>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
              📌 日付をクリックして勤務状態設定
            </div>
            <button
              onClick={() => setCalendarDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              今月
            </button>
          </div>
        </div>

        {/* カレンダーグリッド */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div 
                key={day} 
                className={`p-4 text-center font-medium ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー日付 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayInfo, index) => {
              const isCurrentDate = isToday(dayInfo.date)
              const isCurrentMonth = isSameMonth(dayInfo.date, calendarDate)
              const hasVacations = dayInfo.totalOffCount > 0
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 border border-gray-200 transition-colors ${
                    isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isCurrentDate ? 'bg-blue-50 border-blue-300' : 
                    !isCurrentMonth ? 'bg-gray-50' :
                    hasVacations ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => isCurrentMonth ? handleDateClick(dayInfo.date) : undefined}
                >
                  {/* 日付 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isCurrentDate ? 'text-blue-600' : 
                      !isCurrentMonth ? 'text-gray-400' :
                      'text-gray-900'
                    }`}>
                      {format(dayInfo.date, 'd')}
                      {isHoliday(dayInfo.date) && (
                        <span className="ml-2 text-xs text-red-600 font-medium">
                          {getHolidayName(dayInfo.date)}
                        </span>
                      )}
                    </span>
                  </div>
                  

                  {/* 勤務状態の表示（人数のみ） - 現在の月のみ表示 */}
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      {/* 休暇者数/上限 - 各チーム別 */}
                      {(() => {
                        // チーム別に休暇者をグループ化
                        const teamVacations: { [team: string]: number } = {}
                        dayInfo.vacations.forEach(v => {
                          teamVacations[v.team] = (teamVacations[v.team] || 0) + 1
                        })

                        // 各チームの上限を取得して表示
                        const teams = ['配送センターチーム', '配送センター外注', '常駐チーム', 'Bチーム']
                        return teams.map(team => {
                          const currentCount = teamVacations[team] || 0
                          const limit = getVacationLimitForDate(dayInfo.date, team)
                          
                          // 全チームを常に表示
                          const isOverLimit = currentCount > limit
                          return (
                            <div key={team} className="text-xs">
                              <span className={`font-medium ${
                                isOverLimit ? 'text-red-600' : 
                                currentCount === limit ? 'text-yellow-600' : 
                                'text-blue-600'
                              }`}>
                                {team.replace('チーム', '').replace('配送センター外注', 'センター外注')}: {currentCount}/{limit}
                              </span>
                            </div>
                          )
                        })
                      })()}
                      
                      {/* 夜勤者数 */}
                      <div className="text-xs">
                        <span className="font-medium text-blue-600">
                          夜勤: {dayInfo.nightShiftCount || 0}人
                        </span>
                      </div>
                      
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // 月間統計ビューのレンダリング
  const renderStatsView = () => (
    <div className="space-y-6">
      {/* 月選択 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setStatsMonth(subMonths(statsMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {format(statsMonth, 'yyyy年MM月', { locale: ja })} の統計
            </h2>
            <button
              onClick={() => setStatsMonth(addMonths(statsMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setStatsMonth(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            今月
          </button>
        </div>
      </div>

      {/* ドライバー別統計テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              ドライバー別休暇統計
            </h3>
            <div className="text-sm text-gray-600">
              ※ 配送センター外注は統計に含まれません
            </div>
        </div>
      </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('driverName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>ドライバー</span>
                    {sortField === 'driverName' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('employeeId')}
                >
                  <div className="flex items-center space-x-2">
                    <span>社員番号</span>
                    {sortField === 'employeeId' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('team')}
                >
                  <div className="flex items-center space-x-2">
                    <span>チーム</span>
                    {sortField === 'team' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('totalOffDays')}
                >
                  <div className="flex items-center space-x-2">
                    <span>現在の休暇日数</span>
                    {sortField === 'totalOffDays' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('requiredMinimumDays')}
                >
                  <div className="flex items-center space-x-2">
                    <span>必要最低日数</span>
                    {sortField === 'requiredMinimumDays' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('remainingRequiredDays')}
                >
                  <div className="flex items-center space-x-2">
                    <span>残り必要日数</span>
                    {sortField === 'remainingRequiredDays' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortStats(currentStats)
                .map(stat => (
                <tr key={`${stat.driverId}-${stat.year}-${stat.month}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{stat.driverName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-700">{stat.employeeId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-700">{stat.team}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-blue-600">{stat.totalOffDays}日</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-700">{stat.requiredMinimumDays}日</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      stat.remainingRequiredDays > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {stat.remainingRequiredDays}日
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stat.remainingRequiredDays === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        充足
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        不足
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )


  // タブナビゲーション
  const tabs = [
    { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'stats', label: '月間統計', icon: Users },
  ]

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return renderCalendarView()
      case 'stats':
        return renderStatsView()
      default:
        return renderCalendarView()
    }
  }

  // ソート処理
  const handleSort = (field: 'driverName' | 'totalOffDays' | 'remainingRequiredDays' | 'team' | 'employeeId' | 'requiredMinimumDays') => {
    if (sortField === field) {
      setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // データソート関数
  const sortStats = (stats: MonthlyVacationStats[]) => {
    return [...stats].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sortField) {
        case 'driverName':
          aValue = a.driverName
          bValue = b.driverName
          break
        case 'totalOffDays':
          aValue = a.totalOffDays
          bValue = b.totalOffDays
          break
        case 'remainingRequiredDays':
          aValue = a.remainingRequiredDays
          bValue = b.remainingRequiredDays
          break
        case 'team':
          aValue = a.team
          bValue = b.team
          break
        case 'employeeId':
          aValue = a.employeeId
          bValue = b.employeeId
          break
        case 'requiredMinimumDays':
          aValue = a.requiredMinimumDays
          bValue = b.requiredMinimumDays
          break
        default:
          aValue = a.driverName
          bValue = b.driverName
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja')
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })
  }


  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">休暇管理システム</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleHolidaySync}
            disabled={holidaySyncLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {holidaySyncLoading ? '同期中...' : '祝日データ同期'}
            </span>
          </button>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
            <Smartphone className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">プッシュ通知対応</span>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === tab.id
                    ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>

      {/* メインコンテンツ */}
      {renderContent()}

      {/* 休暇登録・削除フォームモーダル */}
      {showVacationForm && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} の勤務状態管理
                </h3>
                {/* デバッグ表示 */}
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  DEBUG: {selectedWorkStatus}
                </div>
                <button
                  onClick={() => setShowVacationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
      </div>

            <div className="p-6 space-y-6">
              {/* 祝日チーム一括設定 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">祝日チーム一括設定</h4>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    祝日チーム（A〜G）単位で一括して出勤・休暇を設定できます
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {['祝日Aチーム', '祝日Bチーム', '祝日Cチーム', '祝日Dチーム', '祝日Eチーム', '祝日Fチーム', '祝日Gチーム'].map((team) => {
                      const teamDrivers = drivers.filter(driver => 
                        (driver.team === '配送センターチーム' || driver.team === '配送センター外注') &&
                        (driver as any).holidayTeams &&
                        (driver as any).holidayTeams.includes(team)
                      )
                      
                      return (
                        <div key={team} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="text-center mb-2">
                            <span className="font-bold text-lg text-gray-900">{team.replace('祝日', '').replace('チーム', '')}</span>
                            <p className="text-xs text-gray-600">{teamDrivers.length}人</p>
                          </div>
                          <div className="space-y-1">
                            <button
                              onClick={() => handleHolidayTeamBulkStatus(team.replace('チーム', ''), 'working')}
                              className="w-full text-xs py-1 px-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              disabled={teamDrivers.length === 0}
                            >
                              出勤
                            </button>
                            <button
                              onClick={() => handleHolidayTeamBulkStatus(team.replace('チーム', ''), 'day_off')}
                              className="w-full text-xs py-1 px-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              disabled={teamDrivers.length === 0}
                            >
                              休暇
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 全員一括設定ボタン */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">全員一括設定</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBulkWorkStatus('day_off', `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}に全員を休暇に設定しますか？\n\n※ 既存の設定はすべて上書きされます。`)}
                    className="flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    disabled={drivers.length === 0}
                  >
                    <Users className="h-5 w-5" />
                    <span>全員休暇</span>
                  </button>
                  <button
                    onClick={() => handleBulkWorkStatus('working', `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}に全員を出勤に設定しますか？\n\n※ 既存の設定はすべて削除されます。`)}
                    className="flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    disabled={drivers.length === 0}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>全員出勤</span>
                  </button>
                </div>
                {drivers.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                    ⚠️ ドライバーが登録されていないため、一括設定は利用できません。
                  </p>
                )}
              </div>


              {/* クイック勤務状態設定 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-900">全ドライバー勤務状態設定</h4>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">チーム:</label>
                      <select
                        value={quickTeamFilter}
                        onChange={(e) => setQuickTeamFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">全て</option>
                        <option value="配送センターチーム">配送センターチーム</option>
                        <option value="常駐チーム">常駐チーム</option>
                        <option value="Bチーム">Bチーム</option>
                        <option value="配送センター外注">配送センター外注</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">並び順:</label>
                      <button
                        onClick={() => setQuickSortDirection(quickSortDirection === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                      >
                        <span>{quickSortDirection === 'asc' ? '昇順' : '降順'}</span>
                        {quickSortDirection === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">各ドライバーの横のボタンをクリックして勤務状態を設定。同じボタンを再度クリックで解除</p>
                
                {drivers.length === 0 ? (
                  <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="font-medium">⚠️ ドライバーが登録されていません</p>
                    <p className="mt-1">勤務状態を設定するには、まず「ドライバー管理」画面でドライバーを登録してください。</p>
                  </div>
                ) : (
                  /* フィルター・ソートされたドライバー表示 */
                  <div>
                    {(() => {
                      // チームフィルターを適用
                      const filteredDrivers = quickTeamFilter === 'all' 
                        ? drivers 
                        : drivers.filter(d => d.team === quickTeamFilter)

                      if (filteredDrivers.length === 0) {
                        return (
                          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            選択されたチームにドライバーがいません。
                          </div>
                        )
                      }

                      if (quickTeamFilter === 'all') {
                        // 全チーム表示の場合：チーム別に分けて表示
                        const teams = ['配送センターチーム', '常駐チーム', 'Bチーム', '配送センター外注']
                        return teams.map(team => {
                          const teamDrivers = filteredDrivers.filter(d => d.team === team)
                          if (teamDrivers.length === 0) return null
                          
                          // チーム内でソート
                          const sortedTeamDrivers = sortDriversByWorkStatus(teamDrivers, selectedDate)
                          
                          return (
                            <div key={team} className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                                {team} ({teamDrivers.length}人)
                              </h5>
                              <div className="space-y-2">
                                {sortedTeamDrivers.map(driver => {
                          // 現在のドライバーの勤務状態を取得
                          const currentStatus = vacationRequests.find(req => 
                            req.driverId === driver.id && 
                            isSameDay(req.date, selectedDate) &&
                            req.id > 0 // DBに保存済み
                          )
                          
                          return (
                            <div key={driver.id} className={`p-3 rounded-lg border ${
                              getSpecialNote(driver.id).enabled 
                                ? 'bg-yellow-50 border-yellow-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-gray-900">{driver.name}</p>
                                    {(currentStatus?.hasSpecialNote || getSpecialNote(driver.id).enabled) && (
                                      <span className="text-yellow-600" title={currentStatus?.specialNote || getSpecialNote(driver.id).note}>
                                        📝
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {driver.employeeId}
                                    {currentStatus && (
                                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                        currentStatus.workStatus === 'day_off' 
                                          ? 'bg-red-100 text-red-800'
                                          : currentStatus.workStatus === 'night_shift'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        <span>現在: {currentStatus.workStatus === 'day_off' ? '休暇' : 
                                               currentStatus.workStatus === 'night_shift' ? '夜勤' : '出勤'}</span>
                                        {currentStatus.registeredBy === 'driver' && (
                                          <span 
                                            className="inline-flex items-center text-xs" 
                                            title="ドライバーが登録した勤務状態"
                                          >
                                            👤
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </p>
                                  {currentStatus?.specialNote && (
                                    <p className="text-xs text-yellow-700 mt-1 bg-yellow-100 px-2 py-1 rounded">
                                      特記: {currentStatus.specialNote}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <label className="flex items-center space-x-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={getSpecialNote(driver.id).enabled}
                                        onChange={(e) => updateSpecialNote(driver.id, e.target.checked, getSpecialNote(driver.id).note)}
                                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                      />
                                      <span className="text-gray-700">特記</span>
                                    </label>
                                  </div>
                                  {quickUpdateLoading.has(driver.id) ? (
                                    <div className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600">
                                      更新中...
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleQuickStatusUpdate(driver.id, 'working')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                          currentStatus?.workStatus === 'working' 
                                            ? 'bg-green-600 text-white font-medium'
                                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                                        }`}
                                      >
                                        出勤
                                      </button>
                                      <button
                                        onClick={() => handleQuickStatusUpdate(driver.id, 'day_off')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                          currentStatus?.workStatus === 'day_off' 
                                            ? 'bg-red-600 text-white font-medium'
                                            : 'bg-red-100 hover:bg-red-200 text-red-800'
                                        }`}
                                      >
                                        休暇
                                      </button>
                                      <button
                                        onClick={() => handleQuickStatusUpdate(driver.id, 'night_shift')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                          currentStatus?.workStatus === 'night_shift' 
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                        }`}
                                      >
                                        夜勤
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {getSpecialNote(driver.id).enabled && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <textarea
                                    value={getSpecialNote(driver.id).note}
                                    onChange={(e) => updateSpecialNote(driver.id, true, e.target.value)}
                                    placeholder="特記事項を入力してください..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                                    rows={2}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                        })
                      } else {
                        // 特定チーム選択の場合：チーム分けなしで表示
                        const sortedDrivers = sortDriversByWorkStatus(filteredDrivers, selectedDate)
                        
                        return (
                          <div className="space-y-2">
                            {sortedDrivers.map(driver => {
                              // 現在のドライバーの勤務状態を取得
                              const currentStatus = vacationRequests.find(req => 
                                req.driverId === driver.id && 
                                isSameDay(req.date, selectedDate) &&
                                req.id > 0 // DBに保存済み
                              )
                              
                              return (
                                <div key={driver.id} className={`p-3 rounded-lg border ${
                                  getSpecialNote(driver.id).enabled 
                                    ? 'bg-yellow-50 border-yellow-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-gray-900">{driver.name}</p>
                                        {(currentStatus?.hasSpecialNote || getSpecialNote(driver.id).enabled) && (
                                          <span className="text-yellow-600" title={currentStatus?.specialNote || getSpecialNote(driver.id).note}>
                                            📝
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        {driver.employeeId}
                                        {currentStatus && (
                                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                            currentStatus.workStatus === 'day_off' 
                                              ? 'bg-red-100 text-red-800'
                                              : currentStatus.workStatus === 'night_shift'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            <span>現在: {currentStatus.workStatus === 'day_off' ? '休暇' : 
                                                   currentStatus.workStatus === 'night_shift' ? '夜勤' : '出勤'}</span>
                                            {currentStatus.registeredBy === 'driver' && (
                                              <span 
                                                className="inline-flex items-center text-xs" 
                                                title="ドライバーが登録した勤務状態"
                                              >
                                                👤
                                              </span>
                                            )}
                                          </span>
                                        )}
                                      </p>
                                      {currentStatus?.specialNote && (
                                        <p className="text-xs text-yellow-700 mt-1 bg-yellow-100 px-2 py-1 rounded">
                                          特記: {currentStatus.specialNote}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-1">
                                        <label className="flex items-center space-x-1 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={getSpecialNote(driver.id).enabled}
                                            onChange={(e) => updateSpecialNote(driver.id, e.target.checked, getSpecialNote(driver.id).note)}
                                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                          />
                                          <span className="text-gray-700">特記</span>
                                        </label>
                                      </div>
                                      {quickUpdateLoading.has(driver.id) ? (
                                        <div className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600">
                                          更新中...
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleQuickStatusUpdate(driver.id, 'working')}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                              currentStatus?.workStatus === 'working' 
                                                ? 'bg-green-600 text-white font-medium'
                                                : 'bg-green-100 hover:bg-green-200 text-green-800'
                                            }`}
                                          >
                                            出勤
                                          </button>
                                          <button
                                            onClick={() => handleQuickStatusUpdate(driver.id, 'day_off')}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                              currentStatus?.workStatus === 'day_off' 
                                                ? 'bg-red-600 text-white font-medium'
                                                : 'bg-red-100 hover:bg-red-200 text-red-800'
                                            }`}
                                          >
                                            休暇
                                          </button>
                                          <button
                                            onClick={() => handleQuickStatusUpdate(driver.id, 'night_shift')}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                              currentStatus?.workStatus === 'night_shift' 
                                                ? 'bg-blue-600 text-white font-medium'
                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                            }`}
                                          >
                                            夜勤
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {getSpecialNote(driver.id).enabled && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <textarea
                                        value={getSpecialNote(driver.id).note}
                                        onChange={(e) => updateSpecialNote(driver.id, true, e.target.value)}
                                        placeholder="特記事項を入力してください..."
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                                        rows={2}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      }
                    })()}
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowVacationForm(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 