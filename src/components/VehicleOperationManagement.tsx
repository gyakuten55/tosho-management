'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  UserCheck,
  Wrench,
  AlertCircle,
  RotateCcw,
  Plus,
  X,
  Save,
  Clock,
  Car,
  User,
  Info
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Vehicle,
  Driver,
  VacationRequest,
  VehicleOperationStatus,
  VehicleAssignmentChange,
  DriverVehicleNotification,
  VehicleOperationCalendarDay,
  VehicleInoperativePeriod,
  VehicleInoperativeNotification
} from '@/types'

interface VehicleOperationManagementProps {
  vehicles: Vehicle[]
  drivers: Driver[]
  vacationRequests: VacationRequest[]
  vehicleAssignmentChanges: VehicleAssignmentChange[]
  driverVehicleNotifications: DriverVehicleNotification[]
  vehicleInoperativePeriods: VehicleInoperativePeriod[]
  vehicleInoperativeNotifications: VehicleInoperativeNotification[]
  onVehicleAssignmentChangesChange: (changes: VehicleAssignmentChange[]) => void
  onDriverVehicleNotificationsChange: (notifications: DriverVehicleNotification[]) => void
  onVehicleInoperativePeriodsChange: (periods: VehicleInoperativePeriod[]) => void
  onVehicleInoperativeNotificationsChange: (notifications: VehicleInoperativeNotification[]) => void
  onVehiclesChange: (vehicles: Vehicle[]) => void
}

