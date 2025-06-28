'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, AlertTriangle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VacationRequest, VacationSettings, Driver } from '@/types'

interface VacationCalendarViewProps {
  vacationRequests: VacationRequest[]
  vacationSettings: VacationSettings
  drivers: Driver[]
}

export default function VacationCalendarView({
  vacationRequests,
  vacationSettings,
  drivers
}: VacationCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')

  // 現在の月の日付一覧を取得
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 月の最初の日の曜日を取得（カレンダーの空白セル用）
  const startDay = getDay(monthStart)
  const emptyDays = Array.from({ length: startDay }, (_, i) => i)

  // フィルタリングされた休暇申請
  const filteredRequests = vacationRequests.filter(request => {
    if (selectedTeam !== 'all' && request.team !== selectedTeam) return false
    return request.status === 'approved' || request.status === 'pending'
  })

  // 指定日の休暇申請を取得
  const getRequestsForDate = (date: Date) => {
    return filteredRequests.filter(request => {
      return date >= request.startDate && date <= request.endDate
    })
  }

  // 指定日がブラックアウト日かチェック
  const isBlackoutDate = (date: Date) => {
    return vacationSettings.blackoutDates.some(blackoutDate => 
      format(date, 'yyyy-MM-dd') === format(blackoutDate, 'yyyy-MM-dd')
    )
  }

  // 指定日が祝日かチェック
  const isHoliday = (date: Date) => {
    return vacationSettings.holidayDates.some(holiday => 
      format(date, 'yyyy-MM-dd') === format(holiday, 'yyyy-MM-dd')
    )
  }

  // チーム別の統計を計算
  const getTeamStats = (date: Date) => {
    const requests = getRequestsForDate(date)
    const stats: { [team: string]: number } = {}
    
    requests.forEach(request => {
      stats[request.team] = (stats[request.team] || 0) + 1
    })
    
    return stats
  }

  // 月を変更
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  // 休暇タイプの色を取得
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'personal':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'yyyy年MM月', { locale: ja })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="form-select"
          >
            <option value="all">すべてのチーム</option>
            <option value="Bチーム">Bチーム</option>
            <option value="Cチーム">Cチーム</option>
          </select>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary"
          >
            今月へ戻る
          </button>
        </div>
      </div>

      {/* 凡例 */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">凡例</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span>年次有給</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
            <span>病気休暇</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
            <span>私用休暇</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
            <span>緊急休暇</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
            <span>休暇取得不可日</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span>祝日</span>
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {/* 曜日ヘッダー */}
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={`p-4 text-center font-medium border-b border-gray-200 ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}

          {/* 空白セル（月の最初の日より前） */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-32 border-b border-r border-gray-200"></div>
          ))}

          {/* 日付セル */}
          {days.map((day) => {
            const requests = getRequestsForDate(day)
            const teamStats = getTeamStats(day)
            const isBlackout = isBlackoutDate(day)
            const isHol = isHoliday(day)
            const dayOfWeek = getDay(day)

            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`h-32 border-b border-r border-gray-200 p-2 ${
                  isToday(day) ? 'bg-blue-50' : 
                  isBlackout ? 'bg-gray-100' :
                  isHol ? 'bg-green-50' :
                  dayOfWeek === 0 ? 'bg-red-50' :
                  dayOfWeek === 6 ? 'bg-blue-50' :
                  'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isToday(day) ? 'text-blue-600' :
                    dayOfWeek === 0 ? 'text-red-600' :
                    dayOfWeek === 6 ? 'text-blue-600' :
                    'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {isBlackout && (
                    <AlertTriangle className="h-3 w-3 text-gray-500" />
                  )}
                  {isHol && (
                    <div className="text-xs text-green-600">祝</div>
                  )}
                </div>

                {/* 休暇申請表示 */}
                <div className="space-y-1">
                  {requests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className={`text-xs px-1 py-0.5 rounded border truncate ${getTypeColor(request.type)}`}
                      title={`${request.driverName} (${request.team}) - ${request.reason}`}
                    >
                      {request.driverName}
                    </div>
                  ))}
                  {requests.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{requests.length - 3}件
                    </div>
                  )}
                </div>

                {/* チーム別統計 */}
                {Object.keys(teamStats).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    {Object.entries(teamStats).map(([team, count]) => (
                      <div key={team}>
                        {team}: {count}人
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 月間統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">今月の休暇申請</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredRequests.filter(req => 
                  isSameMonth(req.startDate, currentDate) || 
                  isSameMonth(req.endDate, currentDate)
                ).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">承認待ち</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredRequests.filter(req => 
                  req.status === 'pending' && (
                    isSameMonth(req.startDate, currentDate) || 
                    isSameMonth(req.endDate, currentDate)
                  )
                ).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">最大同時休暇者数</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.max(...days.map(day => getRequestsForDate(day).length), 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 