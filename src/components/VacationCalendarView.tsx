'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, AlertTriangle, X, Car, User } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VacationRequest, VacationSettings, Driver, Vehicle, Holiday } from '@/types'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { HolidayService } from '@/services/holidayService'

interface VacationCalendarViewProps {
  vacationRequests: VacationRequest[]
  vacationSettings: VacationSettings
  drivers: Driver[]
  vehicles?: Vehicle[]
}

export default function VacationCalendarView({
  vacationRequests,
  vacationSettings,
  drivers,
  vehicles = []
}: VacationCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    console.log('🎌 VacationCalendarView useEffect triggered - currentDate:', currentDate)
    
    const loadHolidays = async () => {
      try {
        const currentYear = currentDate.getFullYear()
        console.log('🎌 Loading holidays for year:', currentYear)
        
        // データベースから祝日データを取得
        const yearHolidays = await HolidayService.getByYear(currentYear)
        console.log('🎌 Fetched holidays from database:', yearHolidays.length, yearHolidays)
        
        setHolidays(yearHolidays)
      } catch (error) {
        console.error('🎌 Failed to load holidays from database:', error)
        setHolidays([])
      }
    }

    loadHolidays()
  }, [currentDate])

  // エスケープキーでモーダルを閉じる
  useEscapeKey(() => {
    if (showDetailModal) {
      setShowDetailModal(false)
    }
  }, showDetailModal)

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
    return true  // すべての勤務状態を表示
  })

  // チーム色を取得
  const getTeamColor = (team: string) => {
    const colors = {
      '配送センターチーム': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      '常駐チーム': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'Bチーム': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      '配送センター外注': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
    }
    return colors[team as keyof typeof colors] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  }

  // 指定日の各勤務状態を取得
  const getWorkStatusForDate = (date: Date) => {
    const dayRequests = filteredRequests.filter(request => 
      format(date, 'yyyy-MM-dd') === format(request.date, 'yyyy-MM-dd')
    )

    const vacationDrivers = dayRequests.filter(req => req.workStatus === 'day_off')
    const nightShiftDrivers = dayRequests.filter(req => req.workStatus === 'night_shift')
    const workingDrivers = dayRequests.filter(req => req.workStatus === 'working')

    // 車両情報も含める
    const getDriverVehicle = (driverName: string) => {
      return vehicles.find(v => v.driver === driverName)
    }

    return {
      vacation: vacationDrivers.map(req => ({
        ...req,
        vehicle: getDriverVehicle(req.driverName)
      })),
      nightShift: nightShiftDrivers.map(req => ({
        ...req,
        vehicle: getDriverVehicle(req.driverName)
      })),
      working: workingDrivers.map(req => ({
        ...req,
        vehicle: getDriverVehicle(req.driverName)
      }))
    }
  }

  // 特定日付の上限設定を取得
  const getVacationLimitForTeamAndDate = (team: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    
    // 特定日付設定があるかチェック（チーム別）
    if (vacationSettings.specificDateLimits[dateString]?.[team] !== undefined) {
      return vacationSettings.specificDateLimits[dateString][team]
    }
    
    // 基本設定から取得
    const weekday = getDay(date)
    const month = date.getMonth() + 1
    const basicLimit = vacationSettings.teamMonthlyWeekdayLimits[team]?.[month]?.[weekday] || 0
    return basicLimit
  }

  // チーム別休暇取得者数を取得
  const getTeamVacationStats = (date: Date) => {
    const dayVacationRequests = filteredRequests.filter(request => 
      format(date, 'yyyy-MM-dd') === format(request.date, 'yyyy-MM-dd') && request.workStatus === 'day_off'
    )
    
    const teamStats = {
      '配送センターチーム': { off: 0, total: 0 },
      '常駐チーム': { off: 0, total: 0 },
      'Bチーム': { off: 0, total: 0 },
      '配送センター外注': { off: 0, total: 0 }
    }
    
    // 各チームの休暇上限を計算（特定日付設定を考慮）
    Object.keys(teamStats).forEach(team => {
      const limit = getVacationLimitForTeamAndDate(team, date)
      teamStats[team as keyof typeof teamStats].total = limit
    })
    
    // 休暇取得者数をカウント
    dayVacationRequests.forEach(request => {
      if (teamStats[request.team as keyof typeof teamStats]) {
        teamStats[request.team as keyof typeof teamStats].off++
      }
    })
    
    return teamStats
  }

  // 指定日がブラックアウト日かチェック
  const isBlackoutDate = (date: Date) => {
    return vacationSettings.blackoutDates.some(blackoutDate => 
      format(date, 'yyyy-MM-dd') === format(blackoutDate, 'yyyy-MM-dd')
    )
  }

  // 指定日が祝日かチェック
  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      format(date, 'yyyy-MM-dd') === format(holiday.date, 'yyyy-MM-dd')
    ) || vacationSettings.holidayDates.some(holiday => 
      format(date, 'yyyy-MM-dd') === format(holiday, 'yyyy-MM-dd')
    )
  }

  // 指定日の祝日名を取得
  const getHolidayName = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    console.log('🎌 Checking holiday for date:', dateStr, 'Available holidays:', holidays.length)
    
    const holiday = holidays.find(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === dateStr
    )
    if (holiday) {
      console.log(`🎌 Holiday found for ${dateStr}: ${holiday.name}`)
    }
    return holiday ? holiday.name : null
  }

  // 月を変更
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  // セルクリック時の詳細表示
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDetailModal(true)
  }

  // モーダルで表示する詳細情報
  const getDetailForDate = (date: Date | null) => {
    if (!date) return null
    
    const workStatus = getWorkStatusForDate(date)
    return {
      date,
      vacation: workStatus.vacation,
      nightShift: workStatus.nightShift,
      working: workStatus.working,
      totalVacation: workStatus.vacation.length,
      totalNightShift: workStatus.nightShift.length,
      totalWorking: workStatus.working.length
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
            <option value="配送センターチーム">配送センターチーム</option>
            <option value="常駐チーム">常駐チーム</option>
            <option value="Bチーム">Bチーム</option>
            <option value="配送センター外注">配送センター外注</option>
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
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
            <span>配送センター</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span>常駐</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span>B</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
            <span>配送センター外注</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
            <span>休暇取得不可日</span>
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
            const workStatus = getWorkStatusForDate(day)
            const isBlackout = isBlackoutDate(day)
            const isHol = isHoliday(day)
            const holidayName = getHolidayName(day)
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
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isToday(day) ? 'text-blue-600' :
                    dayOfWeek === 0 ? 'text-red-600' :
                    dayOfWeek === 6 ? 'text-blue-600' :
                    'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                    {holidayName && (
                      <span className="ml-2 text-xs text-red-600 font-medium">
                        {holidayName}
                      </span>
                    )}
                  </span>
                  {isBlackout && (
                    <AlertTriangle className="h-3 w-3 text-gray-500" />
                  )}
                </div>

                {/* チーム別休暇統計表示 */}
                <div className="space-y-1">
                  {(() => {
                    const teamStats = getTeamVacationStats(day)
                    const workStatus = getWorkStatusForDate(day)
                    
                    // 表示順序を固定
                    const teamOrder = ['配送センターチーム', '配送センター外注', '常駐チーム', 'Bチーム']
                    
                    return (
                      <>
                        {teamOrder.map(team => {
                          const stats = teamStats[team as keyof typeof teamStats] || { off: 0, total: 0 }
                          const teamColor = getTeamColor(team)
                          
                          // デバッグ: 配送センター外注の情報を確認
                          if (team === '配送センター外注') {
                            console.log(`配送センター外注 stats:`, stats)
                            console.log(`teamStats:`, teamStats)
                          }
                          
                          return (
                            <div
                              key={team}
                              className={`text-xs px-2 py-1 rounded ${teamColor.bg} ${teamColor.text} ${teamColor.border} border font-medium flex items-center justify-between`}
                            >
                              <span>{team.replace('チーム', '').replace('配送センター外注', 'センター外注')}</span>
                              <span>{stats.off}/{stats.total}</span>
                            </div>
                          )
                        })}
                        {/* 夜勤人数表示 */}
                        <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200 font-medium flex items-center justify-between">
                          <span>夜勤</span>
                          <span>{workStatus.nightShift.length}人</span>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* 個別休暇申請表示（3件まで） */}
                <div className="space-y-1 mt-2">
                  {workStatus.vacation.slice(0, 2).map((request) => {
                    const teamColor = getTeamColor(request.team)
                    return (
                      <div
                        key={request.id}
                        className={`text-xs px-1 py-0.5 rounded border truncate ${teamColor.bg} ${teamColor.text} ${teamColor.border}`}
                        title={`${request.driverName} (${request.team}) - 休暇申請`}
                      >
                        {request.driverName}
                      </div>
                    )
                  })}
                  {workStatus.vacation.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{workStatus.vacation.length - 2}名
                    </div>
                  )}
                </div>
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
                  isSameMonth(req.date, currentDate)
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
              <p className="text-sm font-medium text-gray-600">総休暇日数</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRequests.filter(req => 
                  isSameMonth(req.date, currentDate)
                ).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">最大同時休暇者数</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.max(...days.map(day => getWorkStatusForDate(day).vacation.length), 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

              {/* 詳細モーダル */}
        {showDetailModal && selectedDate && (() => {
          const detail = getDetailForDate(selectedDate)
          if (!detail) return null
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}の勤務状況詳細
                    </h3>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{detail.totalVacation}</div>
                      <div className="text-sm text-gray-600">休暇</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{detail.totalNightShift}</div>
                      <div className="text-sm text-gray-600">夜勤</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{detail.totalWorking}</div>
                      <div className="text-sm text-gray-600">出勤</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* 休暇中ドライバー */}
                  {detail.vacation.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-red-600 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        休暇中ドライバー ({detail.vacation.length}名)
                      </h4>
                      <div className="space-y-2">
                        {detail.vacation.map((req) => (
                          <div key={req.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-red-600" />
                                <div>
                                  <div className="font-medium text-gray-900">{req.driverName}</div>
                                  <div className="text-sm text-gray-600">{req.team} - {req.employeeId}</div>
                                </div>
                              </div>
                              {req.vehicle && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Car className="h-4 w-4" />
                                  <span>{req.vehicle.plateNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 夜勤ドライバー */}
                  {detail.nightShift.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-blue-600 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        夜勤ドライバー ({detail.nightShift.length}名)
                      </h4>
                      <div className="space-y-2">
                        {detail.nightShift.map((req) => (
                          <div key={req.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium text-gray-900">{req.driverName}</div>
                                  <div className="text-sm text-gray-600">{req.team} - {req.employeeId}</div>
                                </div>
                              </div>
                              {req.vehicle && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Car className="h-4 w-4" />
                                  <span>{req.vehicle.plateNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 出勤ドライバー */}
                  {detail.working.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-green-600 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        出勤ドライバー ({detail.working.length}名)
                      </h4>
                      <div className="space-y-2">
                        {detail.working.map((req) => (
                          <div key={req.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-medium text-gray-900">{req.driverName}</div>
                                  <div className="text-sm text-gray-600">{req.team} - {req.employeeId}</div>
                                </div>
                              </div>
                              {req.vehicle && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Car className="h-4 w-4" />
                                  <span>{req.vehicle.plateNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.vacation.length === 0 && detail.nightShift.length === 0 && detail.working.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      この日の勤務状況データはありません
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
} 