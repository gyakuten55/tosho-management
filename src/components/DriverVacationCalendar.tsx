'use client'

import { useState, useEffect } from 'react'
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
import { Driver, VacationRequest, MonthlyVacationStats, VacationSettings } from '@/types'
import { formatDateForDB } from '@/utils/dateUtils'
import { VacationService } from '@/services/vacationService'
import { DriverService } from '@/services/driverService'

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
  const [requestType, setRequestType] = useState<'day_off' | 'night_shift'>('day_off')
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayModalData, setDayModalData] = useState<{
    date: Date
    workingDrivers: Driver[]
    vacationDrivers: VacationRequest[]
  } | null>(null)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])

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

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          ユーザー情報を読み込み中...
        </div>
      </div>
    )
  }

  // カレンダーの日付情報を生成
  const generateCalendarDays = (): DailyInfo[] => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜始まり
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    return days.map(date => {
      const isCurrentMonth = isSameMonth(date, currentDate)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const today = new Date()
      
      // 既存の休暇申請を検索（現在のユーザー）
      const vacationRequest = existingRequests.find(req => 
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
      
      // 申請可能かチェック
      const daysDifference = differenceInDays(date, today)
      const canRequest = daysDifference >= 10 && isCurrentMonth // 10日以上先なら申請可能
      
      // 削除可能かチェック
      const canDelete = vacationRequest ? differenceInDays(date, today) > 30 : false // 30日以上先なら削除可能
      
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
        teamVacationLimit
      }
    })
  }

  const calendarDays = generateCalendarDays()

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
    
    // 日付クリック時：その日の出勤・休暇状況を表示
    const workingDrivers = allDrivers.filter(driver => {
      const hasVacation = dayInfo.vacations.some(v => v.driverId === driver.id)
      return !hasVacation
    })
    
    setDayModalData({
      date: dayInfo.date,
      workingDrivers,
      vacationDrivers: dayInfo.vacations
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
        alert('申請から30日以内の休暇は削除できません。')
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
      workStatus: requestType === 'day_off' ? 'day_off' : 'night_shift',
      isOff: requestType === 'day_off',
      type: requestType,
      reason: '',
      status: 'approved',
      isExternalDriver: currentUser.employeeId.startsWith('E')
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-8 w-8 mr-3 text-primary-600" />
          休暇申請カレンダー
        </h1>
      </div>

      {/* 月間統計 */}
      {currentMonthStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentMonthStats.year}年{currentMonthStats.month}月の休暇統計
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentMonthStats.totalOffDays}</div>
              <div className="text-sm text-gray-600">取得日数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentMonthStats.requiredMinimumDays}</div>
              <div className="text-sm text-gray-600">必要日数</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                currentMonthStats.remainingRequiredDays > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {currentMonthStats.remainingRequiredDays}
              </div>
              <div className="text-sm text-gray-600">残り必要日数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {((currentMonthStats.totalOffDays / currentMonthStats.requiredMinimumDays) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">達成率</div>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー */}
      <div className="space-y-4">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'yyyy年MM月', { locale: ja })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
              📌 日付をクリックして出勤・休暇状況を確認
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
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
              const isCurrentMonth = isSameMonth(dayInfo.date, currentDate)
              const hasVacations = dayInfo.totalOffCount > 0
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 transition-colors ${
                    isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isCurrentDate ? 'bg-blue-50 border-blue-300' : 
                    !isCurrentMonth ? 'bg-gray-50' :
                    hasVacations ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => isCurrentMonth ? handleDateClick(dayInfo) : undefined}
                >
                  {/* 日付 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isCurrentDate ? 'text-blue-600' : 
                      !isCurrentMonth ? 'text-gray-400' :
                      'text-gray-900'
                    }`}>
                      {format(dayInfo.date, 'd')}
                    </span>
                    
                    {dayInfo.canRequest && dayInfo.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVacationRequest(dayInfo)
                        }}
                        className="p-1 hover:bg-green-100 rounded"
                      >
                        <Plus className="h-3 w-3 text-green-600" />
                      </button>
                    )}
                  </div>

                  {/* チーム別休暇状況表示 */}
                  {isCurrentMonth && (
                    <div className="mb-2">
                      <div className="text-xs px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">
                        {currentUser.team.replace('チーム', '')}: {dayInfo.teamVacationCount}/{dayInfo.teamVacationLimit}
                      </div>
                    </div>
                  )}

                  {/* 勤務状態の表示 - 現在の月のみ表示（自分の状態のみ） */}
                  {isCurrentMonth && dayInfo.vacationRequest && dayInfo.vacationRequest.workStatus !== 'working' && (
                    <div className="mt-2">
                      <div className={`text-xs px-2 py-1 rounded border cursor-pointer hover:opacity-80 ${getStatusColor(dayInfo.vacationRequest.workStatus)}`}
                           onClick={(e) => {
                             e.stopPropagation()
                             handleVacationRequest(dayInfo)
                           }}>
                        <div className="flex items-center justify-between">
                          <span>{dayInfo.vacationRequest.workStatus === 'day_off' ? '休暇' : 
                                 dayInfo.vacationRequest.workStatus === 'night_shift' ? '夜勤' : '出勤'}</span>
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

        {/* 凡例 */}
        <div className="mt-6 flex flex-wrap items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>休暇</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>夜勤</span>
          </div>
          <div className="flex items-center space-x-2">
            <Plus className="h-3 w-3 text-green-600" />
            <span>申請可能</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-3 w-3 text-gray-400" />
            <span>申請不可（直近10日以内）</span>
          </div>
        </div>
      </div>

      {/* 日付詳細モーダル */}
      {showDayModal && dayModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {format(dayModalData.date, 'yyyy年MM月dd日(E)', { locale: ja })} の出勤状況
                </h3>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 出勤者リスト */}
                <div>
                  <h4 className="text-md font-medium text-green-700 mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    出勤者 ({dayModalData.workingDrivers.length}人)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dayModalData.workingDrivers.length > 0 ? (
                      dayModalData.workingDrivers.map(driver => (
                        <div key={driver.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="font-medium text-green-900">{driver.name}</div>
                          <div className="text-sm text-green-700">{driver.team} - {driver.employeeId}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">出勤者がいません</div>
                    )}
                  </div>
                </div>

                {/* 休暇・夜勤者リスト */}
                <div>
                  <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    休暇・夜勤者 ({dayModalData.vacationDrivers.length}人)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dayModalData.vacationDrivers.length > 0 ? (
                      dayModalData.vacationDrivers.map(vacation => (
                        <div key={vacation.id} className={`border rounded-lg p-3 ${
                          vacation.workStatus === 'day_off' ? 'bg-red-50 border-red-200' : 
                          vacation.workStatus === 'night_shift' ? 'bg-blue-50 border-blue-200' : 
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className={`font-medium ${
                              vacation.workStatus === 'day_off' ? 'text-red-900' : 
                              vacation.workStatus === 'night_shift' ? 'text-blue-900' : 
                              'text-gray-900'
                            }`}>
                              {vacation.driverName}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              vacation.workStatus === 'day_off' ? 'bg-red-100 text-red-800' : 
                              vacation.workStatus === 'night_shift' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {vacation.workStatus === 'day_off' ? '休暇' : 
                               vacation.workStatus === 'night_shift' ? '夜勤' : '出勤'}
                            </div>
                          </div>
                          <div className={`text-sm ${
                            vacation.workStatus === 'day_off' ? 'text-red-700' : 
                            vacation.workStatus === 'night_shift' ? 'text-blue-700' : 
                            'text-gray-700'
                          }`}>
                            {vacation.team} - {vacation.employeeId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">休暇・夜勤者がいません</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDayModal(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">休暇申請</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">申請日:</p>
                <p className="text-lg font-medium text-gray-900">
                  {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">申請種類:</p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="requestType"
                      value="day_off"
                      checked={requestType === 'day_off'}
                      onChange={(e) => setRequestType(e.target.value as 'day_off' | 'night_shift')}
                      className="mr-3"
                    />
                    <span>休暇</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="requestType"
                      value="night_shift"
                      checked={requestType === 'night_shift'}
                      onChange={(e) => setRequestType(e.target.value as 'day_off' | 'night_shift')}
                      className="mr-3"
                    />
                    <span>夜勤</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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