export default function VehicleOperationManagement({
  vehicles,
  drivers,
  vacationRequests,
  vehicleAssignmentChanges,
  driverVehicleNotifications,
  vehicleInoperativePeriods,
  vehicleInoperativeNotifications,
  onVehicleAssignmentChangesChange,
  onDriverVehicleNotificationsChange,
  onVehicleInoperativePeriodsChange,
  onVehicleInoperativeNotificationsChange,
  onVehiclesChange
}: VehicleOperationManagementProps) {
  const [currentView, setCurrentView] = useState('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showInoperativeModal, setShowInoperativeModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [inoperativeStartDate, setInoperativeStartDate] = useState('')
  const [inoperativeEndDate, setInoperativeEndDate] = useState('')
  const [inoperativeReason, setInoperativeReason] = useState('')
  const [inoperativeType, setInoperativeType] = useState<'repair' | 'maintenance' | 'breakdown' | 'other'>('repair')
  const [tempAssignmentDriverId, setTempAssignmentDriverId] = useState<number | null>(null)
  const [tempAssignmentVehicleId, setTempAssignmentVehicleId] = useState<number | null>(null)
  const [vehicleAssignments, setVehicleAssignments] = useState<{[vehicleId: number]: {driverId: string, reason: string}}>({})

  const tabs = [
    { id: 'calendar', label: '稼働カレンダー', icon: Calendar },
    { id: 'assignments', label: '割り当て履歴', icon: RotateCcw },
    { id: 'notifications', label: '通知管理', icon: Bell }
  ]

  // 車両稼働状況を計算
  const calculateVehicleOperationStatus = (vehicle: Vehicle, date: Date): VehicleOperationStatus => {
    // 1. 稼働不可期間チェック（最優先）
    const inoperativePeriod = vehicleInoperativePeriods.find(period => 
      period.vehicleId === vehicle.id &&
      period.status === 'active' &&
      date >= period.startDate && 
      date <= period.endDate
    )

    if (inoperativePeriod) {
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'inactive_repair',
        reason: `${inoperativePeriod.type === 'repair' ? '修理中' : 
                 inoperativePeriod.type === 'maintenance' ? '整備中' :
                 inoperativePeriod.type === 'breakdown' ? '故障' : 
                 'その他'}: ${inoperativePeriod.reason}`,
        assignedDriverName: inoperativePeriod.originalDriverName
      }
    }

    // 2. 車両自体の状態チェック
    if (vehicle.status === 'inspection') {
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'inactive_inspection',
        reason: '定期点検中',
        assignedDriverName: vehicle.driver
      }
    }

    if (vehicle.status === 'repair') {
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'inactive_repair',
        reason: '修理中',
        assignedDriverName: vehicle.driver
      }
    }

    // 3. 割り当て変更チェック
    const assignmentChange = vehicleAssignmentChanges.find(change => 
      change.vehicleId === vehicle.id &&
      isSameDay(change.date, date) &&
      (!change.endDate || date <= change.endDate)
    )

    if (assignmentChange) {
      const newDriver = drivers.find(d => d.id === assignmentChange.newDriverId)
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'reassigned',
        assignedDriverId: assignmentChange.newDriverId,
        assignedDriverName: newDriver?.name,
        reason: `割り当て変更: ${assignmentChange.reason}`,
        originalDriverId: assignmentChange.originalDriverId,
        originalDriverName: assignmentChange.originalDriverName
      }
    }

    // 4. ドライバー休暇チェック
    if (vehicle.driver) {
      const assignedDriver = drivers.find(d => d.name === vehicle.driver)
      if (assignedDriver) {
        const driverVacation = vacationRequests.find(req =>
          req.driverId === assignedDriver.id &&
          isSameDay(req.date, date) &&
          req.isOff
        )

        if (driverVacation) {
          return {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plateNumber,
            date,
            status: 'inactive_vacation',
            assignedDriverId: assignedDriver.id,
            assignedDriverName: assignedDriver.name,
            reason: `ドライバー休暇 (${assignedDriver.name})`
          }
        }
      }
    }

    // 5. 通常稼働
    const assignedDriver = drivers.find(d => d.name === vehicle.driver)
    return {
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      date,
      status: 'active',
      assignedDriverId: assignedDriver?.id,
      assignedDriverName: vehicle.driver || '未割当',
      reason: '稼働中'
    }
  }

  // カレンダーの日付情報を生成（6週間分の完全なカレンダーグリッド）
  const generateCalendarDays = (): VehicleOperationCalendarDay[] => {
    const monthStart = startOfMonth(calendarDate)
    const monthEnd = endOfMonth(calendarDate)
    
    // カレンダーグリッドの開始と終了（前月末から翌月初まで含む）
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 日曜日開始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }) // 日曜日開始
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return days.map(day => {
      const allVehicleStatuses = vehicles.map(vehicle => {
        const status = calculateVehicleOperationStatus(vehicle, day)
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          status: status.status,
          assignedDriverName: status.assignedDriverName,
          reason: status.reason,
          isTemporary: vehicleAssignmentChanges.some(change => 
            change.vehicleId === vehicle.id &&
            isSameDay(change.date, day) &&
            change.isTemporary
          )
        }
      })

      // 未稼働車両のみをフィルタリング
      const inactiveVehicles = allVehicleStatuses.filter(v => 
        v.status === 'inactive_vacation' || 
        v.status === 'inactive_inspection' || 
        v.status === 'inactive_repair'
      )

      const activeVehicles = vehicles.length - inactiveVehicles.length

      return {
        date: day,
        vehicles: inactiveVehicles, // 未稼働車両のみ
        totalVehicles: vehicles.length,
        activeVehicles,
        inactiveVehicles: inactiveVehicles.length
      }
    })
  }

  // セルクリック時の処理
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowAssignmentModal(true)
    setVehicleAssignments({})
  }

  // その日の未稼働車両を取得
  const getInactiveVehiclesForDate = (date: Date) => {
    return vehicles.map(vehicle => {
      const status = calculateVehicleOperationStatus(vehicle, date)
      return {
        vehicle,
        status,
        isInactive: status.status === 'inactive_vacation' || 
                   status.status === 'inactive_inspection' || 
                   status.status === 'inactive_repair'
      }
    }).filter(item => item.isInactive)
  }

  // その日の全車両稼働状況を取得
  const getAllVehicleStatusForDate = (date: Date) => {
    return vehicles.map(vehicle => {
      const status = calculateVehicleOperationStatus(vehicle, date)
      return {
        vehicle,
        status
      }
    }).sort((a, b) => {
      // ステータス順でソート（稼働中 → 代替運転 → 未稼働）
      const statusOrder: { [key: string]: number } = {
        'active': 1,
        'reassigned': 2,
        'inactive_vacation': 3,
        'inactive_inspection': 4,
        'inactive_repair': 5
      }
      return statusOrder[a.status.status] - statusOrder[b.status.status]
    })
  }

  // 個別車両の代替ドライバー割り当て
  const handleIndividualVehicleAssignment = (vehicleId: number, newDriverId: string, reason: string) => {
    if (!selectedDate || !newDriverId) return

    const vehicle = vehicles.find(v => v.id === vehicleId)
    const newDriver = drivers.find(d => d.id === parseInt(newDriverId))
    const originalDriver = drivers.find(d => d.name === vehicle?.driver)

    if (!vehicle || !newDriver) return

    const newAssignment: VehicleAssignmentChange = {
      id: Date.now() + vehicleId,
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      date: selectedDate,
      originalDriverId: originalDriver?.id || 0,
      originalDriverName: originalDriver?.name || '未割当',
      newDriverId: newDriver.id,
      newDriverName: newDriver.name,
      reason: reason || `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}の代替運転`,
      createdAt: new Date(),
      createdBy: '管理者',
      isTemporary: true,
      endDate: selectedDate // その日限りの一時的変更
    }

    onVehicleAssignmentChangesChange([...vehicleAssignmentChanges, newAssignment])

    // ドライバーに通知を送信
    const notification: DriverVehicleNotification = {
      id: Date.now() + vehicleId + 1000,
      driverId: newDriver.id,
      driverName: newDriver.name,
      type: 'vehicle_assignment',
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      assignmentDate: selectedDate,
      endDate: selectedDate,
      message: `車両 ${vehicle.plateNumber} が ${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} に一時的に割り当てられました。`,
      isRead: false,
      sentAt: new Date(),
      priority: 'medium'
    }

    onDriverVehicleNotificationsChange([...driverVehicleNotifications, notification])
  }

  // 車両稼働不可期間設定関数
  const handleVehicleInoperative = () => {
    if (!selectedVehicle || !inoperativeStartDate || !inoperativeEndDate || !inoperativeReason) {
      alert('すべての項目を入力してください。')
      return
    }

    const startDate = new Date(inoperativeStartDate)
    const endDate = new Date(inoperativeEndDate)

    if (startDate > endDate) {
      alert('開始日は終了日より前に設定してください。')
      return
    }

    // 元のドライバー情報を取得
    const originalDriver = drivers.find(d => d.name === selectedVehicle.driver)

    // 新しい稼働不可期間を作成
    const newInoperativePeriod: VehicleInoperativePeriod = {
      id: Date.now(),
      vehicleId: selectedVehicle.id,
      plateNumber: selectedVehicle.plateNumber,
      startDate,
      endDate,
      reason: inoperativeReason,
      type: inoperativeType,
      originalDriverId: originalDriver?.id,
      originalDriverName: originalDriver?.name,
      tempAssignmentDriverId: tempAssignmentDriverId ?? undefined,
      tempAssignmentVehicleId: tempAssignmentVehicleId ?? undefined,
      status: 'active',
      createdAt: new Date(),
      createdBy: '管理者', // 実際の実装では現在のユーザー名を使用
      notes: tempAssignmentDriverId ? `一時割り当て: ドライバーID ${tempAssignmentDriverId} → 車両ID ${tempAssignmentVehicleId}` : undefined
    }

    // 稼働不可期間を追加
    onVehicleInoperativePeriodsChange([...vehicleInoperativePeriods, newInoperativePeriod])

    // 担当ドライバーへの通知を作成
    if (originalDriver) {
      const notification: VehicleInoperativeNotification = {
        id: Date.now() + 1,
        vehicleInoperativePeriodId: newInoperativePeriod.id,
        driverId: originalDriver.id,
        driverName: originalDriver.name,
        vehicleId: selectedVehicle.id,
        plateNumber: selectedVehicle.plateNumber,
        type: 'period_start',
        message: `担当車両 ${selectedVehicle.plateNumber} が ${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日から${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日まで${
          inoperativeType === 'repair' ? '修理' :
          inoperativeType === 'maintenance' ? '整備' :
          inoperativeType === 'breakdown' ? '故障' : 'その他'
        }のため稼働停止となります。理由: ${inoperativeReason}`,
        startDate,
        endDate,
        tempVehicleInfo: tempAssignmentVehicleId ? {
          vehicleId: tempAssignmentVehicleId,
          plateNumber: vehicles.find(v => v.id === tempAssignmentVehicleId)?.plateNumber || '不明'
        } : undefined,
        isRead: false,
        sentAt: new Date(),
        priority: 'medium'
      }
      
      onVehicleInoperativeNotificationsChange([...vehicleInoperativeNotifications, notification])
    }

    // 一時的にドライバーを別の車両に割り当てる場合の処理
    if (tempAssignmentDriverId && tempAssignmentVehicleId && originalDriver) {
      const tempVehicle = vehicles.find(v => v.id === tempAssignmentVehicleId)
      const tempDriver = drivers.find(d => d.id === tempAssignmentDriverId)
      
      if (tempVehicle && tempDriver) {
        // 一時割り当て通知
        const tempNotification: VehicleInoperativeNotification = {
          id: Date.now() + 2,
          vehicleInoperativePeriodId: newInoperativePeriod.id,
          driverId: originalDriver.id,
          driverName: originalDriver.name,
          vehicleId: tempVehicle.id,
          plateNumber: tempVehicle.plateNumber,
          type: 'temp_assignment',
          message: `一時的に車両 ${tempVehicle.plateNumber} に割り当てられました。期間: ${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日〜${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日`,
          startDate,
          endDate,
          tempVehicleInfo: {
            vehicleId: tempVehicle.id,
            plateNumber: tempVehicle.plateNumber
          },
          isRead: false,
          sentAt: new Date(),
          priority: 'medium'
        }
        
        onVehicleInoperativeNotificationsChange([...vehicleInoperativeNotifications, tempNotification])
      }
    }

    // モーダルを閉じてフォームをリセット
    setShowInoperativeModal(false)
    setSelectedVehicle(null)
    setInoperativeStartDate('')
    setInoperativeEndDate('')
    setInoperativeReason('')
    setInoperativeType('repair')
    setTempAssignmentDriverId(null)
    setTempAssignmentVehicleId(null)

    alert('稼働不可期間を設定しました。')
  }

  // 車両選択処理
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    
    // デフォルト値設定
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setInoperativeStartDate(today.toISOString().split('T')[0])
    setInoperativeEndDate(tomorrow.toISOString().split('T')[0])
    setInoperativeReason('')
    setInoperativeType('repair')
    setTempAssignmentDriverId(null)
    setTempAssignmentVehicleId(null)
  }

  // カレンダービューのレンダリング
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays()

    return (
      <div className="space-y-6">
        {/* 車両稼働不可設定ボタン */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">車両稼働管理</h3>
              <p className="text-sm text-gray-600">車両の稼働不可期間を設定し、ドライバーの一時割り当てを管理できます。</p>
            </div>
            <button
              onClick={() => setShowInoperativeModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="h-5 w-5" />
              <span>稼働不可期間を設定</span>
            </button>
          </div>
        </div>

        {/* 車両管理情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 担当者未割当車両 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                担当者未割当車両
              </h3>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {vehicles.filter(v => !v.driver).length}台
              </span>
            </div>
            <div className="space-y-2">
              {vehicles.filter(v => !v.driver).length === 0 ? (
                <p className="text-sm text-gray-600">全ての車両に担当者が割り当てられています。</p>
              ) : (
                vehicles.filter(v => !v.driver).map(vehicle => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <Truck className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                        <div className="text-sm text-gray-600">チーム: {vehicle.team}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'normal' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'inspection' ? 'bg-yellow-100 text-yellow-800' :
                      vehicle.status === 'repair' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status === 'normal' ? '正常' :
                       vehicle.status === 'inspection' ? '点検中' :
                       vehicle.status === 'repair' ? '修理中' :
                       vehicle.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 点検対象車両（表示月） */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-500" />
                {format(calendarDate, 'yyyy年MM月', { locale: ja })}の点検対象車両
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {(() => {
                  const currentMonth = calendarDate.getMonth()
                  const currentYear = calendarDate.getFullYear()
                  return vehicles.filter(vehicle => {
                    const inspections = [
                      vehicle.vehicleInspectionDate,
                      vehicle.craneAnnualInspection,
                      vehicle.threeMonthInspection,
                      vehicle.sixMonthInspection
                    ].filter(date => date)
                    
                    return inspections.some(inspectionDate => {
                      const date = new Date(inspectionDate!)
                      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
                    })
                  }).length
                })()}台
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                const currentMonth = calendarDate.getMonth()
                const currentYear = calendarDate.getFullYear()
                const inspectionVehicles = vehicles.filter(vehicle => {
                  const inspections = [
                    { date: vehicle.vehicleInspectionDate, type: '車検' },
                    { date: vehicle.craneAnnualInspection, type: 'クレーン年次点検' },
                    { date: vehicle.threeMonthInspection, type: '3ヶ月点検' },
                    { date: vehicle.sixMonthInspection, type: '6ヶ月点検' }
                  ].filter(item => item.date)
                  
                  return inspections.some(inspection => {
                    const date = new Date(inspection.date!)
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
                  })
                }).map(vehicle => {
                  // この車両の今月の点検種類を特定
                  const inspections = [
                    { date: vehicle.vehicleInspectionDate, type: '車検' },
                    { date: vehicle.craneAnnualInspection, type: 'クレーン年次点検' },
                    { date: vehicle.threeMonthInspection, type: '3ヶ月点検' },
                    { date: vehicle.sixMonthInspection, type: '6ヶ月点検' }
                  ].filter(item => item.date)
                  
                  const thisMonthInspections = inspections.filter(inspection => {
                    const date = new Date(inspection.date!)
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
                  })
                  
                  return {
                    ...vehicle,
                    inspections: thisMonthInspections
                  }
                })

                if (inspectionVehicles.length === 0) {
                  return (
                    <p className="text-sm text-gray-600">この月の点検対象車両はありません。</p>
                  )
                }

                return inspectionVehicles.map(vehicle => (
                  <div key={vehicle.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                          <div className="text-sm text-gray-600">担当: {vehicle.driver || '未割当'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {vehicle.inspections.map((inspection, index) => (
                          <div key={index} className="text-xs">
                            <div className="font-medium text-blue-800">{inspection.type}</div>
                            <div className="text-blue-600">
                              {format(new Date(inspection.date!), 'MM/dd', { locale: ja })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                車両稼働カレンダー
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-medium text-gray-900">
                  {format(calendarDate, 'yyyy年MM月', { locale: ja })}
                </span>
                <button
                  onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 凡例 */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">休暇により未稼働</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">点検中</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">修理中</span>
              </div>
              <div className="text-sm text-gray-600">
                ※稼働中の車両は表示されません
              </div>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <div 
                  key={index} 
                  className={`p-3 text-center text-sm font-medium ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-500'
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
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-3 border-r border-b border-gray-100 transition-colors ${
                      isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isCurrentDate ? 'bg-blue-50' : 
                      !isCurrentMonth ? 'bg-gray-50' :
                      'hover:bg-gray-50'
                    }`}
                    onClick={() => isCurrentMonth ? handleDateClick(dayInfo.date) : undefined}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isCurrentDate ? 'text-blue-600' : 
                        !isCurrentMonth ? 'text-gray-400' :
                        'text-gray-700'
                      }`}>
                        {format(dayInfo.date, 'd')}
                      </span>
                      {isCurrentMonth && dayInfo.inactiveVehicles > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          未稼働: {dayInfo.inactiveVehicles}台
                        </span>
                      )}
                    </div>

                    {/* 未稼働車両詳細 - 現在の月のみ表示 */}
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {dayInfo.vehicles.slice(0, 4).map((vehicle, vIndex) => (
                          <div
                            key={vIndex}
                            className={`text-xs p-2 rounded border-l-3 ${
                              vehicle.status === 'inactive_vacation' ? 'bg-orange-50 border-orange-400 text-orange-800' :
                              vehicle.status === 'inactive_inspection' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                              vehicle.status === 'inactive_repair' ? 'bg-red-50 border-red-400 text-red-800' :
                              'bg-gray-50 border-gray-400 text-gray-800'
                            }`}
                            title={`${vehicle.plateNumber} - ${vehicle.reason}`}
                          >
                            <div className="font-medium truncate">
                              {vehicle.plateNumber.split(' ').pop()}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {vehicle.assignedDriverName}
                            </div>
                            <div className="text-xs opacity-60 truncate">
                              {vehicle.status === 'inactive_vacation' ? '休暇' :
                               vehicle.status === 'inactive_inspection' ? '点検' :
                               vehicle.status === 'inactive_repair' ? '修理' : ''}
                              {vehicle.isTemporary && (
                                <Clock className="inline h-3 w-3 ml-1" />
                              )}
                            </div>
                          </div>
                        ))}
                        {dayInfo.vehicles.length > 4 && (
                          <div className="text-xs text-gray-500 text-center bg-gray-50 p-1 rounded">
                            他 {dayInfo.vehicles.length - 4} 台
                          </div>
                        )}
                        {dayInfo.vehicles.length === 0 && (
                          <div className="text-xs text-green-600 text-center py-2 bg-green-50 rounded">
                            全車両稼働中
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
      </div>
    )
  }

  // 割り当て履歴ビューのレンダリング
  const renderAssignmentsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">車両割り当て変更履歴</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">車両</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">変更前</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">変更後</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成者</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleAssignmentChanges
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map(change => (
                <tr key={change.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(change.date, 'MM月dd日', { locale: ja })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {change.plateNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {change.originalDriverName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {change.newDriverName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {change.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      change.isTemporary 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {change.isTemporary ? '一時的' : '恒久的'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {change.createdBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // 通知管理ビューのレンダリング
  const renderNotificationsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">ドライバー車両通知</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {driverVehicleNotifications
              .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
              .map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{notification.driverName}</span>
                      <span className="text-sm text-gray-500">({notification.plateNumber})</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority === 'high' ? '高' :
                         notification.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {format(notification.sentAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => {
                        const updatedNotifications = driverVehicleNotifications.map(n =>
                          n.id === notification.id ? { ...n, isRead: true } : n
                        )
                        onDriverVehicleNotificationsChange(updatedNotifications)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      既読にする
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return renderCalendarView()
      case 'assignments':
        return renderAssignmentsView()
      case 'notifications':
        return renderNotificationsView()
      default:
        return renderCalendarView()
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">車両稼働管理システム</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">自動稼働管理</span>
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

      {/* 車両割り当て変更モーダル */}
      {showAssignmentModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} の車両稼働状況
                </h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  この日の車両稼働状況の確認と、未稼働車両への代替ドライバー割り当てができます。
                </p>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* 全車両稼働状況一覧 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  車両稼働状況一覧 ({vehicles.length}台)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {getAllVehicleStatusForDate(selectedDate).map((item, index) => {
                    const { vehicle, status } = item
                    
                    return (
                      <div key={vehicle.id} className={`border rounded-lg p-4 ${
                        status.status === 'active' ? 'bg-green-50 border-green-200' :
                        status.status === 'reassigned' ? 'bg-blue-50 border-blue-200' :
                        status.status === 'inactive_vacation' ? 'bg-orange-50 border-orange-200' :
                        status.status === 'inactive_inspection' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        {/* 車両情報ヘッダー */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              status.status === 'active' ? 'bg-green-500' :
                              status.status === 'reassigned' ? 'bg-blue-500' :
                              status.status === 'inactive_vacation' ? 'bg-orange-500' :
                              status.status === 'inactive_inspection' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <h5 className="font-semibold text-gray-900">{vehicle.plateNumber}</h5>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status.status === 'active' ? 'bg-green-100 text-green-800' :
                            status.status === 'reassigned' ? 'bg-blue-100 text-blue-800' :
                            status.status === 'inactive_vacation' ? 'bg-orange-100 text-orange-800' :
                            status.status === 'inactive_inspection' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status.status === 'active' ? '稼働中' :
                             status.status === 'reassigned' ? '代替運転' :
                             status.status === 'inactive_vacation' ? '休暇' :
                             status.status === 'inactive_inspection' ? '点検' : '修理'}
                          </span>
                        </div>
                        
                        {/* ドライバー情報 */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {status.assignedDriverName || '未割当'}
                            </span>
                            {status.originalDriverName && status.status === 'reassigned' && (
                              <span className="text-xs text-gray-500">
                                (元: {status.originalDriverName})
                              </span>
                            )}
                          </div>
                          
                          {/* チーム・車庫情報 */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{vehicle.team}</span>
                            <span>{vehicle.garage}</span>
                          </div>
                          
                          {/* 状況詳細 */}
                          <div className="text-xs text-gray-600 bg-white bg-opacity-60 rounded px-2 py-1">
                            {status.reason}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* 稼働統計 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {getAllVehicleStatusForDate(selectedDate).filter(item => item.status.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">稼働中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getAllVehicleStatusForDate(selectedDate).filter(item => item.status.status === 'reassigned').length}
                    </div>
                    <div className="text-sm text-gray-600">代替運転</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {getAllVehicleStatusForDate(selectedDate).filter(item => item.status.status === 'inactive_vacation').length}
                    </div>
                    <div className="text-sm text-gray-600">休暇</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getAllVehicleStatusForDate(selectedDate).filter(item => item.status.status === 'inactive_inspection').length}
                    </div>
                    <div className="text-sm text-gray-600">点検</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {getAllVehicleStatusForDate(selectedDate).filter(item => item.status.status === 'inactive_repair').length}
                    </div>
                    <div className="text-sm text-gray-600">修理</div>
                  </div>
                </div>
              </div>
              
              {/* 代替ドライバー設定セクション */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  代替ドライバー設定
                </h4>
                
                {(() => {
                  const inactiveVehicles = getInactiveVehiclesForDate(selectedDate)
                  
                  if (inactiveVehicles.length === 0) {
                    return (
                      <div className="text-center py-6 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h5 className="font-medium text-gray-900 mb-1">全車両稼働中</h5>
                        <p className="text-sm text-gray-600">この日は全ての車両が稼働予定です。</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          未稼働車両 ({inactiveVehicles.length}台) に対して代替ドライバーを割り当てることができます。
                        </p>
                      </div>
                      
                      {inactiveVehicles.map((item, index) => {
                        const vehicleId = item.vehicle.id
                        const currentAssignment = vehicleAssignments[vehicleId] || { driverId: '', reason: '' }
                        
                        return (
                          <div key={vehicleId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            {/* 車両情報ヘッダー */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  item.status.status === 'inactive_vacation' ? 'bg-orange-500' :
                                  item.status.status === 'inactive_inspection' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.vehicle.plateNumber}</h5>
                                  <p className="text-sm text-gray-600">
                                    元ドライバー: {item.vehicle.driver || '未割当'} | 
                                    理由: {item.status.reason}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status.status === 'inactive_vacation' ? 'bg-orange-100 text-orange-800' :
                                item.status.status === 'inactive_inspection' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status.status === 'inactive_vacation' ? '休暇' :
                                 item.status.status === 'inactive_inspection' ? '点検' : '修理'}
                              </span>
                            </div>
                            
                            {/* 代替ドライバー選択 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* 内部ドライバー */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  内部ドライバー（正社員）
                                </label>
                                <select
                                  value={currentAssignment.driverId.startsWith('internal-') ? currentAssignment.driverId : ''}
                                  onChange={(e) => {
                                    setVehicleAssignments(prev => ({
                                      ...prev,
                                      [vehicleId]: {
                                        driverId: e.target.value,
                                        reason: currentAssignment.reason || `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}の代替運転`
                                      }
                                    }))
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">内部ドライバーを選択</option>
                                  {drivers
                                    .filter(d => !d.employeeId.startsWith('E') && (d.status === 'available' || d.status === 'working'))
                                    .map(driver => (
                                      <option key={driver.id} value={`internal-${driver.id}`}>
                                        {driver.name} ({driver.team}) - {driver.status === 'available' ? '空き' : '稼働中'}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              
                              {/* 外部ドライバー */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  外部ドライバー
                                </label>
                                <select
                                  value={currentAssignment.driverId.startsWith('external-') ? currentAssignment.driverId : ''}
                                  onChange={(e) => {
                                    setVehicleAssignments(prev => ({
                                      ...prev,
                                      [vehicleId]: {
                                        driverId: e.target.value,
                                        reason: currentAssignment.reason || `${format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}の代替運転`
                                      }
                                    }))
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">外部ドライバーを選択</option>
                                  {drivers
                                    .filter(d => d.employeeId.startsWith('E') && (d.status === 'available' || d.status === 'working'))
                                    .map(driver => (
                                      <option key={driver.id} value={`external-${driver.id}`}>
                                        {driver.name} ({driver.team}) - {driver.status === 'available' ? '空き' : '稼働中'}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                            
                            {/* 備考欄 */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                備考
                              </label>
                              <input
                                type="text"
                                value={currentAssignment.reason}
                                onChange={(e) => {
                                  setVehicleAssignments(prev => ({
                                    ...prev,
                                    [vehicleId]: {
                                      driverId: currentAssignment.driverId,
                                      reason: e.target.value
                                    }
                                  }))
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="代替運転の理由や備考を入力"
                              />
                            </div>
                            
                            {/* 個別割り当てボタン */}
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => {
                                  const driverIdStr = currentAssignment.driverId
                                  if (driverIdStr) {
                                    const actualDriverId = driverIdStr.replace(/^(internal-|external-)/, '')
                                    handleIndividualVehicleAssignment(vehicleId, actualDriverId, currentAssignment.reason)
                                    // 成功後にフォームをクリア
                                    setVehicleAssignments(prev => {
                                      const updated = {...prev}
                                      delete updated[vehicleId]
                                      return updated
                                    })
                                  }
                                }}
                                disabled={!currentAssignment.driverId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                              >
                                <Save className="h-4 w-4" />
                                <span>この車両に割り当て</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
              
              {/* 閉じるボタン */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 車両稼働不可期間設定モーダル */}
      {showInoperativeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
                  車両稼働不可期間設定
                </h2>
                <button
                  onClick={() => {
                    setShowInoperativeModal(false)
                    setSelectedVehicle(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!selectedVehicle ? (
                // 車両選択画面
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">稼働不可設定を行う車両を選択してください</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vehicles.map(vehicle => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                          <div className="text-sm text-gray-600">担当: {vehicle.driver || '未割当'}</div>
                          <div className="text-xs text-gray-500">チーム: {vehicle.team}</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <Truck className="h-6 w-6 text-gray-500" />
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            vehicle.status === 'normal' ? 'bg-green-100 text-green-800' :
                            vehicle.status === 'inspection' ? 'bg-yellow-100 text-yellow-800' :
                            vehicle.status === 'repair' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {vehicle.status === 'normal' ? '正常' :
                             vehicle.status === 'inspection' ? '点検中' :
                             vehicle.status === 'repair' ? '修理中' :
                             vehicle.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // 稼働不可設定画面
                <div>
                  {/* 車両情報 */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">対象車両</h3>
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{selectedVehicle.plateNumber}</div>
                            <div className="text-sm text-gray-600">現在の担当ドライバー: {selectedVehicle.driver || '未割当'}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedVehicle(null)}
                        className="px-3 py-1 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      >
                        車両を変更
                      </button>
                    </div>
                  </div>

                  {/* 稼働不可期間設定 */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          開始日 *
                        </label>
                        <input
                          type="date"
                          value={inoperativeStartDate}
                          onChange={(e) => setInoperativeStartDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          終了日 *
                        </label>
                        <input
                          type="date"
                          value={inoperativeEndDate}
                          onChange={(e) => setInoperativeEndDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        稼働不可の種類 *
                      </label>
                      <select
                        value={inoperativeType}
                        onChange={(e) => setInoperativeType(e.target.value as 'repair' | 'maintenance' | 'breakdown' | 'other')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="repair">修理</option>
                        <option value="maintenance">整備</option>
                        <option value="breakdown">故障</option>
                        <option value="other">その他</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        理由 *
                      </label>
                      <textarea
                        value={inoperativeReason}
                        onChange={(e) => setInoperativeReason(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="稼働不可の具体的な理由を入力してください"
                      />
                    </div>

                    {/* 一時的な割り当て設定 */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        担当ドライバーの一時割り当て（オプション）
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        この車両の担当ドライバーを期間中、他の車両に一時的に割り当てることができます。
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            一時割り当て先車両
                          </label>
                          <select
                            value={tempAssignmentVehicleId || ''}
                            onChange={(e) => setTempAssignmentVehicleId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">車両を選択してください</option>
                            {vehicles
                              .filter(v => v.id !== selectedVehicle.id) // 現在の車両以外
                              .map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.plateNumber} ({vehicle.driver || '未割当'})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            割り当てるドライバー
                          </label>
                          <select
                            value={tempAssignmentDriverId || ''}
                            onChange={(e) => setTempAssignmentDriverId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!tempAssignmentVehicleId}
                          >
                            <option value="">ドライバーを選択してください</option>
                            {drivers
                              .filter(d => d.name === selectedVehicle.driver) // 現在の担当ドライバーのみ
                              .map(driver => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name} ({driver.team})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {tempAssignmentVehicleId && tempAssignmentDriverId && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center text-blue-800">
                            <Info className="h-5 w-5 mr-2" />
                            <span className="font-medium">一時割り当て予約</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            {drivers.find(d => d.id === tempAssignmentDriverId)?.name} を 
                            {vehicles.find(v => v.id === tempAssignmentVehicleId)?.plateNumber} に
                            期間中一時的に割り当てます。期間終了後、自動的に元の担当に戻ります。
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 確認ボタン */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowInoperativeModal(false)
                          setSelectedVehicle(null)
                        }}
                        className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleVehicleInoperative}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span>稼働不可期間を設定</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 