'use client'

import { Calendar, Clock, AlertTriangle, CheckCircle, Car, Info } from 'lucide-react'
import { format, addDays, differenceInDays, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Vehicle, InspectionSchedule, VehicleInspectionNotification } from '@/types'
import { getNextInspectionDate } from '@/utils/inspectionUtils'
import { useState, useEffect, useCallback } from 'react'
import { InspectionService } from '@/services/inspectionService'
import { VehicleService } from '@/services/vehicleService'

interface VehicleInspectionScheduleProps {
  vehicles: Vehicle[]
  onViewChange?: (view: string) => void
  onVehiclesChange?: (vehicles: Vehicle[]) => void
}

export default function VehicleInspectionSchedule({ vehicles, onViewChange, onVehiclesChange }: VehicleInspectionScheduleProps) {
  const [inspectionSchedules, setInspectionSchedules] = useState<InspectionSchedule[]>([])
  const [vehicleInspectionNotifications, setVehicleInspectionNotifications] = useState<VehicleInspectionNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInspectionSchedules()
  }, [])

  const loadInspectionSchedules = async () => {
    try {
      setLoading(true)
      setError(null)
      const schedules = await InspectionService.getAll()
      setInspectionSchedules(schedules)
    } catch (err) {
      console.error('Failed to load inspection schedules:', err)
      setError('点検スケジュールの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 点検3ヶ月前通知チェック
  const checkVehicleInspectionNotifications = useCallback(() => {
    const today = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(today.getMonth() + 3)

    const notifications: VehicleInspectionNotification[] = []

    vehicles.forEach(vehicle => {
      // 基準点検日の3ヶ月前チェック
      const inspectionDate = new Date(vehicle.inspectionDate)
      const threeMonthsBefore = subMonths(inspectionDate, 3)
      
      // 今日が3ヶ月前の通知日かチェック
      if (today.toDateString() === threeMonthsBefore.toDateString()) {
        notifications.push({
          id: Date.now() + vehicle.id,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          inspectionType: 'vehicle_inspection',
          inspectionDate: inspectionDate,
          notificationDate: today,
          isRead: false,
          priority: 'high',
          message: `車両番号 ${vehicle.plateNumber} の点検が3ヶ月後（${format(inspectionDate, 'yyyy年MM月dd日', { locale: ja })}）に迫っています。点検予約を行ってください。`
        })
      }
    })

    if (notifications.length > 0) {
      setVehicleInspectionNotifications(notifications)
      console.log(`点検3ヶ月前通知: ${notifications.length}件`)
    }
  }, [vehicles, setVehicleInspectionNotifications])

  // 初期化時に車両データから点検予定を生成または更新
  useEffect(() => {
    if (inspectionSchedules.length === 0 && vehicles.length > 0) {
      // Supabaseからデータが空の場合、車両情報から生成
      generateInspectionSchedulesFromVehicles()
    }
    if (vehicles.length > 0) {
      checkVehicleInspectionNotifications()
    }
  }, [vehicles, inspectionSchedules, checkVehicleInspectionNotifications])

  const generateInspectionSchedulesFromVehicles = async () => {
    try {
      const inspections: InspectionSchedule[] = vehicles.map(vehicle => {
        const nextInspection = getNextInspectionDate(vehicle.inspectionDate)
        const daysUntilInspection = differenceInDays(nextInspection, new Date())
        let status: 'urgent' | 'warning' | 'normal' = 'normal'
        
        if (daysUntilInspection < 0) {
          status = 'urgent'
        } else if (daysUntilInspection <= 7) {
          status = 'urgent'
        } else if (daysUntilInspection <= 30) {
          status = 'warning'
        }

        return {
          id: vehicle.id,
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.plateNumber,
          type: '点検',
          date: nextInspection,
          status,
          driver: vehicle.driver || '未割当',
          team: vehicle.team,
          isReservationCompleted: false,
          memo: '',
          hasAnnualCraneInspection: vehicle.model.includes('クレーン')
        }
      })
      
      // 新しいスケジュールをSupabaseに保存（ローカル状態のみ更新）
      setInspectionSchedules(inspections)
      
      // 将来的にはSupabaseに保存する処理を追加
      // for (const inspection of inspections) {
      //   const existingInspection = await InspectionService.getById(inspection.id)
      //   if (!existingInspection) {
      //     await InspectionService.create(inspection)
      //   }
      // }
    } catch (err) {
      console.error('Failed to generate inspection schedules:', err)
      setError('点検スケジュールの生成に失敗しました')
    }
  }

  // 最初の4件の点検予定のみ表示
  const displayedInspections = inspectionSchedules
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4)


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '緊急':
        return <AlertTriangle className="h-4 w-4" />
      case '注意':
        return <Clock className="h-4 w-4" />
      case '通常':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  // ボタンハンドラー関数
  const handleAddInspection = () => {
    if (onViewChange) {
      onViewChange('vehicles')
    } else {
      alert('車両管理ページで新しい点検予定を追加できます。')
    }
  }

  const handleEditInspection = (inspectionId: number) => {
    if (onViewChange) {
      onViewChange('vehicles')
    } else {
      alert(`車両${inspectionId}の点検予定編集画面に移動します。`)
    }
  }

  const handleSendNotification = (vehicleNumber: string, driver: string) => {
    alert(`${vehicleNumber}（${driver}）に点検通知を送信しました。`)
  }

  const handleViewAllInspections = () => {
    if (onViewChange) {
      onViewChange('vehicles')
    } else {
      alert('車両管理ページで全ての点検予定を確認できます。')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
          <button 
            onClick={loadInspectionSchedules}
            className="ml-4 btn-primary"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Car className="h-5 w-5 mr-2 text-primary-600" />
            車両点検スケジュール
          </h3>
          <button 
            onClick={handleAddInspection}
            className="btn-primary text-sm"
          >
            新規追加
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {displayedInspections.map((inspection) => (
            <div key={inspection.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{inspection.vehicleNumber}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inspection.status)}`}>
                      {getStatusIcon(inspection.status)}
                      <span className="ml-1">{inspection.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(inspection.date, 'MM月dd日(E)', { locale: ja })}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📋</span>
                      {inspection.type}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">👤</span>
                      {inspection.driver} ({inspection.team})
                    </div>
                  </div>

                  {/* 点検予約は車両稼働管理ページで統一 */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        点検予約は「車両稼働管理」ページで統一管理されています
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <div className="text-xs text-gray-500 italic">
                    ※ 点検予約・編集は車両稼働管理ページで行ってください
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={handleViewAllInspections}
            className="w-full text-center text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            すべての点検予定を表示
          </button>
        </div>
      </div>
    </div>
  )
} 