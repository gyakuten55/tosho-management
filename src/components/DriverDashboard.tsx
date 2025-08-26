'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  Car, 
  Calendar, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Settings,
  LogOut,
  User,
  CalendarCheck,
  Wrench,
  RefreshCw,
  Home,
  X,
  Menu
} from 'lucide-react'
import { Vehicle, DriverNotification, VacationRequest, MonthlyVacationStats, VacationSettings, Driver, InspectionReservation, DepartureTime } from '@/types'
import { getNextInspectionDate } from '@/utils/inspectionUtils'
import DriverVacationCalendar from './DriverVacationCalendar'
import DriverVehicleInfo from './DriverVehicleInfo'
import { VacationService } from '@/services/vacationService'
import { VacationSettingsService } from '@/services/vacationSettingsService'
import { VehicleService } from '@/services/vehicleService'
import { DriverService } from '@/services/driverService'
import { DriverNotificationService } from '@/services/driverNotificationService'
import { InspectionReservationService } from '@/services/inspectionReservationService'
import { DepartureTimeService } from '@/services/departureTimeService'
import { useAuth } from '@/contexts/AuthContext'
import { isSameDay, differenceInDays } from 'date-fns'

interface DriverDashboardProps {
  onLogout: () => void
}

export default function DriverDashboard({ onLogout }: DriverDashboardProps) {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null)
  const [notifications, setNotifications] = useState<DriverNotification[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [monthlyVacationStats, setMonthlyVacationStats] = useState<MonthlyVacationStats | null>(null)
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [vacationSettings, setVacationSettings] = useState<VacationSettings | null>(null)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([])
  const [inspectionReservations, setInspectionReservations] = useState<InspectionReservation[]>([])
  const [departureTimes, setDepartureTimes] = useState<DepartureTime[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('08:00')
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined)

  // データの初期化と定期更新
  useEffect(() => {
    const initializeData = async () => {
      if (!user) return

      try {
        // driversテーブルから運転手情報を取得
        const drivers = await DriverService.getAll()
        const currentDriver = drivers.find(d => d.employeeId === user.employeeId)
        setDriverInfo(currentDriver)
        setAllDrivers(drivers)

        // 休暇設定を取得
        const settings = await VacationSettingsService.get()
        setVacationSettings(settings)

        // 全ての休暇申請データを取得（上限チェック用）
        const allRequests = await VacationService.getAll()
        setAllVacationRequests(allRequests)

        // 点検予約データを取得
        try {
          const reservations = await InspectionReservationService.getAll()
          setInspectionReservations(reservations)
        } catch (reservationError: any) {
          console.warn('Failed to load inspection reservations (table may not exist):', reservationError)
          setInspectionReservations([])
        }

        if (currentDriver) {
          // 休暇申請データを取得
          const requests = await VacationService.getByDriverId(currentDriver.id)
          setVacationRequests(requests)

          // 担当車両を検索（ドライバーは全車両にアクセス権限がないため、担当車両のみを使用）
          try {
            const vehicles = await VehicleService.getAll()
            setAllVehicles(vehicles)
            const userVehicle = vehicles.find(v => v.driver === currentDriver.name)
            if (userVehicle) {
              setAssignedVehicle(userVehicle)
              setSelectedVehicleId(userVehicle.id) // デフォルトで担当車両を選択
            }
          } catch (vehicleError: any) {
            console.warn('Failed to load vehicles (permission denied):', vehicleError)
            // 全車両取得に失敗した場合は空配列を設定し、担当車両のみで動作
            setAllVehicles([])
          }

          // 通知を取得（テーブルが存在しない場合は空配列）
          try {
            const driverNotifications = await DriverNotificationService.getByDriverId(currentDriver.id)
            setNotifications(driverNotifications)
          } catch (notificationError: any) {
            console.warn('Failed to load notifications (table may not exist):', notificationError)
            setNotifications([])
          }

          // 出庫時間を取得
          try {
            const driverDepartureTimes = await DepartureTimeService.getByDriverId(currentDriver.id)
            setDepartureTimes(driverDepartureTimes)
          } catch (departureError: any) {
            console.warn('Failed to load departure times (table may not exist):', departureError)
            setDepartureTimes([])
          }

          // 月間休暇統計の生成
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
          const userVacations = requests.filter(req => 
            req.driverId === currentDriver.id &&
            req.date.getFullYear() === currentYear &&
            req.date.getMonth() + 1 === currentMonth &&
            req.isOff
          )

          setMonthlyVacationStats({
            driverId: currentDriver.id,
            driverName: currentDriver.name,
            team: currentDriver.team,
            employeeId: currentDriver.employeeId,
            year: currentYear,
            month: currentMonth,
            totalOffDays: userVacations.length,
            requiredMinimumDays: 9,
            remainingRequiredDays: Math.max(0, 9 - userVacations.length)
          })
        }
      } catch (error) {
        console.error('Failed to load driver data:', error)
      }
    }

    initializeData()

    // 30秒ごとにデータを更新（管理画面での変更を早期に反映）
    const interval = setInterval(initializeData, 30 * 1000)
    return () => clearInterval(interval)
  }, [user])

  // 指定日付とチームに対する休暇上限を取得する関数
  const getVacationLimitForDate = (date: Date, team: string): number => {
    if (!vacationSettings) return 3 // デフォルト値
    
    const month = date.getMonth() + 1 // 1-12
    const weekday = date.getDay() // 0-6（日曜日=0）

    console.log('Getting vacation limit:', { date, team, month, weekday, vacationSettings })

    // 1. チーム別月別曜日設定
    if (vacationSettings.teamMonthlyWeekdayLimits?.[team]?.[month]?.[weekday] !== undefined) {
      const limit = vacationSettings.teamMonthlyWeekdayLimits[team][month][weekday]
      console.log('Using team monthly weekday limit:', limit)
      return limit
    }

    // 2. 旧設定からのフォールバック（後方互換性）
    if (vacationSettings.maxDriversOffPerDay?.[team] !== undefined) {
      const limit = vacationSettings.maxDriversOffPerDay[team]
      console.log('Using legacy team limit:', limit)
      return limit
    }

    // 3. デフォルト値
    const defaultLimit = vacationSettings.globalMaxDriversOffPerDay || 3
    console.log('Using default limit:', defaultLimit)
    return defaultLimit
  }

  const handleVacationRequest = async (request: Omit<VacationRequest, 'id' | 'requestDate'>) => {
    try {
      // 休暇申請の場合のみ上限チェックを行う
      if (request.workStatus === 'day_off' && !request.isExternalDriver && vacationSettings && driverInfo) {
        // その日の既存の休暇数をカウント（同じチーム、外部ドライバーを除く）
        const existingVacations = allVacationRequests.filter(req => 
          isSameDay(req.date, request.date) && 
          req.workStatus === 'day_off' && 
          req.team === request.team &&
          !req.isExternalDriver
        )
        
        // 上限を取得
        const vacationLimit = getVacationLimitForDate(request.date, request.team)
        
        // デバッグ情報を表示
        console.log('Vacation limit check:', {
          date: request.date,
          team: request.team,
          existingCount: existingVacations.length,
          limit: vacationLimit,
          existingVacations: existingVacations.map(v => ({ name: v.driverName, date: v.date }))
        })
        
        // 上限チェック（0人制限の場合は即座に拒否、それ以外は既存数で判定）
        if (vacationLimit === 0) {
          alert(`この日は休暇申請が禁止されています。（${request.team}の上限: 0人）`)
          return
        } else if (existingVacations.length >= vacationLimit) {
          alert(`この日は既に${vacationLimit}人が休暇を取得しています。（${request.team}の上限: ${vacationLimit}人）`)
          return
        }
      }

      const newRequest = await VacationService.create({
        ...request,
        requestDate: new Date()
      })
      setVacationRequests(prev => [...prev, newRequest])
      setAllVacationRequests(prev => [...prev, newRequest])
    } catch (error) {
      console.error('Failed to create vacation request:', error)
    }
  }

  const handleVacationDelete = async (requestId: number) => {
    try {
      await VacationService.delete(requestId)
      setVacationRequests(prev => prev.filter(req => req.id !== requestId))
      setAllVacationRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      console.error('Failed to delete vacation request:', error)
    }
  }

  const handleNotificationRead = async (notificationId: number) => {
    try {
      await DriverNotificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (error) {
      console.warn('Failed to mark notification as read (table may not exist):', error)
    }
  }

  const handleAllNotificationsRead = async () => {
    if (!driverInfo) return
    
    try {
      await DriverNotificationService.markAllAsReadByDriverId(driverInfo.id)
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
    } catch (error) {
      console.warn('Failed to mark all notifications as read (table may not exist):', error)
    }
  }

  const handleNotificationDelete = async (notificationId: number) => {
    try {
      await DriverNotificationService.delete(notificationId)
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.warn('Failed to delete notification (table may not exist):', error)
    }
  }

  const handleAllNotificationsDelete = async () => {
    if (!driverInfo) return
    
    if (!confirm('すべての通知を削除しますか？')) return
    
    try {
      await DriverNotificationService.deleteAllByDriverId(driverInfo.id)
      setNotifications([])
    } catch (error) {
      console.warn('Failed to delete all notifications (table may not exist):', error)
    }
  }

  const formatTime = (date: Date | undefined) => {
    if (!date) return '--:--'
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  // 点検実施日までの日数を計算するヘルパー関数
  const getInspectionCountdown = () => {
    if (!assignedVehicle || !driverInfo) return null

    // 担当車両の点検予約を取得（キャンセル済みを除外）
    const vehicleInspections = inspectionReservations.filter(inspection => 
      inspection.vehicleId === assignedVehicle.id && 
      inspection.status === 'scheduled' && // キャンセル済み（cancelled）を除外
      inspection.scheduledDate >= new Date() // 今日以降の予約のみ
    )

    if (vehicleInspections.length === 0) return null

    // 最も近い点検予約を取得
    const nextInspection = vehicleInspections
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0]

    const today = new Date()
    today.setHours(0, 0, 0, 0) // 時間をリセットして日付のみで比較
    const inspectionDate = new Date(nextInspection.scheduledDate)
    inspectionDate.setHours(0, 0, 0, 0) // 時間をリセットして日付のみで比較
    const daysUntilInspection = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // 10日前からカウントダウンを表示
    if (daysUntilInspection <= 10 && daysUntilInspection >= 0) {
      // memoから日付範囲情報を抽出
      const memo = nextInspection.memo || ''
      const dateRangeMatch = memo.match(/日付範囲: (\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/)
      let displayMemo = memo
      let displayDate = inspectionDate
      let dateRangeText = ''
      
      if (dateRangeMatch) {
        const [, startDateStr, endDateStr] = dateRangeMatch
        const startDate = new Date(startDateStr + 'T00:00:00')
        const endDate = new Date(endDateStr + 'T00:00:00')
        
        // 日付範囲情報をメモから除去
        displayMemo = memo.replace(/日付範囲: \d{4}-\d{2}-\d{2} ~ \d{4}-\d{2}-\d{2}\n?/, '').trim()
        
        // 開始日を表示用の日付として使用
        displayDate = startDate
        
        // 日付範囲テキストを生成
        if (startDate.getTime() === endDate.getTime()) {
          dateRangeText = ''
        } else {
          dateRangeText = `${startDate.toLocaleDateString('ja-JP')} ~ ${endDate.toLocaleDateString('ja-JP')}`
        }
      }
      
      return {
        daysLeft: daysUntilInspection,
        inspectionDate: displayDate,
        vehiclePlateNumber: nextInspection.vehiclePlateNumber,
        memo: displayMemo,
        dateRange: dateRangeText
      }
    }

    return null
  }

  const getCountdownColor = (daysLeft: number) => {
    if (daysLeft === 0) return 'bg-red-100 text-red-800 border-red-200'
    if (daysLeft <= 3) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (daysLeft <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">おはようございます</h1>
            <p className="text-gray-600 text-sm sm:text-base font-medium">{user?.displayName}さん（{user?.team}）</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">社員番号: {user?.employeeId}</p>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-3">
            <div className="relative">
              <button className="p-2 rounded-full hover:bg-gray-100 touch-manipulation transition-colors">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 hover:text-blue-600" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 min-h-[44px] touch-manipulation shadow-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm sm:text-base font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* 通知パネル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            <span>通知</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-2">
            {notifications.filter(n => !n.isRead).length > 0 && (
              <button
                onClick={handleAllNotificationsRead}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 py-2 px-3 rounded-lg hover:bg-blue-50 touch-manipulation font-medium"
              >
                すべて既読
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleAllNotificationsDelete}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 py-2 px-3 rounded-lg hover:bg-red-50 touch-manipulation font-medium"
              >
                すべて削除
              </button>
            )}
          </div>
        </div>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg border cursor-pointer touch-manipulation ${
                notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`} onClick={() => !notification.isRead && handleNotificationRead(notification.id)}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{notification.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full self-start ${
                        notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority === 'urgent' ? '緊急' :
                         notification.priority === 'high' ? '重要' :
                         notification.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">{notification.message}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 space-y-2 sm:space-y-0">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString('ja-JP') : ''}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          notification.type === 'vehicle_inspection' ? 'bg-orange-100 text-orange-800' :
                          notification.type === 'vehicle_assignment' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'vacation_status' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type === 'vehicle_inspection' ? '点検' :
                           notification.type === 'vehicle_assignment' ? '車両' :
                           notification.type === 'vacation_status' ? '休暇' : 'お知らせ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 sm:ml-4">
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('この通知を削除しますか？')) {
                          handleNotificationDelete(notification.id)
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 touch-manipulation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">新しい通知はありません</p>
        )}
      </div>

      {/* 点検実施日カウントダウン */}
      {(() => {
        const countdown = getInspectionCountdown()
        if (!countdown) return null
        
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              点検実施日カウントダウン
            </h2>
            <div className={`p-4 rounded-lg border ${getCountdownColor(countdown.daysLeft)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Car className="h-6 w-6" />
                  <span className="font-bold text-lg">{countdown.vehiclePlateNumber}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {countdown.daysLeft === 0 ? '当日' : `あと${countdown.daysLeft}日`}
                  </div>
                  <div className="text-sm opacity-75">
                    {countdown.dateRange ? (
                      <div>
                        <div>{countdown.inspectionDate.toLocaleDateString('ja-JP', { 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'short'
                        })}〜</div>
                        <div className="text-xs">{countdown.dateRange}</div>
                      </div>
                    ) : (
                      countdown.inspectionDate.toLocaleDateString('ja-JP', { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium mb-1">
                  {countdown.daysLeft === 0 ? 
                    '🚨 本日は点検実施日です' : 
                    `📅 点検実施日まで${countdown.daysLeft}日`
                  }
                </div>
                {countdown.memo && (
                  <div className="text-xs opacity-75 mt-2">
                    備考: {countdown.memo}
                  </div>
                )}
                {countdown.dateRange && (
                  <div className="text-xs opacity-75 mt-1">
                    期間: {countdown.dateRange}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 今日の情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 担当車両情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-blue-600" />
            <span>担当車両</span>
          </h2>
          {user?.team === 'Bチーム' ? (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="font-semibold text-orange-900 text-sm sm:text-base">都度車両割り当て</span>
              </div>
              <p className="text-orange-800 text-xs sm:text-sm mb-3 leading-relaxed">
                Bチームのドライバーは固定の担当車両を持ちません。管理者が車両運用管理画面で必要に応じて車両を割り当てます。
              </p>
              <div className="bg-orange-200 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm text-orange-800 font-medium text-center">
                  📞 本日の車両割り当てについては管理者にお尋ねください
                </div>
              </div>
            </div>
          ) : assignedVehicle ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-3">
                  <span className="text-xl sm:text-2xl font-bold text-blue-700">{assignedVehicle.plateNumber}</span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                    assignedVehicle.status === 'normal' ? 'bg-green-500 text-white' :
                    assignedVehicle.status === 'inspection' ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {assignedVehicle.status === 'normal' ? '稼働中' :
                     assignedVehicle.status === 'inspection' ? '点検中' : '修理中'}
                  </span>
                </div>
                <p className="text-blue-800 font-semibold text-sm sm:text-base mb-3">{assignedVehicle.model}</p>
                <div className="flex items-center text-xs sm:text-sm text-blue-700">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">{assignedVehicle.garage}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm text-gray-600 font-semibold">次回点検予定</span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">
                    {getNextInspectionDate(assignedVehicle.inspectionDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('vehicle')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 min-h-[48px] touch-manipulation text-sm sm:text-base font-bold shadow-md transition-all duration-200"
              >
                🚗 車両詳細を見る
              </button>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Car className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm sm:text-base">担当車両が割り当てられていません</p>
            </div>
          )}
        </div>

      </div>


      {/* クイックアクション */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => setCurrentView('vacation')}
            className="flex items-center justify-center space-x-2 bg-green-100 text-green-800 p-3 sm:p-4 rounded-lg hover:bg-green-200 transition-colors min-h-[48px] touch-manipulation"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm sm:text-base">休暇申請</span>
          </button>
          <button
            onClick={() => setCurrentView('vehicle')}
            className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-800 p-3 sm:p-4 rounded-lg hover:bg-blue-200 transition-colors min-h-[48px] touch-manipulation"
          >
            <Car className="h-5 w-5" />
            <span className="text-sm sm:text-base">車両情報</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderVacationRequest = () => (
    <DriverVacationCalendar
      key={`calendar-${allVacationRequests.length}-${vacationRequests.length}`}
      currentUser={driverInfo}
      existingRequests={vacationRequests}
      monthlyStats={monthlyVacationStats}
      vacationSettings={vacationSettings}
      allVacationRequests={allVacationRequests}
      onRequestSubmit={handleVacationRequest}
      onRequestDelete={handleVacationDelete}
    />
  )

  const renderVehicleInfo = () => (
    <DriverVehicleInfo
      assignedVehicle={assignedVehicle!}
    />
  )

  const renderDepartureTime = () => {
    const timeOptions = DepartureTimeService.generateTimeOptions()
    
    const handleDepartureTimeSubmit = async () => {
      if (!driverInfo) return

      // 選択された車両を取得（全車両リストまたは担当車両から）
      const selectedVehicle = selectedVehicleId 
        ? (allVehicles.length > 0 ? allVehicles.find(v => v.id === selectedVehicleId) : assignedVehicle)
        : null

      try {
        // 既存の出庫時間があるかチェック
        const existingTime = await DepartureTimeService.getByDriverAndDate(driverInfo.id, selectedDate)
        
        if (existingTime) {
          // 更新
          await DepartureTimeService.update(existingTime.id, {
            departureTime: selectedTime,
            vehicleId: selectedVehicle?.id,
            vehiclePlateNumber: selectedVehicle?.plateNumber
          })
        } else {
          // 新規作成
          await DepartureTimeService.create({
            driverId: driverInfo.id,
            driverName: driverInfo.name,
            employeeId: driverInfo.employeeId,
            vehicleId: selectedVehicle?.id,
            vehiclePlateNumber: selectedVehicle?.plateNumber,
            departureDate: selectedDate,
            departureTime: selectedTime
          })
        }

        // データを再読み込み
        const updatedDepartureTimes = await DepartureTimeService.getByDriverId(driverInfo.id)
        setDepartureTimes(updatedDepartureTimes)
        
        alert('出庫時間を登録しました')
      } catch (error) {
        console.error('Failed to register departure time:', error)
        alert('出庫時間の登録に失敗しました')
      }
    }

    const handleDelete = async (id: number) => {
      if (!confirm('この出庫時間を削除しますか？')) return

      try {
        await DepartureTimeService.delete(id)
        const updatedDepartureTimes = await DepartureTimeService.getByDriverId(driverInfo.id)
        setDepartureTimes(updatedDepartureTimes)
        alert('出庫時間を削除しました')
      } catch (error) {
        console.error('Failed to delete departure time:', error)
        alert('出庫時間の削除に失敗しました')
      }
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* 出庫時間登録フォーム */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            出庫時間登録
          </h2>
          
          <div className="space-y-4">
            {/* 日付選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付を選択
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            {/* 時間選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出庫時間を選択（15分刻み）
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* 車両選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用車両を選択
              </label>
              {allVehicles.length > 0 ? (
                <select
                  value={selectedVehicleId || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">車両を選択してください</option>
                  {allVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.model}) - {vehicle.team}
                      {vehicle.id === assignedVehicle?.id ? ' [担当車両]' : ''}
                    </option>
                  ))}
                </select>
              ) : assignedVehicle ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">担当車両</p>
                  <p className="font-medium text-gray-900">{assignedVehicle.plateNumber} ({assignedVehicle.model})</p>
                  <input type="hidden" value={assignedVehicle.id} />
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">担当車両が設定されていません</p>
                </div>
              )}
            </div>

            {/* 登録ボタン */}
            <button
              onClick={handleDepartureTimeSubmit}
              className="w-full bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] touch-manipulation text-base font-medium"
            >
              出庫時間を登録
            </button>
          </div>
        </div>

        {/* 登録済み出庫時間一覧 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            登録済み出庫時間
          </h2>
          
          {departureTimes.length > 0 ? (
            <div className="space-y-3">
              {departureTimes.slice(0, 10).map(depTime => (
                <div key={depTime.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {depTime.departureDate.toLocaleDateString('ja-JP')}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {depTime.departureTime}
                      </span>
                      {depTime.vehiclePlateNumber && (
                        <span className="text-sm text-gray-600">
                          車両: {depTime.vehiclePlateNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(depTime.id)}
                    className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 min-h-[44px] touch-manipulation self-end sm:self-auto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">登録された出庫時間はありません</p>
          )}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'vacation':
        return renderVacationRequest()
      case 'vehicle':
        return assignedVehicle ? renderVehicleInfo() : (
          <div className="text-center py-8">
            <p className="text-gray-500">担当車両が割り当てられていません</p>
          </div>
        )
      case 'departure':
        return renderDepartureTime()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>ダッシュボード</span>
            </button>
            <button
              onClick={() => setCurrentView('vacation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'vacation' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>休暇申請</span>
            </button>
            <button
              onClick={() => setCurrentView('vehicle')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>車両情報</span>
            </button>
            <button
              onClick={() => setCurrentView('departure')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'departure' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>出庫時間</span>
            </button>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.displayName}さん</span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* デスクトップユーザー情報 */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.displayName}さん</span>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <button
                onClick={() => {
                  setCurrentView('dashboard')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>ダッシュボード</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('vacation')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  currentView === 'vacation' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>休暇申請</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('vehicle')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  currentView === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Car className="h-5 w-5" />
                <span>車両情報</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('departure')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left ${
                  currentView === 'departure' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-5 w-5" />
                <span>出庫時間</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {renderContent()}
      </main>
    </div>
  )
} 