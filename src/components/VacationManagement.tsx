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
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VacationRequest, MonthlyVacationStats, VacationSettings, VacationNotification, Driver } from '@/types'

interface DailyVacationInfo {
  date: Date
  vacations: {
    driverId: number
    driverName: string
    team: string
    isExternalDriver: boolean
  }[]
  totalOffCount: number
  internalDriverOffCount: number
  externalDriverOffCount: number
}

interface VacationManagementProps {
  vacationRequests: VacationRequest[]
  vacationStats: MonthlyVacationStats[]
  vacationSettings: VacationSettings
  vacationNotifications: VacationNotification[]
  drivers: Driver[]
  onVacationRequestsChange: (requests: VacationRequest[]) => void
  onVacationStatsChange: (stats: MonthlyVacationStats[]) => void
  onVacationSettingsChange: (settings: VacationSettings) => void
  onVacationNotificationsChange: (notifications: VacationNotification[]) => void
}

export default function VacationManagement({
  vacationRequests,
  vacationStats,
  vacationSettings,
  vacationNotifications,
  drivers,
  onVacationRequestsChange,
  onVacationStatsChange,
  onVacationSettingsChange,
  onVacationNotificationsChange
}: VacationManagementProps) {
  const [currentView, setCurrentView] = useState('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [teamFilter, setTeamFilter] = useState('all')
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [vacationType, setVacationType] = useState<'off' | 'work'>('off')

  // 設定編集用のstate
  const [editingSettings, setEditingSettings] = useState(vacationSettings)

  // ソート用のstate
  const [sortField, setSortField] = useState<'driverName' | 'totalOffDays' | 'remainingRequiredDays' | 'team'>('driverName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 初期化時に月間統計を再計算
  useEffect(() => {
    const recalculateAllStats = () => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      // 各ドライバーの最近3ヶ月分の統計を再計算
      const newStats: MonthlyVacationStats[] = []
      
      drivers.forEach(driver => {
        if (driver.employeeId.startsWith('E')) return // 外部ドライバーは統計に含めない
        
        for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
          const targetDate = new Date(currentYear, new Date().getMonth() + monthOffset, 1)
          const year = targetDate.getFullYear()
          const month = targetDate.getMonth() + 1
          
          // その月のドライバーの休暇数を計算
          const monthVacations = vacationRequests.filter(req => 
            req.driverId === driver.id && 
            req.date.getFullYear() === year && 
            req.date.getMonth() + 1 === month &&
            req.isOff &&
            !req.isExternalDriver
          )
          
          const totalOffDays = monthVacations.length
          const remainingRequiredDays = Math.max(0, vacationSettings.minimumOffDaysPerMonth - totalOffDays)
          
          newStats.push({
            driverId: driver.id,
            driverName: driver.name,
            team: driver.team,
            employeeId: driver.employeeId,
            year,
            month,
            totalOffDays,
            requiredMinimumDays: vacationSettings.minimumOffDaysPerMonth,
            remainingRequiredDays,
            maxAllowedDays: vacationSettings.maximumOffDaysPerMonth
          })
        }
      })
      
      onVacationStatsChange(newStats)
    }
    
    if (drivers.length > 0) {
      recalculateAllStats()
    }
  }, [drivers, vacationRequests, vacationSettings, onVacationStatsChange])

  // 統計情報を計算
  const currentMonth = format(calendarDate, 'yyyy-MM')
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

  // カレンダーの日付情報を生成
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate)
    const monthEnd = endOfMonth(calendarDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => {
      const dayVacations = vacationRequests.filter(req => 
        isSameDay(req.date, day) && req.isOff
      )
      
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
        totalOffCount: dayVacations.length,
        internalDriverOffCount: internalDriverVacations.length,
        externalDriverOffCount: externalDriverVacations.length
      } as DailyVacationInfo
    })
  }

  // 選択した日付の既存休暇を取得
  const getExistingVacations = () => {
    if (!selectedDate) return []
    return vacationRequests.filter(req => 
      isSameDay(req.date, selectedDate) && req.isOff
    )
  }

  // セルクリック時の処理
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowVacationForm(true)
    setSelectedDriverId('')
    setVacationType('off')
  }

  // 休暇登録処理
  const handleVacationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedDriverId) return

    const driver = drivers.find(d => d.id === parseInt(selectedDriverId))
    if (!driver) return

    // 1日あたりの最大休暇人数制限チェック
    if (vacationType === 'off') {
      const existingVacations = getExistingVacations()
      
      // 全体の制限チェック
      const totalOffToday = existingVacations.length
      if (totalOffToday >= vacationSettings.globalMaxDriversOffPerDay) {
        alert(`この日は既に${vacationSettings.globalMaxDriversOffPerDay}人が休暇を取得しているため、追加で休暇申請できません。`)
        return
      }
      
      // チーム別制限チェック
      const teamOffToday = existingVacations.filter(v => v.team === driver.team).length
      const teamMaxOff = vacationSettings.maxDriversOffPerDay[driver.team] || 0
      if (teamOffToday >= teamMaxOff) {
        alert(`${driver.team}は既に${teamMaxOff}人が休暇を取得しているため、追加で休暇申請できません。`)
        return
      }
    }

    const newRequest: VacationRequest = {
      id: Date.now(),
      driverId: driver.id,
      driverName: driver.name,
      team: driver.team,
      employeeId: driver.employeeId,
      date: selectedDate,
      isOff: vacationType === 'off',
      requestedAt: new Date(),
      isExternalDriver: driver.employeeId.startsWith('E')
    }

    const updatedRequests = [...vacationRequests, newRequest]
    onVacationRequestsChange(updatedRequests)

    // 月間統計を更新
    updateMonthlyStats(driver.id, selectedDate, updatedRequests)

    // フォームリセット
    setShowVacationForm(false)
    setSelectedDriverId('')
    setVacationType('off')

    // 25日に通知をチェック
    if (new Date().getDate() === vacationSettings.notificationDate) {
      checkAndSendNotifications()
    }
  }

  // 休暇削除処理
  const handleVacationDelete = (vacationId: number) => {
    const deletedRequest = vacationRequests.find(req => req.id === vacationId)
    const updatedRequests = vacationRequests.filter(req => req.id !== vacationId)
    onVacationRequestsChange(updatedRequests)
    
    // 月間統計を更新（外部ドライバーは統計に含めない）
    if (deletedRequest && !deletedRequest.isExternalDriver && deletedRequest.isOff) {
      updateMonthlyStats(deletedRequest.driverId, deletedRequest.date, updatedRequests)
    }
  }

  // 月間統計の更新
  const updateMonthlyStats = (driverId: number, date: Date, currentRequests: VacationRequest[]) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    const existingStatIndex = vacationStats.findIndex(stat => 
      stat.driverId === driverId && stat.year === year && stat.month === month
    )

    // その月のドライバーの休暇数を計算（外部ドライバーは除外）
    const monthVacations = currentRequests.filter(req => 
      req.driverId === driverId && 
      req.date.getFullYear() === year && 
      req.date.getMonth() + 1 === month &&
      req.isOff &&
      !req.isExternalDriver
    )

    const totalOffDays = monthVacations.length
    const remainingRequiredDays = Math.max(0, vacationSettings.minimumOffDaysPerMonth - totalOffDays)

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
      requiredMinimumDays: vacationSettings.minimumOffDaysPerMonth,
      remainingRequiredDays,
      maxAllowedDays: vacationSettings.maximumOffDaysPerMonth
    }

    if (existingStatIndex >= 0) {
      const updatedStats = [...vacationStats]
      updatedStats[existingStatIndex] = newStat
      onVacationStatsChange(updatedStats)
    } else {
      onVacationStatsChange([...vacationStats, newStat])
    }
  }

  const checkAndSendNotifications = useCallback(() => {
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    
    currentStats.forEach(stat => {
      if (stat.remainingRequiredDays > 0) {
        const existingNotification = vacationNotifications.find(notif => 
          notif.driverId === stat.driverId && 
          notif.targetMonth === currentMonth &&
          notif.type === 'insufficient_vacation'
        )

        if (!existingNotification) {
          const newNotification: VacationNotification = {
            id: Date.now() + stat.driverId,
            driverId: stat.driverId,
            driverName: stat.driverName,
            team: stat.team,
            type: 'insufficient_vacation',
            message: `${today.getMonth() + 1}月の休暇申請が不足しています。あと${stat.remainingRequiredDays}日休暇を申請してください。`,
            targetMonth: currentMonth,
            remainingDays: stat.remainingRequiredDays,
            sentAt: today,
            isRead: false,
            pushNotificationSent: false
          }

          onVacationNotificationsChange([...vacationNotifications, newNotification])
          sendPushNotification(newNotification)
        }
      }
    })
  }, [currentStats, vacationNotifications, onVacationNotificationsChange, sendPushNotification])

  // 25日の通知チェック
  useEffect(() => {
    const today = new Date()
    if (today.getDate() === vacationSettings.notificationDate) {
      checkAndSendNotifications()
    }
  }, [vacationSettings.notificationDate, checkAndSendNotifications])

  const sendPushNotification = useCallback(async (notification: VacationNotification) => {
    console.log('プッシュ通知送信:', notification.message)
    
    const updatedNotifications = vacationNotifications.map(notif => 
      notif.id === notification.id 
        ? { ...notif, pushNotificationSent: true }
        : notif
    )
    onVacationNotificationsChange(updatedNotifications)
  }, [vacationNotifications, onVacationNotificationsChange])

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
              📌 日付をクリックして休暇登録・削除
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
              const hasVacations = dayInfo.totalOffCount > 0
              
              // 制限チェック
              const isAtGlobalLimit = dayInfo.totalOffCount >= vacationSettings.globalMaxDriversOffPerDay
              const teamLimits = Object.entries(vacationSettings.maxDriversOffPerDay).map(([team, limit]) => {
                const teamOffCount = dayInfo.vacations.filter(v => v.team === team).length
                return {
                  team,
                  limit,
                  current: teamOffCount,
                  isAtLimit: teamOffCount >= limit
                }
              })
              const hasTeamAtLimit = teamLimits.some(t => t.isAtLimit)
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-colors ${
                    isCurrentDate ? 'bg-blue-50 border-blue-300' : 
                    isAtGlobalLimit || hasTeamAtLimit ? 'bg-red-50 border-red-200' :
                    hasVacations ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleDateClick(dayInfo.date)}
                >
                  {/* 日付 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isCurrentDate ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {format(dayInfo.date, 'd')}
                    </span>
                    
                    {/* 制限状況バッジ */}
                    <div className="flex items-center space-x-1">
                      {isAtGlobalLimit && (
                        <span className="px-1 py-0.5 text-xs bg-red-500 text-white rounded">
                          満員
                        </span>
                      )}
                      {hasTeamAtLimit && !isAtGlobalLimit && (
                        <span className="px-1 py-0.5 text-xs bg-orange-500 text-white rounded">
                          チーム満員
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 休暇統計 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">全体:</span>
                      <span className={`font-medium ${
                        isAtGlobalLimit ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {dayInfo.totalOffCount}/{vacationSettings.globalMaxDriversOffPerDay}
                      </span>
                    </div>
                    
                    {teamLimits.map(teamLimit => (
                      <div key={teamLimit.team} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{teamLimit.team}:</span>
                        <span className={`font-medium ${
                          teamLimit.isAtLimit ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {teamLimit.current}/{teamLimit.limit}
                        </span>
                      </div>
                    ))}
                  </div>
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
      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総ドライバー数</p>
              <p className="text-3xl font-bold text-gray-900">{monthlyStats.totalDrivers}</p>
            </div>
            <Users className="h-8 w-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">休暇充足</p>
              <p className="text-3xl font-bold text-green-600">{monthlyStats.driversWithSufficientVacation}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">休暇不足</p>
              <p className="text-3xl font-bold text-red-600">{monthlyStats.driversNeedingVacation}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総休暇日数</p>
              <p className="text-3xl font-bold text-blue-600">{monthlyStats.totalVacationDays}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均休暇日数</p>
              <p className="text-3xl font-bold text-purple-600">{monthlyStats.averageVacationDays}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* ドライバー別統計テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(calendarDate, 'yyyy年MM月', { locale: ja })} ドライバー別休暇統計
            </h3>
            <div className="flex items-center space-x-4">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="all">全チーム</option>
                <option value="Aチーム">Aチーム</option>
              <option value="Bチーム">Bチーム</option>
            </select>
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
                  onClick={() => handleSort('totalOffDays')}
                >
                  <div className="flex items-center space-x-2">
                    <span>現在の休暇日数</span>
                    {sortField === 'totalOffDays' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  必要最低日数
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
                  上限日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortStats(currentStats)
                .filter(stat => teamFilter === 'all' || stat.team === teamFilter)
                .map(stat => (
                <tr key={`${stat.driverId}-${stat.year}-${stat.month}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{stat.driverName}</div>
                      <div className="text-sm text-gray-500">{stat.team} - {stat.employeeId}</div>
                    </div>
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
                    <span className="text-gray-700">{stat.maxAllowedDays}日</span>
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

  // 設定更新処理
  const handleSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    onVacationSettingsChange(editingSettings)
    alert('設定が更新されました。')
  }

  // 設定値の変更処理
  const updateSettingsField = (field: string, value: any) => {
    setEditingSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // チーム別最大休暇人数の更新
  const updateTeamMaxDrivers = (team: string, value: number) => {
    setEditingSettings(prev => ({
      ...prev,
      maxDriversOffPerDay: {
        ...prev.maxDriversOffPerDay,
        [team]: value
      }
    }))
  }

  // 設定画面のレンダリング
  const renderSettingsView = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary-600" />
            休暇管理設定
          </h3>
        </div>
        
        <form onSubmit={handleSettingsUpdate} className="p-6 space-y-8">
          {/* 基本設定 */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">基本設定</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月間最低休暇日数
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingSettings.minimumOffDaysPerMonth}
                  onChange={(e) => updateSettingsField('minimumOffDaysPerMonth', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">ドライバーが1ヶ月に取得すべき最低休暇日数</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月間最大休暇日数
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingSettings.maximumOffDaysPerMonth}
                  onChange={(e) => updateSettingsField('maximumOffDaysPerMonth', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">ドライバーが1ヶ月に取得できる最大休暇日数</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知日（毎月）
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingSettings.notificationDate}
                  onChange={(e) => updateSettingsField('notificationDate', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">休暇不足の通知を送信する日（月の何日か）</p>
              </div>
            </div>
          </div>
          
          {/* 1日あたりの最大休暇人数設定 */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">1日あたりの最大休暇人数設定</h4>
            
            {/* 全体設定 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    全体の1日最大休暇人数
                  </label>
                  <p className="text-xs text-gray-600">
                    全ドライバー（内部・外部含む）で1日に休暇を取得できる最大人数
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingSettings.globalMaxDriversOffPerDay}
                    onChange={(e) => updateSettingsField('globalMaxDriversOffPerDay', parseInt(e.target.value))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">人</span>
                </div>
              </div>
            </div>
            
            {/* チーム別設定 */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">チーム別設定</h5>
              <div className="space-y-4">
                {Object.entries(editingSettings.maxDriversOffPerDay).map(([team, maxCount]) => (
                  <div key={team} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{team}</span>
                      <p className="text-xs text-gray-500">このチームで1日に休暇を取得できる最大人数</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={maxCount}
                        onChange={(e) => updateTeamMaxDrivers(team, parseInt(e.target.value))}
                        className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-600">人</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <strong>注意:</strong> 実際の制限は「全体の最大人数」と「各チームの最大人数の合計」の小さい方が適用されます。
                </div>
              </div>
            </div>
          </div>
          
          {/* 保存ボタン */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingSettings(vacationSettings)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                リセット
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>設定を保存</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  // タブナビゲーション
  const tabs = [
          { id: 'calendar', label: 'カレンダー', icon: Calendar },
    { id: 'stats', label: '月間統計', icon: Users },
    { id: 'settings', label: '設定', icon: Settings },
  ]

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return renderCalendarView()
      case 'stats':
        return renderStatsView()
      case 'notifications':
        return <div>通知管理（実装予定）</div>
      case 'settings':
        return renderSettingsView()
      default:
        return renderCalendarView()
    }
  }

  // ソート処理
  const handleSort = (field: 'driverName' | 'totalOffDays' | 'remainingRequiredDays' | 'team') => {
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

  // 設定値が変更されたときにeditingSettingsも更新
  useEffect(() => {
    setEditingSettings(vacationSettings)
  }, [vacationSettings])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">休暇管理システム</h1>
        <div className="flex items-center space-x-4">
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} の休暇管理
                </h3>
                <button
                  onClick={() => setShowVacationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
      </div>

            <div className="p-6 space-y-6">
              {/* 既存の休暇一覧 */}
              {getExistingVacations().length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">現在の休暇取得者</h4>
                  <div className="space-y-2">
                    {getExistingVacations().map((vacation) => (
                      <div
                        key={vacation.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          vacation.isExternalDriver
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {vacation.driverName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {vacation.team} - {vacation.employeeId}
                              {vacation.isExternalDriver && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  外部
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleVacationDelete(vacation.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
        </div>
      )}

              {/* 新規登録フォーム */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">新規休暇登録</h4>
                <form onSubmit={handleVacationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ドライバー選択
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">ドライバーを選択してください</option>
                      <optgroup label="正社員">
                        {drivers
                          .filter(d => !d.employeeId.startsWith('E'))
                          .map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.team})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="外部ドライバー">
                        {drivers
                          .filter(d => d.employeeId.startsWith('E'))
                          .map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.team})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      種別
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="off"
                          checked={vacationType === 'off'}
                          onChange={(e) => setVacationType(e.target.value as 'off' | 'work')}
                          className="mr-2"
                        />
                        <span>休暇</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="work"
                          checked={vacationType === 'work'}
                          onChange={(e) => setVacationType(e.target.value as 'off' | 'work')}
                          className="mr-2"
                        />
                        <span>出勤</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ※ 登録・削除は即座に反映されます
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>登録</span>
                  </button>
                </form>
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