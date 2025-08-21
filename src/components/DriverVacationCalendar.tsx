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
  Moon
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, VacationRequest, MonthlyVacationStats } from '@/types'
import { formatDateForDB } from '@/utils/dateUtils'

interface DriverVacationCalendarProps {
  currentUser: Driver | null
  existingRequests: VacationRequest[]
  monthlyStats: MonthlyVacationStats | null
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
}

export default function DriverVacationCalendar({ 
  currentUser, 
  existingRequests, 
  monthlyStats,
  onRequestSubmit,
  onRequestDelete,
}: DriverVacationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState<'day_off' | 'night_shift'>('day_off')

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
      
      // 既存の休暇申請を検索
      const vacationRequest = existingRequests.find(req => 
        req.driverId === currentUser.id && isSameDay(req.date, date)
      )
      
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
        canDelete: vacationRequest ? canDelete : false
      }
    })
  }

  const calendarDays = generateCalendarDays()

  const handleDateClick = (dayInfo: DailyInfo) => {
    if (!dayInfo.isCurrentMonth) return
    
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
      {monthlyStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {monthlyStats.year}年{monthlyStats.month}月の休暇統計
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalOffDays}</div>
              <div className="text-sm text-gray-600">取得日数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{monthlyStats.requiredMinimumDays}</div>
              <div className="text-sm text-gray-600">必要日数</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                monthlyStats.remainingRequiredDays > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {monthlyStats.remainingRequiredDays}
              </div>
              <div className="text-sm text-gray-600">残り必要日数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{monthlyStats.maxAllowedDays}</div>
              <div className="text-sm text-gray-600">上限日数</div>
            </div>
          </div>
        </div>
      )}

      {/* カレンダー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'yyyy年MM月', { locale: ja })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center text-sm font-medium ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                !dayInfo.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${
                dayInfo.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
              }`}
              onClick={() => handleDateClick(dayInfo)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  dayInfo.isToday ? 'text-blue-600' : 
                  !dayInfo.isCurrentMonth ? 'text-gray-400' :
                  dayInfo.isWeekend ? (dayInfo.date.getDay() === 0 ? 'text-red-600' : 'text-blue-600') :
                  'text-gray-900'
                }`}>
                  {format(dayInfo.date, 'd')}
                </span>
                
                {dayInfo.canRequest && dayInfo.isCurrentMonth && (
                  <Plus className="h-4 w-4 text-green-600" />
                )}
              </div>

              {/* 休暇申請表示 */}
              {dayInfo.vacationRequest && dayInfo.vacationRequest.workStatus !== 'working' && (
                <div className={`text-xs px-2 py-1 rounded border ${getStatusColor(dayInfo.vacationRequest.workStatus)}`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(dayInfo.vacationRequest.workStatus)}
                    <span>
                      {dayInfo.vacationRequest.workStatus === 'day_off' ? '休暇' : 
                       dayInfo.vacationRequest.workStatus === 'night_shift' ? '夜勤' : '出勤'}
                    </span>
                  </div>
                </div>
              )}

              {/* 申請不可の理由 */}
              {!dayInfo.canRequest && !dayInfo.vacationRequest && dayInfo.isCurrentMonth && (
                <div className="text-xs text-gray-400">
                  申請不可
                </div>
              )}
            </div>
          ))}
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