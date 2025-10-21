'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  CalendarDays,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  UserX
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, addDays, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, VacationRequest, MonthlyVacationStats } from '@/types'

interface DriverVacationRequestProps {
  currentUser: Driver | null
  existingRequests: VacationRequest[]
  monthlyStats: MonthlyVacationStats | null
  onRequestSubmit: (request: Omit<VacationRequest, 'id' | 'requestDate'>) => void
  onRequestDelete?: (requestId: number) => void
}

export default function DriverVacationRequest({ 
  currentUser, 
  existingRequests, 
  monthlyStats,
  onRequestSubmit,
  onRequestDelete,
}: DriverVacationRequestProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [vacationType, setVacationType] = useState<'day_off' | 'night_shift'>('day_off')

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          ユーザー情報を読み込み中...
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !currentUser) return

    const newRequest: Omit<VacationRequest, 'id' | 'requestDate'> = {
      driverId: currentUser.id,
      driverName: currentUser.name,
      team: currentUser.team,
      employeeId: currentUser.employeeId,
      date: selectedDate,
      workStatus: vacationType,
      isOff: vacationType === 'day_off',
      type: vacationType,
      reason: '',
      status: 'approved',
      isExternalDriver: currentUser.employeeId.startsWith('E'),
      registeredBy: 'driver' as const
    }

    onRequestSubmit(newRequest)
    setIsFormOpen(false)
    setSelectedDate(null)
    setVacationType('day_off')
  }

  // 申請制限の判定
  const isWithinRestrictionPeriod = (date: Date) => {
    const today = new Date()
    const daysDifference = differenceInDays(date, today)
    return daysDifference < 10 && daysDifference >= 0  // 直近10日間は申請不可
  }

  const canDeleteRequest = (request: VacationRequest) => {
    const today = new Date()
    const daysDifference = differenceInDays(request.date, today)
    return daysDifference >= 10  // 10日以上先からのみ削除可能
  }

  const handleDateClick = (date: Date) => {
    const today = new Date()
    const isPast = date < today && !isSameDay(date, today)

    if (isPast) {
      return  // 過去の日付はクリック不可
    }

    if (isWithinRestrictionPeriod(date)) {
      alert('直近10日間の休暇・夜勤申請はできません。余裕を持って申請してください。')
      return
    }

    setSelectedDate(date)
    setVacationType('day_off')
    setIsFormOpen(true)
  }

  const handleDeleteRequest = (requestId: number) => {
    const request = existingRequests.find(req => req.id === requestId)
    if (!request) return

    if (!canDeleteRequest(request)) {
      alert('10日以内の休暇・夜勤申請の削除は管理者にお問い合わせください。')
      return
    }

    if (onRequestDelete) {
      onRequestDelete(requestId)
    }
  }

  const getUserRequests = () => {
    return existingRequests.filter(req => req.driverId === currentUser.id)
  }

  const getMonthlyOffDays = () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    return existingRequests.filter(req => 
      req.driverId === currentUser.id &&
      req.date.getFullYear() === currentYear &&
      req.date.getMonth() + 1 === currentMonth &&
      req.isOff
    ).length
  }

  const getDayVacations = (date: Date) => {
    return existingRequests.filter(req =>
      isSameDay(req.date, date) && (req.isOff || req.workStatus === 'night_shift')
    )
  }

  const getDayVacationStats = (date: Date) => {
    const dayVacations = getDayVacations(date)
    const regularCount = dayVacations.filter(v => !v.isExternalDriver).length
    const externalCount = dayVacations.filter(v => v.isExternalDriver).length
    return { regular: regularCount, external: externalCount, total: regularCount + externalCount }
  }

  const monthlyOffDays = getMonthlyOffDays()
  const minimumRequired = 9
  const remainingRequired = Math.max(0, minimumRequired - monthlyOffDays)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const selectedDateVacations = selectedDate ? getDayVacations(selectedDate) : []
  const userHasVacationOnSelectedDate = selectedDate ?
    getUserRequests().some(req => isSameDay(req.date, selectedDate) && (req.isOff || req.workStatus === 'night_shift')) : false

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">休暇・夜勤申請</h2>
      </div>

      {/* 月間休暇状況表示 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {format(new Date(), 'yyyy年MM月', { locale: ja })} の休暇状況
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">今月の休暇日数</p>
            <p className="text-2xl font-bold text-blue-700">{monthlyOffDays}日</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">必要最低日数</p>
            <p className="text-2xl font-bold text-orange-700">{minimumRequired}日</p>
          </div>
          <div className={`rounded-lg p-4 ${
            remainingRequired === 0 ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <p className={`text-sm font-medium ${
              remainingRequired === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              残り必要日数
            </p>
            <p className={`text-2xl font-bold ${
              remainingRequired === 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {remainingRequired}日
            </p>
          </div>
        </div>

        {/* 注意メッセージ */}
        {remainingRequired > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                あと{remainingRequired}日の休暇申請が必要です。25日までに申請してください。
              </p>
            </div>
          </div>
        )}

        {remainingRequired === 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800">
                今月の必要休暇日数を満たしています。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* カレンダービュー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'yyyy年MM月', { locale: ja })} カレンダー
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div key={day} className={`p-2 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー日付 */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map(date => {
            const stats = getDayVacationStats(date)
            const isToday = isSameDay(date, new Date())
            const isPast = date < new Date() && !isToday
            const isRestricted = isWithinRestrictionPeriod(date)
            const dayOfWeek = date.getDay()
            const userHasVacation = getUserRequests().some(req =>
              isSameDay(req.date, date) && req.isOff
            )
            const userHasNightShift = getUserRequests().some(req =>
              isSameDay(req.date, date) && req.workStatus === 'night_shift'
            )

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  relative min-h-[80px] p-2 border rounded-lg
                  ${isPast ? 'bg-gray-50 cursor-not-allowed' :
                    isRestricted ? 'bg-yellow-50 border-yellow-200 cursor-not-allowed' :
                    'cursor-pointer hover:bg-gray-50'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${userHasVacation ? 'bg-blue-50 border-blue-200' : ''}
                  ${userHasNightShift ? 'bg-indigo-50 border-indigo-200' : ''}
                `}
                title={isRestricted ? '直近10日間は申請できません' : ''}
              >
                <div className={`text-sm font-medium ${
                  isPast ? 'text-gray-400' :
                  dayOfWeek === 0 ? 'text-red-600' :
                  dayOfWeek === 6 ? 'text-blue-600' :
                  'text-gray-900'
                }`}>
                  {format(date, 'd')}
                </div>
                
                {stats.total > 0 && (
                  <div className="mt-1 space-y-1">
                    {stats.regular > 0 && (
                      <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded text-center">
                        正:{stats.regular}
                      </div>
                    )}
                    {stats.external > 0 && (
                      <div className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-center">
                        外:{stats.external}
                      </div>
                    )}
                  </div>
                )}
                
                {userHasVacation && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
                {userHasNightShift && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 休暇申請フォーム */}
      {isFormOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'MM月dd日 (E)', { locale: ja })}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* その日の休暇申請一覧 */}
              {selectedDateVacations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">この日の休暇申請</h4>
                  <div className="space-y-2">
                    {selectedDateVacations.map(vacation => (
                      <div key={vacation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            vacation.isExternalDriver ? 'bg-purple-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">{vacation.driverName}</span>
                          <span className="text-xs text-gray-500">
                            ({vacation.isExternalDriver ? '外部' : '正社員'})
                          </span>
                          {vacation.workStatus === 'night_shift' && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              夜勤
                            </span>
                          )}
                        </div>
                        {vacation.driverId === currentUser.id && onRequestDelete && (
                          canDeleteRequest(vacation) ? (
                          <button
                            onClick={() => handleDeleteRequest(vacation.id)}
                            className="text-red-500 hover:text-red-700"
                              title="削除"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                          ) : (
                            <div className="text-gray-400" title="1ヶ月以内の申請は管理者にお問い合わせください">
                              <UserX className="h-4 w-4" />
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 休暇・夜勤申請フォーム */}
              {!userHasVacationOnSelectedDate ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      申請種別を選択
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setVacationType('day_off')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          vacationType === 'day_off'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        休暇
                      </button>
                      <button
                        type="button"
                        onClick={() => setVacationType('night_shift')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          vacationType === 'night_shift'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        夜勤
                      </button>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${
                    vacationType === 'day_off' ? 'bg-blue-50' : 'bg-indigo-50'
                  }`}>
                    <p className={`text-sm ${
                      vacationType === 'day_off' ? 'text-blue-800' : 'text-indigo-800'
                    }`}>
                      {format(selectedDate, 'MM月dd日 (E)', { locale: ja })} に
                      {vacationType === 'day_off' ? '休暇' : '夜勤'}を申請しますか？
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 py-2 px-4 text-white rounded-lg ${
                        vacationType === 'day_off'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      申請する
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center text-gray-600">
                  <p>この日は既に申請済みです</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 