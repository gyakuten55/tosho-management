'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  UserX,
  Info,
  FileText,
  Edit3,
  ClipboardList,
  Trash2,
  Archive
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
  VehicleInoperativeNotification,
  DailyVehicleSwap,
  InspectionReservation,
  TemporaryAssignment
} from '@/types'
import { getAllInspectionDates, getNextInspectionDate, getNextAnnualInspectionDate } from '@/utils/inspectionUtils'

import { VehicleService } from '@/services/vehicleService'
import { DriverService } from '@/services/driverService'
import { DriverNotificationService } from '@/services/driverNotificationService'
import { InspectionReservationService } from '@/services/inspectionReservationService'
import { VacationService } from '@/services/vacationService'
import { TemporaryAssignmentService } from '@/services/temporaryAssignmentService'
import { 
  VehicleAssignmentChangeService,
  VehicleInoperativePeriodService 
} from '@/services/vehicleOperationService'
import { useEscapeKey } from '@/hooks/useEscapeKey'


interface VehicleOperationManagementProps {}

export default function VehicleOperationManagement({}: VehicleOperationManagementProps) {
  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [vehicleAssignmentChanges, setVehicleAssignmentChanges] = useState<VehicleAssignmentChange[]>([])
  const [driverVehicleNotifications, setDriverVehicleNotifications] = useState<DriverVehicleNotification[]>([])
  const [vehicleInoperativePeriods, setVehicleInoperativePeriods] = useState<VehicleInoperativePeriod[]>([])
  const [vehicleInoperativeNotifications, setVehicleInoperativeNotifications] = useState<VehicleInoperativeNotification[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI states
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

  const [vehicleAssignments, setVehicleAssignments] = useState<{[vehicleId: number]: {driverId: string, reason: string}}>({})
  
  // 新機能用状態
  const [dailyVehicleSwaps, setDailyVehicleSwaps] = useState<DailyVehicleSwap[]>([])
  const [showVehicleSwapModal, setShowVehicleSwapModal] = useState(false)
  const [swapDriverId, setSwapDriverId] = useState<number | null>(null)
  const [swapOriginalVehicleId, setSwapOriginalVehicleId] = useState<number | null>(null)
  const [swapNewVehicleId, setSwapNewVehicleId] = useState<number | null>(null)
  const [swapReason, setSwapReason] = useState('')
  
  // 点検予約管理用状態（特定の点検期限日単位で管理）
  const [inspectionBookings, setInspectionBookings] = useState<{[key: string]: {isReservationCompleted: boolean, memo: string, hasCraneInspection: boolean, reservationDate?: string, vehicleId: number, inspectionDeadline: string}}>({})
  
  // 一時的車両割り当て用状態
  const [showTempAssignModal, setShowTempAssignModal] = useState(false)
  const [tempAssignDriverId, setTempAssignDriverId] = useState<number | null>(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [vehiclesData, driversData, vacationData] = await Promise.all([
          VehicleService.getAll(),
          DriverService.getAll(),
          VacationService.getAll()
        ])
        
        setVehicles(vehiclesData)
        setDrivers(driversData)
        setVacationRequests(vacationData)
        
        // Load operation-related data
        const [assignmentChanges, inoperativePeriods, inspectionReservations] = await Promise.all([
          VehicleAssignmentChangeService.getAll(),
          VehicleInoperativePeriodService.getAll(),
          InspectionReservationService.getAll()
        ])
        
        setVehicleAssignmentChanges(assignmentChanges)
        setVehicleInoperativePeriods(inoperativePeriods)

        // 一時的割り当てのデータを個別に処理（エラー時にも続行）
        try {
          const temporaryAssignmentsData = await TemporaryAssignmentService.getAll()
          setTemporaryAssignments(temporaryAssignmentsData)

          // 期限切れの一時的割り当てを削除
          try {
            await TemporaryAssignmentService.deleteExpired()
            // 削除後の最新データを再取得
            const updatedTemporaryAssignments = await TemporaryAssignmentService.getAll()
            setTemporaryAssignments(updatedTemporaryAssignments)
          } catch (deleteError) {
            console.error('期限切れの一時的割り当て削除に失敗しました:', deleteError)
          }
        } catch (error) {
          console.error('一時的割り当てデータの読み込みに失敗しました（テーブルが存在しない可能性があります）:', error)
          // 空の配列をセットして続行
          setTemporaryAssignments([])
        }
        
        // 点検予約データをinspectionBookingsのフォーマットに変換
        const bookingsMap: {[key: string]: {isReservationCompleted: boolean, memo: string, hasCraneInspection: boolean, reservationDate?: string, vehicleId: number, inspectionDeadline: string}} = {}
        const duplicateKeys: string[] = []
        
        console.log(`Loading ${inspectionReservations.length} inspection reservations from database`)
        
        inspectionReservations.forEach(reservation => {
          if (reservation.status === 'scheduled') {
            // memoから日付範囲情報を抽出
            const memo = reservation.memo || ''
            const dateRangeMatch = memo.match(/日付範囲: (\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/)
            
            const bookingData = {
              isReservationCompleted: true,
              memo: reservation.memo || '',
              hasCraneInspection: false, // 必要に応じて車両情報から判定
              reservationDate: reservation.scheduledDate.toISOString().split('T')[0],
              vehicleId: reservation.vehicleId,
              inspectionDeadline: reservation.deadlineDate.toISOString().split('T')[0]
            }
            
            if (dateRangeMatch) {
              // 期間予約の場合：期間内の全日付にキーを作成
              const startDateStr = dateRangeMatch[1]
              const endDateStr = dateRangeMatch[2]
              const startDate = new Date(startDateStr + 'T00:00:00')
              const endDate = new Date(endDateStr + 'T00:00:00')
              const dates = eachDayOfInterval({ start: startDate, end: endDate })
              
              dates.forEach(date => {
                const dateKey = `${reservation.vehicleId}_${format(date, 'yyyy-MM-dd')}`
                
                // 重複チェック
                if (bookingsMap[dateKey]) {
                  duplicateKeys.push(dateKey)
                  console.warn(`Duplicate booking key detected: ${dateKey}`)
                }
                
                bookingsMap[dateKey] = bookingData
              })
            } else {
              // 単日予約の場合：従来通り
              const bookingKey = `${reservation.vehicleId}_${reservation.scheduledDate.toISOString().split('T')[0]}`
              
              // 重複チェック
              if (bookingsMap[bookingKey]) {
                duplicateKeys.push(bookingKey)
                console.warn(`Duplicate booking key detected: ${bookingKey}`)
              }
              
              bookingsMap[bookingKey] = bookingData
            }
          }
        })
        
        console.log(`Created ${Object.keys(bookingsMap).length} unique inspection bookings`)
        if (duplicateKeys.length > 0) {
          console.warn(`Found ${duplicateKeys.length} duplicate keys:`, duplicateKeys)
        }
        
        setInspectionBookings(bookingsMap)
        
      } catch (err) {
        console.error('Failed to load operation data:', err)
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 稼働不可期間の期限チェック（定期実行）
  useEffect(() => {
    const checkInoperativePeriods = async () => {
      const today = new Date()
      const expiredPeriods = vehicleInoperativePeriods.filter(period => 
        period.status === 'active' && period.endDate < today
      )

      for (const period of expiredPeriods) {
        try {
          // 1. 期間を完了に更新
          await VehicleInoperativePeriodService.update(period.id, { status: 'completed' })
          
          // 2. 車両ステータスを正常に戻す
          await VehicleService.update(period.vehicleId, { status: 'normal' })
          
          // 3. ローカル状態を更新
          setVehicleInoperativePeriods(prev => 
            prev.map(p => p.id === period.id ? { ...p, status: 'completed' } : p)
          )
          
          setVehicles(prev => prev.map(vehicle => 
            vehicle.id === period.vehicleId 
              ? { ...vehicle, status: 'normal' }
              : vehicle
          ))

          console.log(`車両 ${period.plateNumber} の稼働不可期間が終了し、ステータスを正常に戻しました`)
          
        } catch (error) {
          console.error(`車両 ${period.plateNumber} のステータス復元に失敗:`, error)
        }
      }
    }

    // 初回実行
    checkInoperativePeriods()
    
    // 1時間ごとにチェック
    const interval = setInterval(checkInoperativePeriods, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [vehicleInoperativePeriods])

  // 一時割り当ての期限チェック（定期実行）
  useEffect(() => {
    const checkTemporaryAssignments = async () => {
      try {
        // 現在の一時割り当て情報を取得
        const currentAssignments = await TemporaryAssignmentService.getAll()
        
        // 期限切れになった一時割り当てを特定
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const expiredAssignments = currentAssignments.filter(assignment => {
          const endDate = new Date(assignment.endDate)
          endDate.setHours(23, 59, 59, 999)
          return endDate < today
        })
        
        // 期限切れの一時割り当てがある場合、車両のドライバーを元に戻す
        if (expiredAssignments.length > 0) {
          console.log(`${expiredAssignments.length}件の期限切れ一時割り当てを処理中`)
          
          // 各期限切れ割り当てについて、車両のドライバーを元に戻す
          for (const assignment of expiredAssignments) {
            try {
              const originalDriver = assignment.originalDriverName || undefined
              await VehicleService.update(assignment.vehicleId, { driver: originalDriver })
              
              // ローカル状態の車両情報を更新
              setVehicles(prev => prev.map(v => 
                v.id === assignment.vehicleId ? { ...v, driver: originalDriver || undefined } : v
              ))
              
              console.log(`車両 ${assignment.plateNumber} のドライバーを ${originalDriver || '未割り当て'} に復元しました`)
            } catch (error) {
              console.error(`車両 ${assignment.plateNumber} のドライバー復元に失敗:`, error)
            }
          }
        }
        
        // データベースから期限切れの一時割り当てを削除
        const deletedCount = await TemporaryAssignmentService.deleteExpired()
        
        if (deletedCount > 0) {
          console.log(`${deletedCount}件の期限切れ一時割り当てをデータベースから削除しました`)
          
          // データベースから最新のデータを取得してローカル状態を更新
          const updatedAssignments = await TemporaryAssignmentService.getAll()
          setTemporaryAssignments(updatedAssignments)
          console.log('期限切れ削除後の残り:', updatedAssignments.length, '件')
        } else {
          // ローカル状態とデータベースの整合性をチェック
          if (currentAssignments.length !== temporaryAssignments.length) {
            console.log('ローカル状態とデータベースの同期を行います')
            setTemporaryAssignments(currentAssignments)
          }
        }
      } catch (error) {
        console.error('期限切れ一時割り当ての削除に失敗:', error)
        
        // エラーが発生した場合でも、ローカル状態から期限切れを削除
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        setTemporaryAssignments(prev => {
          const todayStart = new Date(today)
          todayStart.setHours(0, 0, 0, 0)
          
          const expiredAssignments = prev.filter(assignment => {
            const endDate = new Date(assignment.endDate)
            endDate.setHours(23, 59, 59, 999)
            return endDate < todayStart
          })
          
          // 期限切れの車両のドライバーを元に戻す（ローカル状態のみ）
          expiredAssignments.forEach(assignment => {
            setVehicles(prevVehicles => prevVehicles.map(v => 
              v.id === assignment.vehicleId 
                ? { ...v, driver: assignment.originalDriverName || undefined } 
                : v
            ))
          })
          
          const activeAssignments = prev.filter(assignment => {
            const endDate = new Date(assignment.endDate)
            endDate.setHours(23, 59, 59, 999)
            return endDate >= todayStart // 今日以降が有効期限
          })
          
          if (activeAssignments.length !== prev.length) {
            console.log(`ローカル状態から${prev.length - activeAssignments.length}件の期限切れ一時割り当てを削除`)
          }
          
          return activeAssignments
        })
      }
    }
    
    // 初回実行
    checkTemporaryAssignments()
    
    // 1時間ごとにチェック
    const interval = setInterval(checkTemporaryAssignments, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, []) // 初回のみ実行、定期的にチェック

  // 一時割り当て用の状態変数
  const [tempAssignVehicleId, setTempAssignVehicleId] = useState<number | null>(null)
  const [tempAssignStartDate, setTempAssignStartDate] = useState('')
  const [tempAssignEndDate, setTempAssignEndDate] = useState('')
  const [temporaryAssignments, setTemporaryAssignments] = useState<TemporaryAssignment[]>([])

  // 稼働不可期間編集用状態
  const [showEditInoperativeModal, setShowEditInoperativeModal] = useState(false)
  const [editingInoperativePeriod, setEditingInoperativePeriod] = useState<VehicleInoperativePeriod | null>(null)
  const [editInoperativeStartDate, setEditInoperativeStartDate] = useState('')
  const [editInoperativeEndDate, setEditInoperativeEndDate] = useState('')
  const [editInoperativeReason, setEditInoperativeReason] = useState('')
  const [editInoperativeType, setEditInoperativeType] = useState<'repair' | 'maintenance' | 'breakdown' | 'other'>('repair')

  // 点検予約モーダル用状態
  const [showInspectionReservationModal, setShowInspectionReservationModal] = useState(false)
  const [selectedInspectionVehicle, setSelectedInspectionVehicle] = useState<Vehicle | null>(null)
  const [inspectionReservationStartDate, setInspectionReservationStartDate] = useState('')
  const [inspectionReservationEndDate, setInspectionReservationEndDate] = useState('')
  const [inspectionMemo, setInspectionMemo] = useState('')
  const [inspectionType, setInspectionType] = useState<'regular' | 'crane_annual'>('regular')

  // エスケープキーでモーダルを閉じる（優先順位順）
  useEscapeKey(() => {
    if (showInspectionReservationModal) {
      setShowInspectionReservationModal(false)
    } else if (showEditInoperativeModal) {
      setShowEditInoperativeModal(false)
    } else if (showTempAssignModal) {
      setShowTempAssignModal(false)
    } else if (showVehicleSwapModal) {
      setShowVehicleSwapModal(false)
    } else if (showInoperativeModal) {
      setShowInoperativeModal(false)
    } else if (showAssignmentModal) {
      setShowAssignmentModal(false)
    }
  }, showInspectionReservationModal || showEditInoperativeModal || showTempAssignModal || showVehicleSwapModal || showInoperativeModal || showAssignmentModal)

  // ヘルパー関数を先に定義
  const getUnassignedVehiclesForDate = useCallback((date: Date) => {
    // 指定日時の開始と終了を正確に定義（時刻を考慮）
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const targetDateStart = new Date(targetDate)
    targetDateStart.setHours(0, 0, 0, 0)
    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)
    
    return vehicles.filter(vehicle => {
      // 1. その日に有効な一時割り当てがあるかチェック（時刻を考慮した正確な比較）
      const hasTempAssignment = temporaryAssignments.some(assignment => {
        if (assignment.vehicleId !== vehicle.id) return false
        
        // 割り当て期間の開始と終了を正確に設定
        const assignmentStart = new Date(assignment.startDate.getFullYear(), assignment.startDate.getMonth(), assignment.startDate.getDate())
        assignmentStart.setHours(0, 0, 0, 0)
        const assignmentEnd = new Date(assignment.endDate.getFullYear(), assignment.endDate.getMonth(), assignment.endDate.getDate())
        assignmentEnd.setHours(23, 59, 59, 999)
        
        // 指定日が割り当て期間内にあるかチェック
        return targetDate >= assignmentStart && targetDate <= assignmentEnd
      })
      
      if (hasTempAssignment) {
        return false // 一時割り当てがある場合は未割り当てではない
      }
      
      // 2. その日に割り当て変更があるかチェック
      const hasAssignmentChange = vehicleAssignmentChanges.some(change => 
        change.vehicleId === vehicle.id &&
        isSameDay(new Date(change.date), targetDate)
      )
      
      // 割り当て変更がある場合は未割り当てではない
      if (hasAssignmentChange) {
        return false
      }
      
      // 3. 元々担当ドライバーが設定されていない車両
      if (!vehicle.driver) {
        return true
      }
      
      // 4. 担当ドライバーが休暇を取っている車両
      const driverOnVacation = vacationRequests.some(request => 
        request.driverName === vehicle.driver &&
        isSameDay(new Date(request.date), targetDate) &&
        request.workStatus === 'day_off'
      )
      
      return driverOnVacation
    }).map(vehicle => {
      const isVacationRelated = vehicle.driver && vacationRequests.some(request => 
        request.driverName === vehicle.driver &&
        isSameDay(new Date(request.date), targetDate) &&
        request.workStatus === 'day_off'
      )
      
      return {
        ...vehicle,
        reason: isVacationRelated ? 'ドライバー休暇' : '担当者未設定',
        isDayOnly: isVacationRelated // 休暇関連の場合はその日のみの割り当て
      }
    })
  }, [vehicles, vehicleAssignmentChanges, vacationRequests, temporaryAssignments])

  const getInspectionVehiclesForDate = useCallback((date: Date) => {
    const inspectionVehicles: {
      vehicleId: number
      plateNumber: string
      inspectionType: string
      model: string
      driver?: string
      team: string
    }[] = []

    vehicles.forEach(vehicle => {
      // 各種点検日をチェック（点検日から自動計算された3ヶ月点検を使用）
      const inspectionDates = getAllInspectionDates(
        vehicle.inspectionDate,
        vehicle.craneAnnualInspectionDate
      )

      inspectionDates.forEach(inspection => {
        if (inspection.date && isSameDay(new Date(inspection.date), date)) {
          inspectionVehicles.push({
            vehicleId: vehicle.id,
            plateNumber: vehicle.plateNumber,
            inspectionType: inspection.type,
            model: vehicle.model,
            driver: vehicle.driver,
            team: vehicle.team
          })
        }
      })
    })

    return inspectionVehicles
  }, [vehicles])

  // useMemoをコンポーネントトップレベルで定義（条件付きではなく）
  const unassignedVehiclesForSelectedDate = useMemo(() => {
    return selectedDate ? getUnassignedVehiclesForDate(selectedDate) : []
  }, [selectedDate, getUnassignedVehiclesForDate])

  const inspectionVehiclesForSelectedDate = useMemo(() => {
    return selectedDate ? getInspectionVehiclesForDate(selectedDate) : []
  }, [selectedDate, getInspectionVehiclesForDate])

  // 指定期間で未割り当ての車両を取得
  const getUnassignedVehiclesForPeriod = useCallback((startDate: Date, endDate: Date) => {
    if (!startDate || !endDate) return []
    
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    
    return vehicles.filter(vehicle => {
      // 期間中の全ての日で未割り当てかチェック
      return dates.every(date => {
        // 1. その日に既存の一時割り当てがあるかチェック
        const hasTempAssignment = temporaryAssignments.some(assignment =>
          assignment.vehicleId === vehicle.id &&
          date >= assignment.startDate &&
          date <= assignment.endDate
        )
        
        if (hasTempAssignment) {
          return false
        }
        
        // 2. その日に割り当て変更があるかチェック
        const hasAssignmentChange = vehicleAssignmentChanges.some(change =>
          change.vehicleId === vehicle.id &&
          isSameDay(new Date(change.date), date)
        )
        
        if (hasAssignmentChange) {
          return false
        }
        
        // 3. 元々担当ドライバーがいない、または休暇中かチェック
        if (!vehicle.driver) {
          return true
        }
        
        const driverOnVacation = vacationRequests.some(request =>
          request.driverName === vehicle.driver &&
          isSameDay(new Date(request.date), date) &&
          request.workStatus === 'day_off'
        )
        
        return driverOnVacation
      })
    })
  }, [vehicles, temporaryAssignments, vehicleAssignmentChanges, vacationRequests])


  // 指定日付で利用可能なドライバーを取得する関数
  const getAvailableDriversForDate = (date: Date) => {
    return drivers.filter(driver => {
      // 1. 基本的な稼働状態チェック
      if (driver.status !== 'available' && driver.status !== 'working') {
        return false
      }

      // 2. その日に休暇を取っていないかチェック
      const isOnVacation = vacationRequests.some(request => 
        request.driverName === driver.name &&
        isSameDay(new Date(request.date), date) &&
        request.workStatus === 'day_off'
      )
      
      if (isOnVacation) {
        return false
      }

      // 3. その日に他の車両に割り当て変更されていないかチェック
      const hasAssignmentChange = vehicleAssignmentChanges.some(change => 
        change.newDriverId === driver.id &&
        isSameDay(new Date(change.date), date)
      )
      
      if (hasAssignmentChange) {
        return false
      }

      // 4. 担当車両の元ドライバーが休暇の場合は利用可能
      // 5. 担当車両がない場合は利用可能
      return true
    })
  }

  const tabs = [
    { id: 'calendar', label: '稼働カレンダー', icon: Calendar },
    { id: 'unassigned', label: '担当者未割り当て車両', icon: UserX },
    { id: 'temporary-assignments', label: '一時的割り当て管理', icon: User },
    { id: 'reservations', label: '点検予約リスト', icon: ClipboardList },
    { id: 'inoperative-periods', label: '稼働不可期間', icon: AlertTriangle }
  ]

  // 未稼働車両の統計を計算
  const getInoperativeVehicleStats = () => {
    const today = new Date()
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const inoperativeVehicles = vehicles.filter(vehicle => {
      const isInInoperativePeriod = vehicleInoperativePeriods.some(period => {
        if (period.vehicleId !== vehicle.id || period.status !== 'active') {
          return false
        }
        
        // 日付のみを比較（時刻を無視）
        const startDate = new Date(period.startDate.getFullYear(), period.startDate.getMonth(), period.startDate.getDate())
        const endDate = new Date(period.endDate.getFullYear(), period.endDate.getMonth(), period.endDate.getDate())
        
        return todayDate >= startDate && todayDate <= endDate
      })
      
      return isInInoperativePeriod
    })

    return {
      totalVehicles: vehicles.length,
      inoperativeCount: inoperativeVehicles.length,
      activeCount: vehicles.length - inoperativeVehicles.length,
      inoperativeVehicles
    }
  }

  // 車両乗り換え処理
  const handleVehicleSwap = () => {
    if (!swapDriverId || !swapOriginalVehicleId || !swapNewVehicleId || !swapReason) {
      alert('すべての項目を入力してください')
      return
    }

    const driver = drivers.find(d => d.id === swapDriverId)
    const originalVehicle = vehicles.find(v => v.id === swapOriginalVehicleId)
    const newVehicle = vehicles.find(v => v.id === swapNewVehicleId)

    if (!driver || !originalVehicle || !newVehicle) return

    const newSwap: DailyVehicleSwap = {
      id: Date.now(),
      driverId: swapDriverId,
      driverName: driver.name,
      originalVehicleId: swapOriginalVehicleId,
      originalPlateNumber: originalVehicle.plateNumber,
      newVehicleId: swapNewVehicleId,
      newPlateNumber: newVehicle.plateNumber,
      swapTime: new Date(),
      reason: swapReason,
      status: 'active'
    }

    setDailyVehicleSwaps(prev => [...prev, newSwap])
    
    // 車両の割り当てを更新
    const updatedVehicles = vehicles.map(vehicle => {
      if (vehicle.id === swapOriginalVehicleId) {
        return { ...vehicle, driver: undefined }
      }
      if (vehicle.id === swapNewVehicleId) {
        return { ...vehicle, driver: driver.name }
      }
      return vehicle
    })
    
    setVehicles(updatedVehicles)
    
    // モーダルを閉じてリセット
    setShowVehicleSwapModal(false)
    setSwapDriverId(null)
    setSwapOriginalVehicleId(null)
    setSwapNewVehicleId(null)
    setSwapReason('')
    
    alert(`${driver.name}の車両を${originalVehicle.plateNumber}から${newVehicle.plateNumber}に変更しました`)
  }

  // 点検予約処理関数
  const handleInspectionReservation = async () => {
    if (!selectedInspectionVehicle || !inspectionReservationStartDate || !inspectionReservationEndDate) {
      alert('車両と予約期間を選択してください')
      return
    }

    // 日付文字列をローカル時間で正しく解釈する
    const startDate = new Date(inspectionReservationStartDate + 'T00:00:00')
    const endDate = new Date(inspectionReservationEndDate + 'T00:00:00')
    
    // 日付の妥当性チェック
    if (startDate > endDate) {
      alert('開始日は終了日より前の日付を選択してください')
      return
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    
    if (startDate < today) {
      alert('開始日は今日以降の日付を選択してください')
      return
    }
    
    // 点検種別に応じて期限を計算
    const inspectionDeadline = inspectionType === 'crane_annual' && selectedInspectionVehicle.craneAnnualInspectionDate
      ? getNextAnnualInspectionDate(selectedInspectionVehicle.craneAnnualInspectionDate)
      : getNextInspectionDate(selectedInspectionVehicle.inspectionDate)
    
    if (endDate > inspectionDeadline) {
      alert('終了日は点検期限を超えることはできません')
      return
    }
    
    // 開始日を予約日として使用（期間内のいずれかの日として）
    const reservationDate = startDate
    
    // 点検予約をデータベースに保存
    try {
      const driverInfo = drivers.find(d => d.name === selectedInspectionVehicle.driver)
      
      await InspectionReservationService.createFromVehicleInspection(
        selectedInspectionVehicle.id,
        selectedInspectionVehicle.plateNumber,
        driverInfo?.id,
        driverInfo?.name,
        reservationDate,
        inspectionDeadline,
        // 日付範囲情報と点検種別をmemoに追加
        `点検種別: ${inspectionType === 'crane_annual' ? 'クレーン年次点検' : '定期点検'}\n${isSameDay(startDate, endDate) 
          ? inspectionMemo
          : `日付範囲: ${format(startDate, 'yyyy-MM-dd')} ~ ${format(endDate, 'yyyy-MM-dd')}${inspectionMemo ? `\n${inspectionMemo}` : ''}`}`
      )

      // 担当ドライバーに通知を送信（日付範囲対応）
      if (driverInfo) {
        const dateRangeMessage = isSameDay(startDate, endDate) 
          ? startDate.toLocaleDateString('ja-JP')
          : `${startDate.toLocaleDateString('ja-JP')} ~ ${endDate.toLocaleDateString('ja-JP')}`
        
        const memoText = inspectionMemo?.trim() ? `\n備考: ${inspectionMemo}` : ''
        const inspectionTypeName = inspectionType === 'crane_annual' ? 'クレーン年次点検' : '定期点検'
        const customMessage = `担当車両 ${selectedInspectionVehicle.plateNumber} の${inspectionTypeName}が ${dateRangeMessage} で予約されました。${memoText}`
        
        await DriverNotificationService.create({
          driverId: driverInfo.id,
          type: 'inspection_reserved',
          title: `${inspectionTypeName}予約完了のお知らせ`,
          message: customMessage,
          priority: 'medium',
          isRead: false,
          actionRequired: false,
          scheduledFor: reservationDate
        })
      }

      // データベース保存成功後、最新の点検予約データを再取得
      const updatedReservations = await InspectionReservationService.getAll()
      const bookingsMap: {[key: string]: {isReservationCompleted: boolean, memo: string, hasCraneInspection: boolean, reservationDate?: string, vehicleId: number, inspectionDeadline: string}} = {}
      
      updatedReservations.forEach(reservation => {
        if (reservation.status === 'scheduled') {
          // memoから日付範囲情報を抽出
          const memo = reservation.memo || ''
          const dateRangeMatch = memo.match(/日付範囲: (\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/)
          
          const bookingData = {
            isReservationCompleted: true,
            memo: reservation.memo || '',
            hasCraneInspection: false,
            reservationDate: reservation.scheduledDate.toISOString().split('T')[0],
            vehicleId: reservation.vehicleId,
            inspectionDeadline: reservation.deadlineDate.toISOString().split('T')[0]
          }
          
          if (dateRangeMatch) {
            // 期間予約の場合：期間内の全日付にキーを作成
            const startDateStr = dateRangeMatch[1]
            const endDateStr = dateRangeMatch[2]
            const startDate = new Date(startDateStr + 'T00:00:00')
            const endDate = new Date(endDateStr + 'T00:00:00')
            const dates = eachDayOfInterval({ start: startDate, end: endDate })
            
            dates.forEach(date => {
              const dateKey = `${reservation.vehicleId}_${format(date, 'yyyy-MM-dd')}`
              bookingsMap[dateKey] = bookingData
            })
          } else {
            // 単日予約の場合：従来通り
            const bookingKey = `${reservation.vehicleId}_${reservation.scheduledDate.toISOString().split('T')[0]}`
            bookingsMap[bookingKey] = bookingData
          }
        }
      })
      
      setInspectionBookings(bookingsMap)
      
    } catch (error) {
      console.error('Failed to save inspection reservation:', error)
      alert('点検予約の保存に失敗しました。')
      return
    }

    // 予約日が今日の場合、車両のステータスを「点検中」に変更
    if (isSameDay(reservationDate, today)) {
      const updatedVehicles = vehicles.map(vehicle => 
        vehicle.id === selectedInspectionVehicle.id 
          ? { ...vehicle, status: 'inspection' as const }
          : vehicle
      )
      setVehicles(updatedVehicles)
    }

    // モーダルを閉じてリセット
    setShowInspectionReservationModal(false)
    setSelectedInspectionVehicle(null)
    setInspectionReservationStartDate('')
    setInspectionReservationEndDate('')
    setInspectionMemo('')

    const memoText = inspectionMemo.trim() ? `\n備考: ${inspectionMemo}` : ''
    const dateRangeText = isSameDay(startDate, endDate) 
      ? format(startDate, 'yyyy年MM月dd日', { locale: ja })
      : `${format(startDate, 'yyyy年MM月dd日', { locale: ja })} ~ ${format(endDate, 'yyyy年MM月dd日', { locale: ja })}`
    alert(`${selectedInspectionVehicle.plateNumber} の点検予約を ${dateRangeText} で設定しました${isSameDay(reservationDate, today) ? '（車両ステータスを「点検中」に変更しました）' : ''}${memoText}`)
  }

  // 点検予約取り消し処理
  const handleCancelReservation = async (bookingKey: string, vehiclePlateNumber: string) => {
    if (!confirm(`${vehiclePlateNumber} の点検予約を取り消しますか？`)) return

    try {
      // データベースから該当する予約を検索して削除
      const booking = inspectionBookings[bookingKey]
      if (booking) {
        const reservations = await InspectionReservationService.getByVehicleId(booking.vehicleId)
        const targetReservation = reservations.find(r => 
          r.scheduledDate.toISOString().split('T')[0] === booking.reservationDate &&
          r.status === 'scheduled'
        )
        
        if (targetReservation) {
          // データベースから完全に削除
          await InspectionReservationService.delete(targetReservation.id)
          
          // 担当ドライバーにキャンセル通知を送信
          const vehicle = vehicles.find(v => v.id === booking.vehicleId)
          if (vehicle && vehicle.driver) {
            const driver = drivers.find(d => d.name === vehicle.driver)
            if (driver) {
              await DriverNotificationService.createVehicleInspectionCancelledNotification(
                driver.id,
                vehiclePlateNumber,
                new Date(booking.reservationDate!),
                driver.name,
                driver.employeeId
              )
            }
          }
        }
      }

      // データベースから最新の点検予約データを再取得して状態を更新
      const updatedReservations = await InspectionReservationService.getAll()
      const bookingsMap: {[key: string]: {isReservationCompleted: boolean, memo: string, hasCraneInspection: boolean, reservationDate?: string, vehicleId: number, inspectionDeadline: string}} = {}
      
      updatedReservations.forEach(reservation => {
        if (reservation.status === 'scheduled') {
          // memoから日付範囲情報を抽出
          const memo = reservation.memo || ''
          const dateRangeMatch = memo.match(/日付範囲: (\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/)
          
          const bookingData = {
            isReservationCompleted: true,
            memo: reservation.memo || '',
            hasCraneInspection: false,
            reservationDate: reservation.scheduledDate.toISOString().split('T')[0],
            vehicleId: reservation.vehicleId,
            inspectionDeadline: reservation.deadlineDate.toISOString().split('T')[0]
          }
          
          if (dateRangeMatch) {
            // 期間予約の場合：期間内の全日付にキーを作成
            const startDateStr = dateRangeMatch[1]
            const endDateStr = dateRangeMatch[2]
            const startDate = new Date(startDateStr + 'T00:00:00')
            const endDate = new Date(endDateStr + 'T00:00:00')
            const dates = eachDayOfInterval({ start: startDate, end: endDate })
            
            dates.forEach(date => {
              const dateKey = `${reservation.vehicleId}_${format(date, 'yyyy-MM-dd')}`
              bookingsMap[dateKey] = bookingData
            })
          } else {
            // 単日予約の場合：従来通り
            const bookingKey = `${reservation.vehicleId}_${reservation.scheduledDate.toISOString().split('T')[0]}`
            bookingsMap[bookingKey] = bookingData
          }
        }
      })
      
      setInspectionBookings(bookingsMap)

      alert(`${vehiclePlateNumber} の点検予約を取り消しました。担当ドライバーに通知を送信しました。`)
    } catch (error) {
      console.error('Failed to cancel inspection reservation:', error)
      alert('点検予約の取り消しに失敗しました。')
    }
  }

  // 一時的車両割り当て処理
  const handleTemporaryAssignment = async () => {
    if (!tempAssignDriverId || !tempAssignVehicleId || !tempAssignStartDate || !tempAssignEndDate) {
      alert('すべての項目を入力してください')
      return
    }

    const startDate = new Date(tempAssignStartDate)
    const endDate = new Date(tempAssignEndDate)
    
    if (startDate > endDate) {
      alert('終了日は開始日以降の日付を選択してください')
      return
    }

    const driver = drivers.find(d => d.id === tempAssignDriverId)
    const vehicle = vehicles.find(v => v.id === tempAssignVehicleId)

    if (!driver || !vehicle) return

    const assignmentData = {
      driverId: tempAssignDriverId,
      driverName: driver.name,
      vehicleId: tempAssignVehicleId,
      plateNumber: vehicle.plateNumber,
      startDate,
      endDate,
      createdBy: 'admin', // TODO: 実際のユーザー名に変更
      originalDriverName: vehicle.driver // 元のドライバー名を保存
    }

    try {
      // データベースに保存
      const savedAssignment = await TemporaryAssignmentService.create(assignmentData)
      
      // 一時割り当てが今日開始される場合、車両のドライバーを更新
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const assignmentStart = new Date(startDate)
      assignmentStart.setHours(0, 0, 0, 0)
      
      if (assignmentStart <= today) {
        // 車両のドライバーを新しいドライバーに更新
        await VehicleService.update(vehicle.id, { driver: driver.name })
        
        // ローカル状態の車両情報を更新
        setVehicles(prev => prev.map(v => 
          v.id === vehicle.id ? { ...v, driver: driver.name } : v
        ))
      }
      
      // ローカル状態を更新
      setTemporaryAssignments(prev => [...prev, savedAssignment])
      
      // モーダルを閉じてリセット
      setShowTempAssignModal(false)
      setTempAssignDriverId(null)
      setTempAssignVehicleId(null)
      setTempAssignStartDate('')
      setTempAssignEndDate('')
      
      const statusMessage = assignmentStart <= today ? 
        '（車両のドライバーを更新しました）' : 
        `（${format(assignmentStart, 'yyyy年MM月dd日', { locale: ja })}から自動的に割り当てられます）`
      
      alert(`${driver.name}に${vehicle.plateNumber}を${format(startDate, 'yyyy年MM月dd日', { locale: ja })}〜${format(endDate, 'yyyy年MM月dd日', { locale: ja })}の期間で一時割り当てしました${statusMessage}`)
    } catch (error) {
      console.error('一時的車両割り当ての保存に失敗しました:', error)
      alert('一時的車両割り当ての保存に失敗しました。もう一度お試しください。')
    }
  }

  // 一時割り当ての削除
  const handleDeleteTemporaryAssignment = async (assignmentId: number) => {
    const assignment = temporaryAssignments.find(a => a.id === assignmentId)
    if (!assignment) return

    if (!confirm(`${assignment.driverName}の${assignment.plateNumber}への一時割り当てを取り消しますか？\n期間: ${format(assignment.startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 ${format(assignment.endDate, 'yyyy年MM月dd日', { locale: ja })}`)) {
      return
    }

    try {
      // 削除前に車両のドライバーを元に戻す処理
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const assignmentStart = new Date(assignment.startDate)
      assignmentStart.setHours(0, 0, 0, 0)
      const assignmentEnd = new Date(assignment.endDate)
      assignmentEnd.setHours(23, 59, 59, 999)

      // 現在、一時割り当てが有効期間中の場合、車両のドライバーを元に戻す
      if (today >= assignmentStart && today <= assignmentEnd) {
        const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
        if (vehicle) {
          // 元のドライバー名に戻す（元のドライバーがない場合はundefinedに）
          const originalDriver = assignment.originalDriverName || undefined
          await VehicleService.update(assignment.vehicleId, { driver: originalDriver })
          
          // ローカル状態の車両情報を更新
          setVehicles(prev => prev.map(v => 
            v.id === assignment.vehicleId ? { ...v, driver: originalDriver || undefined } : v
          ))
        }
      }

      // データベースから削除
      await TemporaryAssignmentService.delete(assignmentId)
      
      // ローカル状態を更新
      setTemporaryAssignments(prev => prev.filter(a => a.id !== assignmentId))
      
      alert(`${assignment.driverName}の${assignment.plateNumber}への一時割り当てを取り消しました`)
    } catch (error) {
      console.error('一時割り当ての削除に失敗しました:', error)
      alert('一時割り当ての削除に失敗しました。もう一度お試しください。')
    }
  }

  // 指定日の一時的割り当てを取得
  const getTemporaryAssignmentForDate = (vehicleId: number, date: Date) => {
    return temporaryAssignments.find(assignment => 
      assignment.vehicleId === vehicleId &&
      date >= assignment.startDate &&
      date <= assignment.endDate
    )
  }

  // 担当車両がないドライバーを取得（期間を考慮）
  const getUnassignedDrivers = (startDate?: Date, endDate?: Date) => {
    const assignedDriverNames = vehicles
      .filter(v => v.driver)
      .map(v => v.driver)
    
    return drivers.filter(driver => {
      // 外部ドライバーを除外
      if (driver.employeeId.startsWith('E')) {
        return false
      }
      
      // 恒常的に車両が割り当てられているドライバーを除外
      if (assignedDriverNames.includes(driver.name)) {
        return false
      }
      
      // 期間が指定されている場合、その期間に一時割り当てがないかチェック
      if (startDate && endDate) {
        const hasTemporaryAssignmentInPeriod = temporaryAssignments.some(assignment => {
          // ドライバーが一致し、期間が重複する場合は利用不可
          return assignment.driverId === driver.id && (
            // 割り当て期間が指定期間と重複するかチェック
            !(assignment.endDate < startDate || assignment.startDate > endDate)
          )
        })
        
        if (hasTemporaryAssignmentInPeriod) {
          return false
        }
        
        // 期間中に休暇を取っていないかチェック
        const isOnVacationInPeriod = vacationRequests.some(request => {
          if (request.driverName !== driver.name || request.workStatus !== 'day_off') {
            return false
          }
          
          const vacationDate = new Date(request.date)
          return vacationDate >= startDate && vacationDate <= endDate
        })
        
        if (isOnVacationInPeriod) {
          return false
        }
      }
      
      return true
    })
  }

  // 現在日付での未割り当て車両を取得
  const getUnassignedVehiclesForToday = useCallback(() => {
    const today = new Date()
    return getUnassignedVehiclesForDate(today)
  }, [getUnassignedVehiclesForDate, temporaryAssignments])



  // 車両稼働状況を計算
  const calculateVehicleOperationStatus = useCallback((vehicle: Vehicle, date: Date): VehicleOperationStatus => {
    // 1. 稼働不可期間チェック（最優先）
    const inoperativePeriod = vehicleInoperativePeriods.find(period => {
      if (period.vehicleId !== vehicle.id || period.status !== 'active') {
        return false
      }
      
      // 日付のみを比較（時刻を無視）
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const startDate = new Date(period.startDate.getFullYear(), period.startDate.getMonth(), period.startDate.getDate())
      const endDate = new Date(period.endDate.getFullYear(), period.endDate.getMonth(), period.endDate.getDate())
      
      return targetDate >= startDate && targetDate <= endDate
    })

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

    // 2. 点検予約日チェック（車両ステータスより優先）
    const bookingKey = `${vehicle.id}_${format(date, 'yyyy-MM-dd')}`
    const booking = inspectionBookings[bookingKey]
    
    if (booking && booking.isReservationCompleted) {
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'inactive_inspection',
        reason: '点検予約実施日',
        assignedDriverName: vehicle.driver
      }
    }


    // 3. 一時割り当てチェック
    const tempAssignment = getTemporaryAssignmentForDate(vehicle.id, date)
    if (tempAssignment) {
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        date,
        status: 'active',
        assignedDriverName: tempAssignment.driverName,
        reason: '一時割り当て中'
      }
    }

    // 4. 割り当て変更チェック
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
  }, [vehicleInoperativePeriods, inspectionBookings, vehicleAssignmentChanges, vacationRequests, drivers])




  // カレンダーの日付情報を生成（6週間分の完全なカレンダーグリッド）
  const generateCalendarDays = useMemo((): VehicleOperationCalendarDay[] => {
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
      
      // その日の点検車両を取得（通常の点検日と予約完了車両の両方）
      const dayInspectionVehicles = getInspectionVehiclesForDate(day)
      
      // 予約完了車両の情報を追加（点検期限日に予約完了表示）
      const reservedVehicles: any[] = []
      
      // 通常の点検車両に予約完了情報を追加
      dayInspectionVehicles.forEach(inspection => {
        // その日の点検日をキーとして予約情報を確認
        const bookingKey = `${inspection.vehicleId}_${format(day, 'yyyy-MM-dd')}`
        const booking = inspectionBookings[bookingKey]
        
        if (booking?.isReservationCompleted) {
          // 予約完了の場合は表示タイプを変更
          inspection.inspectionType = '点検（予約完了）'
          ;(inspection as any).isReserved = true
          ;(inspection as any).reservationDate = booking.reservationDate
          ;(inspection as any).memo = booking.memo
        }
      })
      
      // 点検車両（予約完了情報も含む）
      const allInspectionVehicles = dayInspectionVehicles

      return {
        date: day,
        vehicles: inactiveVehicles, // 未稼働車両のみ
        inspectionVehicles: allInspectionVehicles,
        totalVehicles: vehicles.length,
        activeVehicles,
        inactiveVehicles: inactiveVehicles.length,
        totalInspectionCount: allInspectionVehicles.length
      }
    })
  }, [calendarDate, vehicles, vehicleAssignmentChanges, inspectionBookings, calculateVehicleOperationStatus, getInspectionVehiclesForDate])

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

    setVehicleAssignmentChanges([...vehicleAssignmentChanges, newAssignment])

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

    setDriverVehicleNotifications([...driverVehicleNotifications, notification])
  }

  // 車両稼働不可期間設定関数
  const handleVehicleInoperative = async () => {
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

    try {
      // 元のドライバー情報を取得
      const originalDriver = drivers.find(d => d.name === selectedVehicle.driver)
      const tempVehicle = tempAssignVehicleId ? vehicles.find(v => v.id === tempAssignVehicleId) : null

      // 1. 稼働不可期間をデータベースに保存
      const newInoperativePeriod: Omit<VehicleInoperativePeriod, 'id'> = {
        vehicleId: selectedVehicle.id,
        plateNumber: selectedVehicle.plateNumber,
        startDate,
        endDate,
        reason: inoperativeReason,
        type: inoperativeType,
        originalDriverId: originalDriver?.id,
        originalDriverName: originalDriver?.name,
        tempAssignmentDriverId: tempAssignDriverId || undefined,
        tempAssignmentVehicleId: tempAssignVehicleId || undefined,
        status: 'active',
        createdAt: new Date(),
        createdBy: '管理者',
        notes: undefined
      }

      const savedPeriod = await VehicleInoperativePeriodService.create(newInoperativePeriod)

      // 3. 担当ドライバーに通知を送信
      if (originalDriver) {
        await DriverNotificationService.createVehicleInoperativeNotification(
          originalDriver.id,
          selectedVehicle.plateNumber,
          startDate,
          endDate,
          inoperativeReason,
          inoperativeType,
          tempVehicle?.plateNumber,
          originalDriver.name,
          originalDriver.employeeId
        )
      }

      // 4. ローカル状態を更新
      setVehicleInoperativePeriods(prev => [...prev, savedPeriod])

      // モーダルを閉じてフォームをリセット
      setShowInoperativeModal(false)
      setSelectedVehicle(null)
      setInoperativeStartDate('')
      setInoperativeEndDate('')
      setInoperativeReason('')
      setInoperativeType('repair')
      setTempAssignDriverId(null)
      setTempAssignVehicleId(null)

      const typeText = 
        inoperativeType === 'repair' ? '修理' :
        inoperativeType === 'maintenance' ? '整備' :
        inoperativeType === 'breakdown' ? '故障' : 'その他'

      alert(`車両 ${selectedVehicle.plateNumber} の稼働不可期間を設定しました。\n期間: ${format(startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 ${format(endDate, 'yyyy年MM月dd日', { locale: ja })}\n理由: ${typeText} - ${inoperativeReason}\n\n担当ドライバーに通知を送信しました。`)

    } catch (error) {
      console.error('稼働不可期間の設定に失敗しました:', error)
      alert('稼働不可期間の設定に失敗しました。もう一度お試しください。')
    }
  }

  // 稼働不可期間編集処理
  const handleEditInoperativePeriod = (period: VehicleInoperativePeriod) => {
    setEditingInoperativePeriod(period)
    setEditInoperativeStartDate(period.startDate.toISOString().split('T')[0])
    setEditInoperativeEndDate(period.endDate.toISOString().split('T')[0])
    setEditInoperativeReason(period.reason)
    setEditInoperativeType(period.type)
    setShowEditInoperativeModal(true)
  }

  // 稼働不可期間更新処理
  const handleUpdateInoperativePeriod = async () => {
    if (!editingInoperativePeriod || !editInoperativeStartDate || !editInoperativeEndDate || !editInoperativeReason) {
      alert('すべての項目を入力してください。')
      return
    }

    const startDate = new Date(editInoperativeStartDate)
    const endDate = new Date(editInoperativeEndDate)

    if (startDate > endDate) {
      alert('開始日は終了日より前に設定してください。')
      return
    }

    try {
      const updates: Partial<VehicleInoperativePeriod> = {
        startDate,
        endDate,
        reason: editInoperativeReason,
        type: editInoperativeType
      }

      const updatedPeriod = await VehicleInoperativePeriodService.update(editingInoperativePeriod.id, updates)

      // ローカル状態を更新
      setVehicleInoperativePeriods(prev => 
        prev.map(period => 
          period.id === editingInoperativePeriod.id ? updatedPeriod : period
        )
      )

      // モーダルを閉じてフォームをリセット
      setShowEditInoperativeModal(false)
      setEditingInoperativePeriod(null)
      setEditInoperativeStartDate('')
      setEditInoperativeEndDate('')
      setEditInoperativeReason('')
      setEditInoperativeType('repair')

      alert('稼働不可期間を更新しました。')

    } catch (error) {
      console.error('稼働不可期間の更新に失敗しました:', error)
      alert('稼働不可期間の更新に失敗しました。もう一度お試しください。')
    }
  }

  // 稼働不可期間削除処理
  const handleDeleteInoperativePeriod = async (period: VehicleInoperativePeriod) => {
    if (!confirm(`車両 ${period.plateNumber} の稼働不可期間を削除しますか？\n期間: ${format(period.startDate, 'yyyy年MM月dd日', { locale: ja })} 〜 ${format(period.endDate, 'yyyy年MM月dd日', { locale: ja })}`)) {
      return
    }

    try {
      await VehicleInoperativePeriodService.delete(period.id)

      // ローカル状態から削除
      setVehicleInoperativePeriods(prev => 
        prev.filter(p => p.id !== period.id)
      )

      // 期間がアクティブだった場合、車両ステータスを正常に戻す
      if (period.status === 'active') {
        await VehicleService.update(period.vehicleId, { status: 'normal' })
        
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === period.vehicleId 
            ? { ...vehicle, status: 'normal' }
            : vehicle
        ))
      }

      alert('稼働不可期間を削除しました。')

    } catch (error) {
      console.error('稼働不可期間の削除に失敗しました:', error)
      alert('稼働不可期間の削除に失敗しました。もう一度お試しください。')
    }
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
    setTempAssignDriverId(null)
    setTempAssignVehicleId(null)
  }

  // カレンダービューのレンダリング
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays
    const inoperativeStats = getInoperativeVehicleStats()

    return (
      <div className="space-y-6">

        {/* 車両稼働管理コントロール */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">車両稼働管理</h3>
              <p className="text-sm text-gray-600">車両の稼働不可期間設定と車両乗り換えが行えます。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* 車両乗り換え */}
              <button
                onClick={() => setShowVehicleSwapModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>車両乗り換え</span>
              </button>
              
              {/* 稼働不可期間設定 */}
            <button
              onClick={() => setShowInoperativeModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
                <AlertTriangle className="h-4 w-4" />
              <span>稼働不可期間を設定</span>
            </button>
            </div>
          </div>
        </div>

        {/* 車両管理情報 */}
        <div className="grid grid-cols-1 gap-6">
          {/* 点検期限車両（3ヶ月分） */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-500" />
                点検期限車両（3ヶ月分）
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {(() => {
                  // 当月・翌月・翌々月の3ヶ月分
                  const today = new Date()
                  const nextMonth = addMonths(today, 1)
                  const monthAfterNext = addMonths(today, 2)
                  
                  return vehicles.filter(vehicle => {
                    const inspections = getAllInspectionDates(
                      vehicle.inspectionDate,
                      vehicle.craneAnnualInspectionDate
                    ).map(item => item.date)
                    
                    return inspections.some(inspectionDate => {
                      const date = new Date(inspectionDate)
                      return (
                        (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) ||
                        (date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear()) ||
                        (date.getMonth() === monthAfterNext.getMonth() && date.getFullYear() === monthAfterNext.getFullYear())
                      )
                    })
                  }).length
                })()}台
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                // 当月・翌月・翌々月の3ヶ月分
                const today = new Date()
                const nextMonth = addMonths(today, 1)
                const monthAfterNext = addMonths(today, 2)
                
                const inspectionVehicles = vehicles.filter(vehicle => {
                  // 今後3ヶ月分の点検から、予約完了済みでない車両のみを抽出
                  const inspections = getAllInspectionDates(
                    vehicle.inspectionDate,
                    vehicle.craneAnnualInspectionDate
                  )
                  
                  const upcomingInspections = inspections.filter(inspection => {
                    const date = new Date(inspection.date)
                    const isInThreeMonths = (
                      (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) ||
                      (date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear()) ||
                      (date.getMonth() === monthAfterNext.getMonth() && date.getFullYear() === monthAfterNext.getFullYear())
                    )
                    
                    if (!isInThreeMonths) return false
                    
                    // この特定の点検期限に対して予約完了していないかチェック
                    const isReserved = Object.values(inspectionBookings).some(booking => 
                      booking.vehicleId === vehicle.id &&
                      booking.inspectionDeadline === format(date, 'yyyy-MM-dd') &&
                      booking.isReservationCompleted
                    )
                    return !isReserved
                  })
                  
                  return upcomingInspections.length > 0
                })
                .map(vehicle => {
                  // この車両の3ヶ月分の点検日を取得（予約完了していないもののみ）
                  const inspections = getAllInspectionDates(
                    vehicle.inspectionDate,
                    vehicle.craneAnnualInspectionDate
                  )
                  
                  const upcomingInspections = inspections.filter(inspection => {
                    const date = new Date(inspection.date)
                    const isInThreeMonths = (
                      (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) ||
                      (date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear()) ||
                      (date.getMonth() === monthAfterNext.getMonth() && date.getFullYear() === monthAfterNext.getFullYear())
                    )
                    
                    if (!isInThreeMonths) return false
                    
                    // この特定の点検期限に対して予約完了していないかチェック
                    const isReserved = Object.values(inspectionBookings).some(booking => 
                      booking.vehicleId === vehicle.id &&
                      booking.inspectionDeadline === format(date, 'yyyy-MM-dd') &&
                      booking.isReservationCompleted
                    )
                    return !isReserved
                  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  
                  return {
                    ...vehicle,
                    inspections: upcomingInspections
                  }
                }).sort((a, b) => {
                  // 最も近い点検日順にソート
                  const aFirstInspection = a.inspections[0]?.date
                  const bFirstInspection = b.inspections[0]?.date
                  if (!aFirstInspection) return 1
                  if (!bFirstInspection) return -1
                  return new Date(aFirstInspection).getTime() - new Date(bFirstInspection).getTime()
                })

                if (inspectionVehicles.length === 0) {
                  return (
                    <p className="text-sm text-gray-600">今後3ヶ月の点検期限車両はありません。</p>
                  )
                }

                return inspectionVehicles.map(vehicle => (
                  <div 
                    key={vehicle.id} 
                    className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedInspectionVehicle(vehicle)
                      setShowInspectionReservationModal(true)
                      setInspectionReservationStartDate('')
                      setInspectionReservationEndDate('')
                      setInspectionMemo('')
                  setInspectionType('regular')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                          <div className="text-sm text-gray-600">担当: {vehicle.driver || '未割当'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {vehicle.inspections.slice(0, 1).map((inspection, index) => (
                          <div key={index} className="text-xs">
                            <div className="font-medium text-blue-800">{inspection.type}</div>
                            <div className="text-blue-600">
                              期限: {format(new Date(inspection.date!), 'MM/dd', { locale: ja })}
                            </div>
                          </div>
                        ))}
                        {vehicle.inspections.length > 1 && (
                          <div className="text-xs text-blue-500 mt-1">
                            +{vehicle.inspections.length - 1}件
                          </div>
                        )}
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
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-700">点検期限</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">点検予約完了</span>
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
                    <div className="mb-2">
                      <span className={`text-sm font-medium ${
                        isCurrentDate ? 'text-blue-600' : 
                        !isCurrentMonth ? 'text-gray-400' :
                        'text-gray-700'
                      }`}>
                        {format(dayInfo.date, 'd')}
                      </span>
                    </div>

                    {/* 車両台数表示のみ - 現在の月のみ表示 */}
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {/* 未稼働車両台数 */}
                        {dayInfo.inactiveVehicles > 0 && (
                          <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded text-center">
                            未稼働: {dayInfo.inactiveVehicles}台
                          </div>
                        )}
                        
                        {/* 点検車両台数 */}
                        {dayInfo.inspectionVehicles && dayInfo.inspectionVehicles.length > 0 && (
                          <div className="space-y-1">
                            {(() => {
                              const normalInspections = dayInfo.inspectionVehicles.filter(v => !(v as any).isReserved)
                              const reservedInspections = dayInfo.inspectionVehicles.filter(v => (v as any).isReserved)
                              
                              return (
                                <>
                                  {normalInspections.length > 0 && (
                                    <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded text-center">
                                      点検期限: {normalInspections.length}台
                                    </div>
                                  )}
                                  {reservedInspections.length > 0 && (
                                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded text-center">
                                      予約完了: {reservedInspections.length}台
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        )}
                        
                        {/* 全車両稼働中 */}
                        {dayInfo.inactiveVehicles === 0 && (!dayInfo.inspectionVehicles || dayInfo.inspectionVehicles.length === 0) && (
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

  // 一時割り当てリストビューのレンダリング
  const renderTemporaryAssignmentsList = () => {
    const activeAssignments = temporaryAssignments.filter(assignment => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endDate = new Date(assignment.endDate)
      endDate.setHours(23, 59, 59, 999)
      return endDate >= today
    })

    const expiredAssignments = temporaryAssignments.filter(assignment => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endDate = new Date(assignment.endDate)
      endDate.setHours(23, 59, 59, 999)
      return endDate < today
    })

    const getAssignmentStatus = (assignment: TemporaryAssignment) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(assignment.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(assignment.endDate)
      endDate.setHours(23, 59, 59, 999)

      if (endDate < today) return { label: '期限切れ', color: 'text-gray-500 bg-gray-100' }
      if (startDate > today) return { label: '開始前', color: 'text-blue-700 bg-blue-100' }
      return { label: '実行中', color: 'text-green-700 bg-green-100' }
    }

    return (
      <div className="space-y-6">
        {/* ヘッダー部分 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-orange-600" />
                一時的割り当て管理
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
                  実行中: {activeAssignments.filter(a => getAssignmentStatus(a).label === '実行中').length}件
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
                  開始前: {activeAssignments.filter(a => getAssignmentStatus(a).label === '開始前').length}件
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              一時的な車両割り当ての管理と削除ができます。期限切れの割り当ては自動的に解除されます。
            </p>
          </div>
        </div>

        {/* 有効な一時割り当て */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              有効な一時割り当て ({activeAssignments.length}件)
            </h4>
            
            {activeAssignments.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">現在、有効な一時割り当てはありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ステータス</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ドライバー</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">車両</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">開始日</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">終了日</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">期間</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeAssignments.map((assignment) => {
                      const status = getAssignmentStatus(assignment)
                      const driver = drivers.find(d => d.id === assignment.driverId)
                      const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                      const daysDiff = Math.ceil((assignment.endDate.getTime() - assignment.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{assignment.driverName}</div>
                              <div className="text-sm text-gray-600">{driver?.team}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{assignment.plateNumber}</div>
                              <div className="text-sm text-gray-600">{vehicle?.model}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {format(assignment.startDate, 'yyyy/MM/dd (E)', { locale: ja })}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {format(assignment.endDate, 'yyyy/MM/dd (E)', { locale: ja })}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {daysDiff}日間
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleDeleteTemporaryAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>取り消し</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 期限切れの一時割り当て（参考用） */}
        {expiredAssignments.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <Archive className="h-4 w-4 mr-2 text-gray-500" />
                期限切れの一時割り当て ({expiredAssignments.length}件)
              </h4>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">ドライバー</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">車両</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">開始日</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">終了日</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">期間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expiredAssignments.slice(0, 10).map((assignment) => { // 最新10件のみ表示
                      const driver = drivers.find(d => d.id === assignment.driverId)
                      const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                      const daysDiff = Math.ceil((assignment.endDate.getTime() - assignment.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                      return (
                        <tr key={assignment.id} className="text-gray-500">
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm">{assignment.driverName}</div>
                              <div className="text-xs">{driver?.team}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm">{assignment.plateNumber}</div>
                              <div className="text-xs">{vehicle?.model}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {format(assignment.startDate, 'yyyy/MM/dd', { locale: ja })}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {format(assignment.endDate, 'yyyy/MM/dd', { locale: ja })}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {daysDiff}日間
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {expiredAssignments.length > 10 && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  ※ 最新10件のみ表示しています
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 稼働不可期間リストビューのレンダリング
  const renderInoperativePeriodsList = () => {
    const activePeriods = vehicleInoperativePeriods.filter(period => period.status === 'active')
    const completedPeriods = vehicleInoperativePeriods.filter(period => period.status === 'completed')

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'repair': return '修理'
        case 'maintenance': return '整備'
        case 'breakdown': return '故障'
        case 'other': return 'その他'
        default: return type
      }
    }

    const getTypeBadgeClass = (type: string) => {
      switch (type) {
        case 'repair': return 'bg-red-100 text-red-800'
        case 'maintenance': return 'bg-yellow-100 text-yellow-800'
        case 'breakdown': return 'bg-orange-100 text-orange-800'
        case 'other': return 'bg-gray-100 text-gray-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    const renderPeriodTable = (periods: VehicleInoperativePeriod[], title: string, isActive: boolean) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {title} ({periods.length}件)
            </h3>
          </div>
        </div>

        {periods.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>該当する稼働不可期間はありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    車両
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    理由
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当ドライバー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  {isActive && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                            <Truck className="h-4 w-4 text-gray-600" />
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {period.plateNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(period.startDate, 'yyyy/MM/dd', { locale: ja })} 〜
                      </div>
                      <div className="text-sm text-gray-900">
                        {format(period.endDate, 'yyyy/MM/dd', { locale: ja })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(period.type)}`}>
                        {getTypeLabel(period.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={period.reason}>
                        {period.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.originalDriverName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(period.createdAt, 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </td>
                    {isActive && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditInoperativePeriod(period)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteInoperativePeriod(period)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )

    return (
      <div className="space-y-6">
        {/* アクティブな稼働不可期間 */}
        {renderPeriodTable(activePeriods, 'アクティブな稼働不可期間', true)}
        
        {/* 完了した稼働不可期間 */}
        {renderPeriodTable(completedPeriods, '完了した稼働不可期間', false)}
      </div>
    )
  }

  // 担当者未割り当て車両ビューのレンダリング
  const renderUnassignedVehiclesView = () => {
    const today = new Date()
    const unassignedVehicles = getUnassignedVehiclesForDate(today)

    return (
      <div className="space-y-6">
        {/* ヘッダー部分 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserX className="h-5 w-5 mr-2 text-orange-600" />
                担当者未割り当て車両 ({unassignedVehicles.length}台)
              </h3>
              <div className="text-sm text-gray-600">
                {format(today, 'yyyy年MM月dd日', { locale: ja })} 現在
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              現在担当者が割り当てられていない車両の一覧です。車両をクリックして担当者のいないドライバーを期間限定で割り当てることができます。
            </p>
          </div>

          {/* 未割り当て車両一覧 */}
          <div className="p-6">
            {unassignedVehicles.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  担当者未割り当ての車両はありません
                </h4>
                <p className="text-gray-600">
                  現在、すべての車両に担当者が割り当てられています。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unassignedVehicles.map((vehicleWithReason) => (
                  <div
                    key={vehicleWithReason.id}
                    onClick={() => {
                      setTempAssignVehicleId(vehicleWithReason.id)
                      setShowTempAssignModal(true)
                    }}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 cursor-pointer transition-colors"
                  >
                    {/* 車両情報ヘッダー */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <Truck className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">
                          {vehicleWithReason.plateNumber}
                        </span>
                      </div>
                      <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        未割り当て
                      </div>
                    </div>

                    {/* 車両詳細情報 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">車種:</span>
                        <span className="font-medium text-gray-900">{vehicleWithReason.model}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">年式:</span>
                        <span className="font-medium text-gray-900">{vehicleWithReason.year}年</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">チーム:</span>
                        <span className="font-medium text-gray-900">{vehicleWithReason.team}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">車庫:</span>
                        <span className="font-medium text-gray-900">{vehicleWithReason.garage}</span>
                      </div>
                    </div>

                    {/* 未割り当て理由 */}
                    <div className="bg-white rounded-md p-3 border border-orange-200">
                      <div className="text-xs text-gray-600 mb-1">未割り当て理由:</div>
                      <div className="text-sm text-gray-900">{vehicleWithReason.reason}</div>
                    </div>

                    {/* アクション部分 */}
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="flex items-center justify-center text-sm text-orange-700">
                        <User className="h-4 w-4 mr-1" />
                        クリックして担当者を割り当て
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 現在の一時的割り当て一覧 */}
        {temporaryAssignments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                現在の一時的車両割り当て ({temporaryAssignments.length}件)
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {temporaryAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{assignment.driverName}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{assignment.plateNumber}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(assignment.startDate, 'MM/dd', { locale: ja })}〜{format(assignment.endDate, 'MM/dd', { locale: ja })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 一時的車両割り当てモーダル */}
        {showTempAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  一時的車両割り当て
                </h3>
                <button
                  onClick={() => {
                    setShowTempAssignModal(false)
                    setTempAssignDriverId(null)
                    setTempAssignVehicleId(null)
                    setTempAssignStartDate('')
                    setTempAssignEndDate('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選択された車両
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {tempAssignVehicleId ? (
                      <div className="flex items-center space-x-3">
                        <Truck className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicles.find(v => v.id === tempAssignVehicleId)?.plateNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            チーム: {vehicles.find(v => v.id === tempAssignVehicleId)?.team}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">車両が選択されていません</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    担当者のいないドライバー *
                  </label>
                  <select
                    value={tempAssignDriverId || ''}
                    onChange={(e) => setTempAssignDriverId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">ドライバーを選択してください</option>
                    {getUnassignedDrivers(
                      tempAssignStartDate ? new Date(tempAssignStartDate) : undefined,
                      tempAssignEndDate ? new Date(tempAssignEndDate) : undefined
                    ).map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.team})
                      </option>
                    ))}
                  </select>
                  {getUnassignedDrivers(
                    tempAssignStartDate ? new Date(tempAssignStartDate) : undefined,
                    tempAssignEndDate ? new Date(tempAssignEndDate) : undefined
                  ).length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      選択された期間に利用可能なドライバーはいません
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始日 *
                    </label>
                    <input
                      type="date"
                      value={tempAssignStartDate}
                      onChange={(e) => setTempAssignStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了日 *
                    </label>
                    <input
                      type="date"
                      value={tempAssignEndDate}
                      onChange={(e) => setTempAssignEndDate(e.target.value)}
                      min={tempAssignStartDate || new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 現在の一時的割り当て一覧 */}
                {temporaryAssignments.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">現在の一時的割り当て</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {temporaryAssignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <div>
                            <span className="font-medium">{assignment.driverName}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="font-medium">{assignment.plateNumber}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(assignment.startDate, 'MM/dd', { locale: ja })}〜{format(assignment.endDate, 'MM/dd', { locale: ja })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-700">
                    <Info className="h-4 w-4 inline mr-1" />
                    指定した期間中のみ、このドライバーに車両が割り当てられます。期間終了後は自動的に解除されます。
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTempAssignModal(false)
                    setTempAssignDriverId(null)
                    setTempAssignVehicleId(null)
                    setTempAssignStartDate('')
                    setTempAssignEndDate('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleTemporaryAssignment}
                  disabled={!tempAssignDriverId || !tempAssignVehicleId || !tempAssignStartDate || !tempAssignEndDate}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User className="h-4 w-4" />
                  <span>割り当て実行</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return renderCalendarView()
      case 'unassigned':
        return renderUnassignedVehiclesView()
      case 'temporary-assignments':
        return renderTemporaryAssignmentsList()
      case 'reservations':
        return renderReservationList()
      case 'inoperative-periods':
        return renderInoperativePeriodsList()
      default:
        return renderCalendarView()
    }
  }

  // 点検予約リスト表示
  const renderReservationList = () => {
    // 重複を除去するためにユニークキーでグループ化
    const uniqueReservations = new Map()
    
    Object.entries(inspectionBookings)
      .filter(([_, booking]) => booking.isReservationCompleted)
      .forEach(([key, booking]) => {
        // 車両ID + 予約日 + 期限日の組み合わせでユニークキーを作成
        const uniqueKey = `${booking.vehicleId}_${booking.reservationDate}_${booking.inspectionDeadline}`
        
        if (!uniqueReservations.has(uniqueKey)) {
          const vehicle = vehicles.find(v => v.id === booking.vehicleId)
          if (vehicle) {
            uniqueReservations.set(uniqueKey, {
              key,
              booking,
              vehicle,
              reservationDate: booking.reservationDate ? new Date(booking.reservationDate) : null,
              inspectionDeadline: new Date(booking.inspectionDeadline)
            })
          }
        }
      })
    
    const reservationList = Array.from(uniqueReservations.values())
      .sort((a, b) => {
        if (a.reservationDate && b.reservationDate) {
          return a.reservationDate.getTime() - b.reservationDate.getTime()
        }
        return 0
      })


    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
              点検予約リスト
            </h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {reservationList.length}件の予約
            </span>
          </div>

          {reservationList.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">点検予約がありません</h3>
              <p className="text-gray-500">車両の点検予約を作成すると、ここに表示されます。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservationList.map(({ key, booking, vehicle, reservationDate, inspectionDeadline }) => {
                if (!vehicle) return null
                
                const today = new Date()
                const daysUntilReservation = reservationDate ? Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
                const daysUntilDeadline = Math.ceil((inspectionDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                const isUrgent = daysUntilDeadline <= 7
                const isWarning = daysUntilDeadline <= 14 && daysUntilDeadline > 7

                return (
                  <div key={key} className={`p-4 rounded-lg border ${
                    isUrgent ? 'border-red-200 bg-red-50' :
                    isWarning ? 'border-orange-200 bg-orange-50' :
                    'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <Car className="h-5 w-5 text-blue-600" />
                            <h4 className="text-lg font-medium text-gray-900">{vehicle.plateNumber}</h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isUrgent ? 'bg-red-100 text-red-800' :
                            isWarning ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {isUrgent ? '緊急' : isWarning ? '注意' : '正常'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>予約日: {
                                (() => {
                                  if (!reservationDate) return '未設定'
                                  
                                  // memoから日付範囲情報を抽出
                                  const memo = booking.memo || ''
                                  const dateRangeMatch = memo.match(/日付範囲: (\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/)
                                  
                                  if (dateRangeMatch) {
                                    const [, startDateStr, endDateStr] = dateRangeMatch
                                    const startDate = new Date(startDateStr + 'T00:00:00')
                                    const endDate = new Date(endDateStr + 'T00:00:00')
                                    return `${format(startDate, 'yyyy年MM月dd日(E)', { locale: ja })} ~ ${format(endDate, 'yyyy年MM月dd日(E)', { locale: ja })}`
                                  }
                                  
                                  return format(reservationDate, 'yyyy年MM月dd日(E)', { locale: ja })
                                })()
                              }</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>点検期限: {format(inspectionDeadline, 'yyyy年MM月dd日(E)', { locale: ja })}</span>
                              {daysUntilDeadline > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  isUrgent ? 'bg-red-100 text-red-800' :
                                  isWarning ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  あと{daysUntilDeadline}日
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Truck className="h-4 w-4 mr-2" />
                              <span>{vehicle.model}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <span>担当: {vehicle.driver || '未割当'}</span>
                            </div>
                          </div>
                        </div>

                        {booking.memo && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-start">
                              <FileText className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-blue-900">備考・メモ</div>
                                <div className="text-sm text-blue-800 mt-1">{
                                  (() => {
                                    let memo = booking.memo || ''
                                    // 日付範囲情報を削除
                                    memo = memo.replace(/日付範囲: \d{4}-\d{2}-\d{2} ~ \d{4}-\d{2}-\d{2}\n?/, '').trim()
                                    return memo || '（メモなし）'
                                  })()
                                }</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {booking.hasCraneInspection && (
                          <div className="text-sm text-orange-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            クレーン年次点検も含む
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleCancelReservation(key, vehicle.plateNumber)}
                        className="ml-4 flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>取り消し</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // メインコンポーネントのreturn文
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
                <p className="text-xs text-blue-600 mt-1">
                  ※ 点検予約は上部の「点検期限車両（3ヶ月分）」セクションで行ってください
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
                            value={tempAssignVehicleId || ''}
                            onChange={(e) => setTempAssignVehicleId(e.target.value ? parseInt(e.target.value) : null)}
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
                            value={tempAssignDriverId || ''}
                            onChange={(e) => setTempAssignDriverId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!tempAssignVehicleId}
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

                      {tempAssignVehicleId && tempAssignDriverId && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center text-blue-800">
                            <Info className="h-5 w-5 mr-2" />
                            <span className="font-medium">一時割り当て予約</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            {drivers.find(d => d.id === tempAssignDriverId)?.name} を 
                            {vehicles.find(v => v.id === tempAssignVehicleId)?.plateNumber} に
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

      {/* 車両乗り換えモーダル */}
      {showVehicleSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <RotateCcw className="h-5 w-5 mr-2 text-blue-600" />
                車両乗り換え
              </h3>
              <button
                onClick={() => setShowVehicleSwapModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ドライバー選択 *
                </label>
                <select
                  value={swapDriverId || ''}
                  onChange={(e) => setSwapDriverId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">ドライバーを選択してください</option>
                  {drivers.filter(d => !d.employeeId.startsWith('E')).map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.team})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  変更前の車両 *
                </label>
                <select
                  value={swapOriginalVehicleId || ''}
                  onChange={(e) => setSwapOriginalVehicleId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">現在の車両を選択してください</option>
                  {vehicles.filter(v => v.driver).map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.driver}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  変更後の車両 *
                </label>
                <select
                  value={swapNewVehicleId || ''}
                  onChange={(e) => setSwapNewVehicleId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">新しい車両を選択してください</option>
                  {vehicles.filter(v => !v.driver || v.id === swapOriginalVehicleId).map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} {vehicle.driver ? `(現在: ${vehicle.driver})` : '(空車)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  乗り換え理由 *
                </label>
                <select
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">理由を選択してください</option>
                  <option value="車両故障">車両故障</option>
                  <option value="点検・修理">点検・修理</option>
                  <option value="ドライバー要望">ドライバー要望</option>
                  <option value="効率向上">効率向上</option>
                  <option value="緊急対応">緊急対応</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Info className="h-4 w-4 inline mr-1" />
                  この操作は1日限りの乗り換えです。履歴は保存されません。
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowVehicleSwapModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleVehicleSwap}
                disabled={!swapDriverId || !swapOriginalVehicleId || !swapNewVehicleId || !swapReason}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
                <span>乗り換え実行</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 点検予約モーダル */}
      {showInspectionReservationModal && selectedInspectionVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                点検予約（期限内の具体的日付指定）
              </h3>
              <button
                onClick={() => {
                  setShowInspectionReservationModal(false)
                  setSelectedInspectionVehicle(null)
                  setInspectionReservationStartDate('')
                  setInspectionReservationEndDate('')
                  setInspectionMemo('')
                  setInspectionType('regular')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 車両情報 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedInspectionVehicle.plateNumber}</div>
                    <div className="text-sm text-gray-600">{selectedInspectionVehicle.model}</div>
                    <div className="text-sm text-gray-600">担当: {selectedInspectionVehicle.driver || '未割当'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">{inspectionType === 'crane_annual' ? 'クレーン年次' : '定期'}点検期限</div>
                    <div className="text-sm text-red-700">
                      {(() => {
                        const deadline = inspectionType === 'crane_annual' && selectedInspectionVehicle.craneAnnualInspectionDate
                          ? getNextAnnualInspectionDate(selectedInspectionVehicle.craneAnnualInspectionDate)
                          : getNextInspectionDate(selectedInspectionVehicle.inspectionDate)
                        return format(deadline, 'yyyy年MM月dd日', { locale: ja })
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 点検種別選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  点検種別 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="inspectionType"
                      value="regular"
                      checked={inspectionType === 'regular'}
                      onChange={(e) => setInspectionType(e.target.value as 'regular' | 'crane_annual')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">定期点検（3ヶ月間隔）</div>
                      <div className="text-sm text-gray-600">通常の3ヶ月ごとの定期点検</div>
                    </div>
                  </label>
                  {selectedInspectionVehicle.craneAnnualInspectionDate && (
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="inspectionType"
                        value="crane_annual"
                        checked={inspectionType === 'crane_annual'}
                        onChange={(e) => setInspectionType(e.target.value as 'regular' | 'crane_annual')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">クレーン年次点検（1年間隔）</div>
                        <div className="text-sm text-gray-600">年1回のクレーン年次点検</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* 予約期間選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  点検実施予約期間 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      開始日
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={inspectionReservationStartDate}
                      onChange={(e) => setInspectionReservationStartDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max={(() => {
                        const deadline = inspectionType === 'crane_annual' && selectedInspectionVehicle.craneAnnualInspectionDate
                          ? getNextAnnualInspectionDate(selectedInspectionVehicle.craneAnnualInspectionDate)
                          : getNextInspectionDate(selectedInspectionVehicle.inspectionDate)
                        return format(deadline, 'yyyy-MM-dd')
                      })()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      終了日
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={inspectionReservationEndDate}
                      onChange={(e) => setInspectionReservationEndDate(e.target.value)}
                      min={inspectionReservationStartDate || format(new Date(), 'yyyy-MM-dd')}
                      max={(() => {
                        const deadline = inspectionType === 'crane_annual' && selectedInspectionVehicle.craneAnnualInspectionDate
                          ? getNextAnnualInspectionDate(selectedInspectionVehicle.craneAnnualInspectionDate)
                          : getNextInspectionDate(selectedInspectionVehicle.inspectionDate)
                        return format(deadline, 'yyyy-MM-dd')
                      })()}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  点検期限内の日付範囲で点検を予約します
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ※ 期限: {(() => {
                    const deadline = inspectionType === 'crane_annual' && selectedInspectionVehicle.craneAnnualInspectionDate
                      ? getNextAnnualInspectionDate(selectedInspectionVehicle.craneAnnualInspectionDate)
                      : getNextInspectionDate(selectedInspectionVehicle.inspectionDate)
                    return format(deadline, 'yyyy年MM月dd日', { locale: ja })
                  })()}まで
                </p>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備考・メモ
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="点検内容や特記事項があれば入力してください"
                  value={inspectionMemo}
                  onChange={(e) => setInspectionMemo(e.target.value)}
                />
              </div>

              {/* 点検種類表示 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">予約する点検内容</div>
                  {inspectionType === 'regular' ? (
                    <div>• 定期点検（3ヶ月間隔）</div>
                  ) : (
                    <div>• クレーン年次点検（1年間隔）</div>
                  )}
                  <div className="text-xs text-red-600 mt-2">
                    この期限内に実施する必要があります
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowInspectionReservationModal(false)
                  setSelectedInspectionVehicle(null)
                  setInspectionReservationStartDate('')
                  setInspectionReservationEndDate('')
                  setInspectionMemo('')
                  setInspectionType('regular')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleInspectionReservation}
                disabled={!inspectionReservationStartDate || !inspectionReservationEndDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>予約設定</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 稼働不可期間編集モーダル */}
      {showEditInoperativeModal && editingInoperativePeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  稼働不可期間の編集
                </h3>
                <button
                  onClick={() => {
                    setShowEditInoperativeModal(false)
                    setEditingInoperativePeriod(null)
                    setEditInoperativeStartDate('')
                    setEditInoperativeEndDate('')
                    setEditInoperativeReason('')
                    setEditInoperativeType('repair')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 車両情報表示 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {editingInoperativePeriod.plateNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      担当ドライバー: {editingInoperativePeriod.originalDriverName || '未割当'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 開始日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editInoperativeStartDate}
                  onChange={(e) => setEditInoperativeStartDate(e.target.value)}
                />
              </div>

              {/* 終了日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editInoperativeEndDate}
                  onChange={(e) => setEditInoperativeEndDate(e.target.value)}
                />
              </div>

              {/* タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editInoperativeType}
                  onChange={(e) => setEditInoperativeType(e.target.value as 'repair' | 'maintenance' | 'breakdown' | 'other')}
                >
                  <option value="repair">修理</option>
                  <option value="maintenance">整備</option>
                  <option value="breakdown">故障</option>
                  <option value="other">その他</option>
                </select>
              </div>

              {/* 理由 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="稼働不可の理由を入力してください"
                  value={editInoperativeReason}
                  onChange={(e) => setEditInoperativeReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditInoperativeModal(false)
                  setEditingInoperativePeriod(null)
                  setEditInoperativeStartDate('')
                  setEditInoperativeEndDate('')
                  setEditInoperativeReason('')
                  setEditInoperativeType('repair')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateInoperativePeriod}
                disabled={!editInoperativeStartDate || !editInoperativeEndDate || !editInoperativeReason}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>更新</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}