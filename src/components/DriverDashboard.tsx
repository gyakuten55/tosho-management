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
  X
} from 'lucide-react'
import { Vehicle, DriverNotification, VacationRequest, InspectionSchedule, MonthlyVacationStats, VacationSettings, Driver, InspectionReservation, DepartureTime } from '@/types'
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
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null)
  const [notifications, setNotifications] = useState<DriverNotification[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [upcomingInspections, setUpcomingInspections] = useState<InspectionSchedule[]>([])
  const [monthlyVacationStats, setMonthlyVacationStats] = useState<MonthlyVacationStats | null>(null)
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [vacationSettings, setVacationSettings] = useState<VacationSettings | null>(null)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([])
  const [inspectionReservations, setInspectionReservations] = useState<InspectionReservation[]>([])
  const [departureTimes, setDepartureTimes] = useState<DepartureTime[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('08:00')

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

          // 割り当て車両を検索（運転手名で検索）
          const vehicles = await VehicleService.getAll()
          const userVehicle = vehicles.find(v => v.driver === currentDriver.name)
          if (userVehicle) {
            setAssignedVehicle(userVehicle)

            // 点検予定を生成
            const nextInspectionDate = getNextInspectionDate(userVehicle.inspectionDate)
            const today = new Date()
            const diffTime = nextInspectionDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            let inspectionStatus: 'urgent' | 'warning' | 'normal' = 'normal'
            if (diffDays <= 7) inspectionStatus = 'urgent'
            else if (diffDays <= 30) inspectionStatus = 'warning'

            setUpcomingInspections([
              {
                id: userVehicle.id,
                vehicleId: userVehicle.id,
                vehicleNumber: userVehicle.plateNumber,
                type: '定期点検',
                date: nextInspectionDate,
                status: inspectionStatus,
                driver: user?.displayName || '',
                team: user?.team || ''
              }
            ])

            // 点検日が近い場合は自動で通知を生成
            if (diffDays <= 14) {
              try {
                await DriverNotificationService.createVehicleInspectionNotification(
                  currentDriver.id,
                  userVehicle.plateNumber,
                  nextInspectionDate,
                  currentDriver.name,
                  currentDriver.employeeId
                )
              } catch (notificationError) {
                console.warn('Failed to create inspection notification:', notificationError)
              }
            }
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
      return {
        daysLeft: daysUntilInspection,
        inspectionDate: nextInspection.scheduledDate,
        vehiclePlateNumber: nextInspection.vehiclePlateNumber,
        memo: nextInspection.memo
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
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">おはようございます</h1>
          <p className="text-gray-600">{user?.displayName}さん（{user?.team}）</p>
          <p className="text-sm text-gray-500">社員番号: {user?.employeeId}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-500 hover:text-primary-600 cursor-pointer" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* 通知パネル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            通知
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-3">
            {notifications.filter(n => !n.isRead).length > 0 && (
              <button
                onClick={handleAllNotificationsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                すべて既読
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleAllNotificationsDelete}
                className="text-sm text-red-600 hover:text-red-800"
              >
                すべて削除
              </button>
            )}
          </div>
        </div>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg border cursor-pointer ${
                notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`} onClick={() => !notification.isRead && handleNotificationRead(notification.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
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
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
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
                  <div className="flex items-center space-x-2 ml-4">
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
                      className="text-gray-400 hover:text-red-600 transition-colors"
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
                    {countdown.inspectionDate.toLocaleDateString('ja-JP', { 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'short'
                    })}
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
              </div>
            </div>
          </div>
        )
      })()}

      {/* 今日の情報カード */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 担当車両情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-blue-600" />
            担当車両
          </h2>
          {user?.team === 'Bチーム' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Car className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">都度車両割り当て</span>
              </div>
              <p className="text-orange-700 text-sm mb-3">
                Bチームのドライバーは固定の担当車両を持ちません。<br />
                管理者が車両運用管理画面で必要に応じて車両を割り当てます。
              </p>
              <div className="text-sm text-orange-600">
                本日の車両割り当てについては管理者にお尋ねください。
              </div>
            </div>
          ) : assignedVehicle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-700">{assignedVehicle.plateNumber}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assignedVehicle.status === 'normal' ? 'bg-green-100 text-green-800' :
                  assignedVehicle.status === 'inspection' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assignedVehicle.status === 'normal' ? '稼働中' :
                   assignedVehicle.status === 'inspection' ? '点検中' : '修理中'}
                </span>
              </div>
              <p className="text-gray-600">{assignedVehicle.model}</p>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {assignedVehicle.garage}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">次回点検予定</span>
                  <span className="font-medium">
                    {getNextInspectionDate(assignedVehicle.inspectionDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('vehicle')}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                車両詳細を見る
              </button>
            </div>
          ) : (
            <p className="text-gray-500">担当車両が割り当てられていません</p>
          )}
        </div>

        {/* 点検予定 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-orange-600" />
            点検予定
          </h2>
          {upcomingInspections.length > 0 ? (
            <div className="space-y-3">
              {upcomingInspections.map(inspection => (
                <div key={inspection.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{inspection.vehicleNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inspection.status === 'urgent' ? 'bg-red-100 text-red-800' :
                      inspection.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inspection.status === 'urgent' ? '緊急' :
                       inspection.status === 'warning' ? '警告' : '正常' }
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{inspection.type}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">予定日</span>
                    <span className="font-medium">{inspection.date.toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">近日の点検予定はありません</p>
          )}
        </div>
      </div>


      {/* クイックアクション */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentView('vacation')}
            className="flex items-center justify-center space-x-2 bg-green-100 text-green-800 p-4 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>休暇申請</span>
          </button>
          <button
            onClick={() => setCurrentView('vehicle')}
            className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Car className="h-5 w-5" />
            <span>車両情報</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderVacationRequest = () => (
    <DriverVacationCalendar
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
      upcomingInspections={upcomingInspections}
    />
  )

  const renderDepartureTime = () => {
    const timeOptions = DepartureTimeService.generateTimeOptions()
    
    const handleDepartureTimeSubmit = async () => {
      if (!driverInfo) return

      try {
        // 既存の出庫時間があるかチェック
        const existingTime = await DepartureTimeService.getByDriverAndDate(driverInfo.id, selectedDate)
        
        if (existingTime) {
          // 更新
          await DepartureTimeService.update(existingTime.id, {
            departureTime: selectedTime,
            vehicleId: assignedVehicle?.id,
            vehiclePlateNumber: assignedVehicle?.plateNumber
          })
        } else {
          // 新規作成
          await DepartureTimeService.create({
            driverId: driverInfo.id,
            driverName: driverInfo.name,
            employeeId: driverInfo.employeeId,
            vehicleId: assignedVehicle?.id,
            vehiclePlateNumber: assignedVehicle?.plateNumber,
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
      <div className="space-y-6">
        {/* 出庫時間登録フォーム */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* 担当車両表示 */}
            {assignedVehicle && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">担当車両</p>
                <p className="font-medium text-gray-900">{assignedVehicle.plateNumber} ({assignedVehicle.model})</p>
              </div>
            )}

            {/* 登録ボタン */}
            <button
              onClick={handleDepartureTimeSubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              出庫時間を登録
            </button>
          </div>
        </div>

        {/* 登録済み出庫時間一覧 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            登録済み出庫時間
          </h2>
          
          {departureTimes.length > 0 ? (
            <div className="space-y-3">
              {departureTimes.slice(0, 10).map(depTime => (
                <div key={depTime.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">
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
                    className="text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50"
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
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>ダッシュボード</span>
            </button>
            <button
              onClick={() => setCurrentView('vacation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'vacation' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>休暇申請</span>
            </button>
            <button
              onClick={() => setCurrentView('vehicle')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>車両情報</span>
            </button>
            <button
              onClick={() => setCurrentView('departure')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'departure' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>出庫時間</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.displayName}さん</span>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  )
} 