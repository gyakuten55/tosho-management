'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  X,
  Check,
  AlertCircle,
  Moon,
  Users
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth, differenceInDays, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, VacationRequest, MonthlyVacationStats, VacationSettings, Holiday } from '@/types'
import { formatDateForDB } from '@/utils/dateUtils'
import { VacationService } from '@/services/vacationService'
import { DriverService } from '@/services/driverService'
import { HolidayService } from '@/services/holidayService'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface DriverVacationCalendarProps {
  currentUser: Driver | null
  existingRequests: VacationRequest[]
  monthlyStats: MonthlyVacationStats | null
  vacationSettings: VacationSettings | null
  allVacationRequests: VacationRequest[]
  onRequestSubmit: (request: Omit<VacationRequest, 'id' | 'requestDate'>) => void
  onRequestDelete?: (requestId: number) => void
}

interface DailyInfo {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  vacationRequest?: VacationRequest
  canRequest: boolean
  canDelete: boolean
  vacations: VacationRequest[]
  totalOffCount: number
  nightShiftCount: number
  teamVacationCount: number  // 自分のチームの休暇者数
  teamVacationLimit: number  // 自分のチームの休暇上限
  totalVacationLimit: number  // 全チームの休暇上限合計
}

export default function DriverVacationCalendar({ 
  currentUser, 
  existingRequests, 
  monthlyStats,
  vacationSettings,
  allVacationRequests,
  onRequestSubmit,
  onRequestDelete,
}: DriverVacationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState<'day_off'>('day_off')
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayModalData, setDayModalData] = useState<{
    date: Date
    workingDrivers: Driver[]
    vacationDrivers: VacationRequest[]
  } | null>(null)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])

  // エスケープキーでモーダルを閉じる
  useEscapeKey(() => {
    if (showDayModal) {
      setShowDayModal(false)
    } else if (showRequestModal) {
      setShowRequestModal(false)
    }
  }, showDayModal || showRequestModal)

  // チーム別・日付別の休暇上限を取得
  const getVacationLimitForTeamAndDate = (team: string, date: Date) => {
    if (!vacationSettings) return 0
    
    const dateString = format(date, 'yyyy-MM-dd')
    
    // 特定日付設定があるかチェック（チーム別）
    if (vacationSettings.specificDateLimits[dateString]?.[team] !== undefined) {
      return vacationSettings.specificDateLimits[dateString][team]
    }
    
    // 基本設定から取得
    const weekday = getDay(date)
    const month = date.getMonth() + 1
    return vacationSettings.teamMonthlyWeekdayLimits[team]?.[month]?.[weekday] || 0
  }

  // 全ドライバーデータを取得
  useEffect(() => {
    const loadAllDrivers = async () => {
      try {
        const driversData = await DriverService.getAll()
        setAllDrivers(driversData)
      } catch (error) {
        console.error('Failed to load drivers data:', error)
      }
    }
    loadAllDrivers()
  }, [])

  // 祝日データをロード
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = currentDate.getFullYear()
        const yearHolidays = await HolidayService.getByYear(year)
        setHolidays(yearHolidays)
      } catch (error) {
        console.error('Failed to load holidays:', error)
        setHolidays([])
      }
    }
    
    loadHolidays()
  }, [currentDate])

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

  // カレンダーの日付情報を生成
  const generateCalendarDays = (): DailyInfo[] => {
    if (!currentUser) return []
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜始まり
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    return days.map(date => {
      const isCurrentMonth = isSameMonth(date, currentDate)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const today = new Date()
      
      // 既存の休暇申請を検索（現在のユーザー）- allVacationRequestsから取得して特記事項を含める
      const vacationRequest = allVacationRequests.find(req => 
        req.driverId === currentUser.id && isSameDay(req.date, date)
      )
      
      // その日の全ドライバーの休暇情報を取得
      const dayVacations = allVacationRequests.filter(req => 
        isSameDay(req.date, date)
      )
      
      // 休暇者数と夜勤者数を計算
      const totalOffCount = dayVacations.filter(v => v.isOff).length
      const nightShiftCount = dayVacations.filter(v => v.workStatus === 'night_shift').length
      
      // 自分のチームの休暇状況を計算
      const teamVacationCount = dayVacations.filter(v => v.isOff && v.team === currentUser.team).length
      const teamVacationLimit = getVacationLimitForTeamAndDate(currentUser.team, date)
      
      // 全チームの上限合計を計算
      const totalVacationLimit = ['配送センターチーム', '常駐チーム', 'Bチーム', '配送センター外注']
        .reduce((sum, team) => sum + getVacationLimitForTeamAndDate(team, date), 0)
      
      // 申請可能かチェック
      const daysDifference = differenceInDays(date, today)
      const canRequest = daysDifference >= 10 && isCurrentMonth // 10日以上先なら申請可能
      
      // 削除可能かチェック
      const canDelete = vacationRequest ? differenceInDays(date, today) >= 10 : false // 10日以上先なら削除可能
      
      return {
        date,
        isCurrentMonth,
        isToday: isToday(date),
        isWeekend,
        vacationRequest,
        canRequest: !vacationRequest && canRequest,
        canDelete: vacationRequest ? canDelete : false,
        vacations: dayVacations,
        totalOffCount,
        nightShiftCount,
        teamVacationCount,
        teamVacationLimit,
        totalVacationLimit
      }
    })
  }

  const calendarDays = useMemo(() => generateCalendarDays(), [currentDate, allVacationRequests, existingRequests, currentUser, vacationSettings])

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          ユーザー情報を読み込み中...
        </div>
      </div>
    )
  }

  // 現在表示中の月の統計を計算
  const calculateCurrentMonthStats = (): MonthlyVacationStats | null => {
    if (!currentUser) return null

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    // 現在の月の自分の休暇申請を取得
    const monthlyVacations = allVacationRequests.filter(req => 
      req.driverId === currentUser.id &&
      req.date.getFullYear() === year &&
      req.date.getMonth() + 1 === month &&
      req.workStatus === 'day_off'
    )

    const totalOffDays = monthlyVacations.length
    const requiredMinimumDays = vacationSettings?.minimumOffDaysPerMonth || 9
    const remainingRequiredDays = Math.max(0, requiredMinimumDays - totalOffDays)

    return {
      driverId: currentUser.id,
      driverName: currentUser.name,
      team: currentUser.team,
      employeeId: currentUser.employeeId,
      year,
      month,
      totalOffDays,
      requiredMinimumDays,
      remainingRequiredDays
    }
  }

  const currentMonthStats = calculateCurrentMonthStats()

  const handleDateClick = (dayInfo: DailyInfo) => {
    if (!dayInfo.isCurrentMonth) return
    
    console.log('DriverVacationCalendar - handleDateClick:', {
      date: dayInfo.date,
      totalVacations: dayInfo.vacations.length,
      allDriversCount: allDrivers.length
    })
    
    // 日付クリック時：その日の出勤・休暇状況を表示
    // 休暇者のみを正しくフィルタリング（workStatus === 'day_off'）
    const actualVacationDrivers = dayInfo.vacations.filter(v => v.workStatus === 'day_off')
    
    // 出勤者の計算：休暇を取っていない全ドライバー
    const workingDrivers = allDrivers.filter(driver => {
      const hasVacation = actualVacationDrivers.some(v => v.driverId === driver.id)
      return !hasVacation
    })
    
    console.log('DriverVacationCalendar - filtered data:', {
      actualVacationDrivers: actualVacationDrivers.length,
      workingDrivers: workingDrivers.length
    })
    
    setDayModalData({
      date: dayInfo.date,
      workingDrivers,
      vacationDrivers: actualVacationDrivers
    })
    setShowDayModal(true)
  }
  
  const handleVacationRequest = (dayInfo: DailyInfo) => {
    // 休暇申請機能（元のロジック）
    if (dayInfo.vacationRequest) {
      // 既存の申請がある場合は削除確認
      if (dayInfo.canDelete && onRequestDelete) {
        if (confirm('この休暇申請を削除しますか？')) {
          onRequestDelete(dayInfo.vacationRequest.id)
        }
      } else if (!dayInfo.canDelete) {
        alert('申請から10日以内の休暇は削除できません。')
      }
    } else if (dayInfo.canRequest) {
      // 新規申請
      setSelectedDate(dayInfo.date)
      setShowRequestModal(true)
    } else if (!dayInfo.canRequest && dayInfo.isCurrentMonth) {
      alert('直近10日以内の日付は申請できません。余裕を持って申請してください。')
    }
  }

  const handleSubmitRequest = () => {
    if (!selectedDate || !currentUser) return

    const newRequest: Omit<VacationRequest, 'id' | 'requestDate'> = {
      driverId: currentUser.id,
      driverName: currentUser.name,
      team: currentUser.team,
      employeeId: currentUser.employeeId,
      date: selectedDate,
      workStatus: 'day_off',
      isOff: true,
      type: 'day_off',
      reason: '',
      status: 'approved',
      isExternalDriver: currentUser.employeeId.startsWith('E'),
      registeredBy: 'driver' as const
    }

    onRequestSubmit(newRequest)
    setShowRequestModal(false)
    setSelectedDate(null)
  }


  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const getStatusColor = (workStatus: string) => {
    switch (workStatus) {
      case 'day_off':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'night_shift':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (workStatus: string) => {
    switch (workStatus) {
      case 'day_off':
        return <X className="h-3 w-3" />
      case 'night_shift':
        return <Moon className="h-3 w-3" />
      case 'working':
        return <Check className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusLabel = (workStatus: string) => {
    switch (workStatus) {
      case 'day_off':
        return '休暇'
      case 'night_shift':
        return '夜勤'
      case 'working':
        return '出勤'
      default:
        return '未定'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600" />
            <span className="text-blue-900">休暇申請</span>
          </h1>
          
        </div>
        
        {/* モバイル用チーム情報 */}
        <div className="sm:hidden mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-1">{currentUser.team}</div>
          <div className="text-xs text-blue-700">
            上限: {getVacationLimitForTeamAndDate(currentUser.team, new Date())}人/日
          </div>
        </div>
      </div>

      {/* 月間統計 */}
      {currentMonthStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {currentMonthStats.year}年{currentMonthStats.month}月の休暇統計
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-3">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{currentMonthStats.totalOffDays}</div>
              <div className="text-xs sm:text-sm text-gray-600">取得日数</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-3">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{currentMonthStats.requiredMinimumDays}</div>
              <div className="text-xs sm:text-sm text-gray-600">必要日数</div>
            </div>
            <div className="text-center bg-orange-50 rounded-lg p-3">
              <div className={`text-xl sm:text-2xl font-bold ${
                currentMonthStats.remainingRequiredDays > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {currentMonthStats.remainingRequiredDays}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">残り必要</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-3">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {((currentMonthStats.totalOffDays / currentMonthStats.requiredMinimumDays) * 100).toFixed(0)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">達成率</div>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー */}
      <div className="space-y-4">
        {/* カレンダーヘッダー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {format(currentDate, 'yyyy年MM月', { locale: ja })}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="hidden sm:block text-xs sm:text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                📌 日付をタップして状況を確認
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium touch-manipulation"
              >
                今月
              </button>
            </div>
          </div>
        </div>

        {/* モバイル用リストビュー */}
        <div className="sm:hidden">
          <div className="space-y-3">
            {calendarDays
              .filter(dayInfo => dayInfo.isCurrentMonth)
              .map((dayInfo, index) => {
                const isCurrentDate = isToday(dayInfo.date)
                const dayOfWeek = dayInfo.date.getDay()
                const weekdayName = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]
                
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-sm border p-4 transition-all touch-manipulation ${
                      isCurrentDate ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => handleDateClick(dayInfo)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`text-2xl font-bold ${
                            isCurrentDate ? 'text-blue-600' : 
                            dayOfWeek === 0 ? 'text-red-600' : 
                            dayOfWeek === 6 ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {format(dayInfo.date, 'd')}
                          </div>
                          {/* 祝日名を日付の横に表示 */}
                          {isHoliday(dayInfo.date) && (
                            <span className="ml-2 text-sm text-red-600 font-medium">
                              {getHolidayName(dayInfo.date)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {weekdayName}曜日
                          {isCurrentDate && <span className="ml-2 text-blue-600 font-medium">今日</span>}
                          {dayInfo.vacationRequest?.hasSpecialNote && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                管理者からの特記事項あり
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        dayInfo.totalOffCount >= dayInfo.totalVacationLimit ? 
                          'bg-red-100 text-red-800' : 
                          dayInfo.totalOffCount > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                      }`}>
                        {dayInfo.totalOffCount}/{dayInfo.totalVacationLimit}
                      </div>
                    </div>
                    
                    {/* 自分の状態表示 */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {dayInfo.vacationRequest ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVacationRequest(dayInfo)
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              getStatusColor(dayInfo.vacationRequest.workStatus)
                            } hover:opacity-80 ${
                              dayInfo.vacationRequest.hasSpecialNote 
                                ? 'ring-2 ring-yellow-400 ring-offset-1' 
                                : ''
                            }`}
                          >
                            {dayInfo.vacationRequest.hasSpecialNote && (
                              <AlertCircle className="h-3 w-3 mr-1 inline" />
                            )}
                            {getStatusIcon(dayInfo.vacationRequest.workStatus)} 自分: {getStatusLabel(dayInfo.vacationRequest.workStatus)}
                            {dayInfo.vacationRequest.hasSpecialNote && (
                              <span className="ml-1 text-xs font-bold">(要確認)</span>
                            )}
                            {dayInfo.canDelete && <span className="ml-2 text-xs">×</span>}
                          </button>
                        ) : dayInfo.canRequest ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVacationRequest(dayInfo)
                            }}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            + 休暇申請
                          </button>
                        ) : (
                          <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                            申請不可
                          </span>
                        )}
                      </div>
                      
                      {/* その日の全体統計 */}
                      {(dayInfo.totalOffCount > 0 || dayInfo.nightShiftCount > 0) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {dayInfo.totalOffCount > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                              休暇: {dayInfo.totalOffCount}人
                            </span>
                          )}
                          {dayInfo.nightShiftCount > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              夜勤: {dayInfo.nightShiftCount}人
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 特記事項の内容表示 */}
                      {dayInfo.vacationRequest?.hasSpecialNote && dayInfo.vacationRequest.specialNote && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-r-lg shadow-sm">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-800">管理者からの重要な特記事項</span>
                          </div>
                          <div className="bg-white p-3 rounded-md border border-yellow-200">
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                              {dayInfo.vacationRequest.specialNote}
                            </p>
                          </div>
                          <div className="mt-2 text-xs text-yellow-700 font-medium">
                            ※ 必ずご確認ください
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
        
        {/* デスクトップ用グリッドビュー */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <div 
                  key={day} 
                  className={`p-3 sm:p-4 text-center font-medium text-sm sm:text-base ${
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
                const isCurrentMonth = isSameMonth(dayInfo.date, currentDate)
                const hasVacations = dayInfo.totalOffCount > 0
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 transition-colors ${
                      isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isCurrentDate ? 'bg-blue-50 border-blue-300' : 
                      !isCurrentMonth ? 'bg-gray-50' :
                      hasVacations ? 'bg-yellow-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => isCurrentMonth ? handleDateClick(dayInfo) : undefined}
                  >
                    {/* 日付 */}
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs sm:text-sm font-medium ${
                          isCurrentDate ? 'text-blue-600' : 
                          !isCurrentMonth ? 'text-gray-400' :
                          'text-gray-900'
                        }`}>
                          {format(dayInfo.date, 'd')}
                        </span>
                        {/* 祝日名を日付の横に表示 */}
                        {isHoliday(dayInfo.date) && (
                          <span className="ml-2 text-xs text-red-600 font-medium">
                            {getHolidayName(dayInfo.date)}
                          </span>
                        )}
                        {isCurrentMonth && dayInfo.vacationRequest?.hasSpecialNote && (
                          <div className="mt-1">
                            <span 
                              className="inline-flex items-center justify-center w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold cursor-pointer shadow-sm border border-yellow-500 animate-pulse"
                              title={`管理者からの特記事項: ${dayInfo.vacationRequest.specialNote}`}
                            >
                              !
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {dayInfo.canRequest && dayInfo.isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVacationRequest(dayInfo)
                          }}
                          className="p-1 hover:bg-green-100 rounded touch-manipulation"
                        >
                          <Plus className="h-3 w-3 text-green-600" />
                        </button>
                      )}
                    </div>

                    {/* チーム別休暇状況表示(デスクトップのみ) */}
                    {isCurrentMonth && (
                      <div className="mb-1 sm:mb-2">
                        <div className="text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">
                          {dayInfo.totalOffCount}/{dayInfo.totalVacationLimit}
                        </div>
                      </div>
                    )}

                    {/* 勤務状態の表示 */}
                    {isCurrentMonth && dayInfo.vacationRequest && dayInfo.vacationRequest.workStatus !== 'working' && (
                      <div className="mt-1 sm:mt-2">
                        <div className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded border cursor-pointer hover:opacity-80 ${getStatusColor(dayInfo.vacationRequest.workStatus)}`}
                             onClick={(e) => {
                               e.stopPropagation()
                               handleVacationRequest(dayInfo)
                             }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{getStatusLabel(dayInfo.vacationRequest.workStatus)}</span>
                            {dayInfo.canDelete && (
                              <X className="h-3 w-3 text-gray-600 hover:text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">操作ガイド</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded flex-shrink-0"></div>
              <span>休暇取得済み</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plus className="h-3 w-3 text-green-600 flex-shrink-0" />
              <span>申請可能（10日以上先）</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span>申請不可（直近10日以内）</span>
            </div>
          </div>
        </div>
      </div>

      {/* 日付詳細モーダル */}
      {showDayModal && dayModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">{format(dayModalData.date, 'MM/dd(E)', { locale: ja })} の状況</span>
                </h3>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* 出勤者リスト */}
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-green-700 mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    出勤者 ({dayModalData.workingDrivers.length}人)
                  </h4>
                  <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                    {dayModalData.workingDrivers.length > 0 ? (
                      dayModalData.workingDrivers.map(driver => (
                        <div key={driver.id} className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                          <div className="font-medium text-green-900 text-sm sm:text-base">{driver.name}</div>
                          <div className="text-xs sm:text-sm text-green-700">{driver.team} - {driver.employeeId}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-500 text-center py-4">出勤者がいません</div>
                    )}
                  </div>
                </div>

                {/* 休暇者リスト */}
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-red-700 mb-3 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    休暇者 ({dayModalData.vacationDrivers.length}人)
                  </h4>
                  <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                    {dayModalData.vacationDrivers.length > 0 ? (
                      dayModalData.vacationDrivers.map(vacation => (
                        <div key={vacation.id} className={`border rounded-lg p-2 sm:p-3 ${
                          vacation.hasSpecialNote 
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm sm:text-base text-red-900 flex items-center">
                              {vacation.driverName}
                              {vacation.hasSpecialNote && (
                                <div className="ml-2">
                                  <span className="inline-flex items-center justify-center w-4 h-4 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                    !
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs px-2 py-1 rounded font-medium bg-red-100 text-red-800">
                              休暇
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm mt-1 text-red-700">
                            {vacation.team} - {vacation.employeeId}
                          </div>
                          {vacation.hasSpecialNote && vacation.specialNote && (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                              <div className="flex items-center space-x-1 mb-1">
                                <AlertCircle className="h-3 w-3 text-yellow-600" />
                                <span className="font-medium text-yellow-800">特記事項</span>
                              </div>
                              <div className="text-yellow-900 leading-relaxed">
                                {vacation.specialNote}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-500 text-center py-4">休暇者がいません</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDayModal(false)}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base font-medium touch-manipulation"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 申請モーダル */}
      {showRequestModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">休暇申請</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">申請日:</p>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs sm:text-sm text-gray-600 mb-3">申請種類:</p>
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📋</span>
                    <span className="text-base font-medium text-blue-900">休暇申請</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base font-medium touch-manipulation"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium touch-manipulation"
                >
                  申請する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}