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
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { VacationRequest, MonthlyVacationStats, VacationSettings, VacationNotification, Driver, Vehicle } from '@/types'

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
  vacationRequests: VacationRequest[]
  vacationStats: MonthlyVacationStats[]
  vacationSettings: VacationSettings
  vacationNotifications: VacationNotification[]
  drivers: Driver[]
  vehicles: Vehicle[]
  onVacationRequestsChange: (requests: VacationRequest[]) => void
  onVacationStatsChange: (stats: MonthlyVacationStats[]) => void
  onVacationSettingsChange: (settings: VacationSettings) => void
  onVacationNotificationsChange: (notifications: VacationNotification[]) => void
  onVehiclesChange: (vehicles: Vehicle[]) => void
}

export default function VacationManagement({
  vacationRequests,
  vacationStats,
  vacationSettings,
  vacationNotifications,
  drivers,
  vehicles,
  onVacationRequestsChange,
  onVacationStatsChange,
  onVacationSettingsChange,
  onVacationNotificationsChange,
  onVehiclesChange
}: VacationManagementProps) {
  const [currentView, setCurrentView] = useState('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<'working' | 'day_off' | 'night_shift'>('day_off')
  

  // ソート用のstate
  const [sortField, setSortField] = useState<'driverName' | 'totalOffDays' | 'remainingRequiredDays' | 'team'>('driverName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 初期化時に月間統計を再計算と古いデータの削除
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
            req.workStatus === 'day_off' &&
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

    // 1年以上前の休暇データを自動削除
    const cleanupOldVacationData = () => {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      const filteredRequests = vacationRequests.filter(request => 
        request.date >= oneYearAgo
      )
      
      if (filteredRequests.length !== vacationRequests.length) {
        const deletedCount = vacationRequests.length - filteredRequests.length
        onVacationRequestsChange(filteredRequests)
        console.log(`古い休暇データを自動削除しました: ${deletedCount}件`)
      }
    }
    
    if (drivers.length > 0) {
      recalculateAllStats()
      cleanupOldVacationData()
    }
  }, [drivers, vacationRequests, vacationSettings, onVacationStatsChange, onVacationRequestsChange])

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
            id: Date.now() + stat.driverId,
            driverId: stat.driverId,
            driverName: stat.driverName,
            type: 'vacation_reminder',
            message: `あと${stat.remainingRequiredDays}日の休暇申請が必要です。月末までに申請してください。`,
            date: today,
            isRead: false,
            priority: 'high'
          }
          
          onVacationNotificationsChange([...vacationNotifications, notification])
        })
      }
    }
    
    checkAndSendNotifications()
  }, [vacationStats, vacationNotifications, onVacationNotificationsChange])

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
        workingDrivers: dayWorking.map(v => ({
          driverId: v.driverId,
          driverName: v.driverName,
          team: v.team,
          isExternalDriver: v.isExternalDriver
        })),
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

  // ドライバー名から担当車両を取得するヘルパー関数
  const getVehicleByDriverName = (driverName: string) => {
    return vehicles.find(vehicle => vehicle.driver === driverName)
  }

  // セルクリック時の処理
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowVacationForm(true)
    setSelectedDriverId('')
    setSelectedWorkStatus('day_off')
  }



  // 勤務状態登録処理（出勤・休暇・夜勤）
  const handleVacationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedDriverId) {
      alert('日付とドライバーを選択してください。')
      return
    }

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

    // 既存の勤務状態設定があるかチェック
    const existingRequest = vacationRequests.find(req =>
      req.driverId === driver.id && isSameDay(req.date, selectedDate)
    )

    // 1日あたりの最大休暇人数制限チェック（休暇の場合のみ）
    if (selectedWorkStatus === 'day_off') {
      const existingVacations = getExistingVacations()
      const existingInternalVacations = existingVacations.filter(v => !v.isExternalDriver)
      
      if (!driver.employeeId.startsWith('E') && existingInternalVacations.length >= vacationSettings.globalMaxDriversOffPerDay) {
        alert(`この日は既に${vacationSettings.globalMaxDriversOffPerDay}人が休暇を取得しています。`)
        return
      }
    }

    const newRequest: VacationRequest = {
      id: existingRequest ? existingRequest.id : Date.now(),
      driverId: driver.id,
      driverName: driver.name,
      team: driver.team,
      employeeId: driver.employeeId,
      date: selectedDate,
      workStatus: selectedWorkStatus,
      isOff: selectedWorkStatus === 'day_off',
      type: selectedWorkStatus,
      reason: '', // 理由は不要
      status: 'approved', // 承認機能なしなので即承認
      requestDate: new Date(),
      isExternalDriver: driver.employeeId.startsWith('E')
    }

    let updatedRequests: VacationRequest[]
    if (existingRequest) {
      // 既存の設定を更新
      updatedRequests = vacationRequests.map(req => 
        req.id === existingRequest.id ? newRequest : req
      )
    } else {
      // 新規追加
      updatedRequests = [...vacationRequests, newRequest]
    }

    onVacationRequestsChange(updatedRequests)
    
    // 統計を更新
    updateMonthlyStats(driver.id, selectedDate, updatedRequests)
    
    setShowVacationForm(false)
    setSelectedDate(null)
    setSelectedDriverId('')
    setSelectedWorkStatus('day_off')
  }

  // 全員一括設定処理
  const handleBulkWorkStatus = (workStatus: 'working' | 'day_off', confirmMessage: string) => {
    if (!selectedDate) return
    
    if (!confirm(confirmMessage)) return

    // その日のすべての既存設定を削除
    let updatedRequests = vacationRequests.filter(req => 
      !isSameDay(req.date, selectedDate)
    )

    // 指定された勤務状態で全ドライバーを設定
    drivers.forEach(driver => {
      const newRequest: VacationRequest = {
        id: Date.now() + driver.id + Math.random(), // ユニークなID生成
        driverId: driver.id,
        driverName: driver.name,
        team: driver.team,
        employeeId: driver.employeeId,
        date: selectedDate,
        workStatus: workStatus,
        isOff: workStatus === 'day_off',
        type: workStatus,
        reason: '一括設定',
        status: 'approved',
        requestDate: new Date(),
        isExternalDriver: driver.employeeId.startsWith('E')
      }
      updatedRequests.push(newRequest)
    })

    onVacationRequestsChange(updatedRequests)

    // 全ドライバーの統計を更新
    drivers.forEach(driver => {
      updateMonthlyStats(driver.id, selectedDate, updatedRequests)
    })

    // フォームをリセット
    setSelectedDriverId('')
    setSelectedWorkStatus('day_off')
  }

  // 休暇削除処理
  const handleVacationDelete = (vacationId: number) => {
    const vacationToDelete = vacationRequests.find(req => req.id === vacationId)
    if (!vacationToDelete) return

    const updatedRequests = vacationRequests.filter(req => req.id !== vacationId)
    onVacationRequestsChange(updatedRequests)
    
    // 統計を更新
    updateMonthlyStats(vacationToDelete.driverId, vacationToDelete.date, updatedRequests)
  }

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
      req.workStatus === 'day_off' &&
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
                    </span>
                  </div>

                  {/* 勤務状態の表示（人数のみ） - 現在の月のみ表示 */}
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      {/* 出勤者数 */}
                      {dayInfo.workingCount > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-green-600">
                            出勤: {dayInfo.workingCount}人
                          </span>
                        </div>
                      )}
                      
                      {/* 休暇者数 */}
                      {dayInfo.internalDriverOffCount > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-red-600">
                            休暇: {dayInfo.internalDriverOffCount}人
                          </span>
                        </div>
                      )}
                      
                      {/* 夜勤者数 */}
                      {dayInfo.nightShiftCount > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-blue-600">
                            夜勤: {dayInfo.nightShiftCount}人
                          </span>
                        </div>
                      )}
                      
                      {/* 外部ドライバーの休暇 */}
                      {dayInfo.externalDriverOffCount > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-purple-600">
                            外部休: {dayInfo.externalDriverOffCount}人
                          </span>
                        </div>
                      )}
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
            <div className="text-sm text-gray-600">
              ※ 外部ドライバーは統計に含まれません
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
                  {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} の勤務状態管理
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
              {/* 一括設定ボタン */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">一括設定</h4>
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

              {/* 既存の勤務状態一覧 */}
              {getWorkStatusForDate(selectedDate).length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">現在の勤務状態</h4>
                  <div className="space-y-2">
                    {getWorkStatusForDate(selectedDate).map((workStatus) => (
                      <div
                        key={workStatus.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          workStatus.workStatus === 'day_off'
                            ? workStatus.isExternalDriver
                              ? 'bg-purple-50 border-purple-200'
                              : 'bg-red-50 border-red-200'
                            : workStatus.workStatus === 'night_shift'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            workStatus.workStatus === 'day_off'
                              ? 'bg-red-500'
                              : workStatus.workStatus === 'night_shift'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {workStatus.driverName}
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                workStatus.workStatus === 'day_off'
                                  ? 'bg-red-100 text-red-800'
                                  : workStatus.workStatus === 'night_shift'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {workStatus.workStatus === 'day_off' ? '休暇' : workStatus.workStatus === 'night_shift' ? '夜勤' : '出勤'}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {workStatus.team} - {workStatus.employeeId}
                              {workStatus.isExternalDriver && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  外部
                                </span>
                              )}
                            </p>
                            {(() => {
                              const assignedVehicle = getVehicleByDriverName(workStatus.driverName)
                              return assignedVehicle && (
                                <p className="text-sm text-blue-600 mt-1">
                                  🚗 担当車両: {assignedVehicle.plateNumber} ({assignedVehicle.model})
                                </p>
                              )
                            })()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleVacationDelete(workStatus.id)}
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
                <h4 className="text-md font-semibold text-gray-900 mb-3">勤務状態設定</h4>
                <form onSubmit={handleVacationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      勤務状態
                    </label>
                    <select
                      value={selectedWorkStatus}
                      onChange={(e) => setSelectedWorkStatus(e.target.value as 'working' | 'day_off' | 'night_shift')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="working">出勤</option>
                      <option value="day_off">休暇</option>
                      <option value="night_shift">夜勤</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ドライバー選択
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={drivers.length === 0}
                    >
                      <option value="">
                        {drivers.length === 0 ? 'ドライバーが登録されていません' : 'ドライバーを選択してください'}
                      </option>
                      {drivers.length > 0 && (
                        <>
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
                        </>
                      )}
                    </select>
                    {drivers.length === 0 && (
                      <div className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium">⚠️ ドライバーが登録されていません</p>
                        <p className="mt-1">勤務状態を設定するには、まず「ドライバー管理」画面でドライバーを登録してください。</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ※ 勤務状態の設定・変更は即座に反映されます<br/>
                      ※ 既存の設定がある場合は上書きされます
                    </p>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                      selectedWorkStatus === 'day_off'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : selectedWorkStatus === 'night_shift'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {selectedWorkStatus === 'day_off' ? '休暇設定' : 
                       selectedWorkStatus === 'night_shift' ? '夜勤設定' : '出勤設定'}
                    </span>
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