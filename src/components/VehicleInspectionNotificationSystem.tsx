'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Car, 
  Clock, 
  CheckCircle,
  X,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Vehicle, Driver, DriverNotification } from '@/types'

interface VehicleInspectionNotificationSystemProps {
  vehicles: Vehicle[]
  drivers: Driver[]
  onNotificationCreate: (notification: DriverNotification) => void
}

interface InspectionAlert {
  id: number
  vehicleId: number
  driverId: number
  vehiclePlateNumber: string
  driverName: string
  inspectionDate: Date
  alertType: '30_days' | '7_days' | '2_days' | '1_day'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  message: string
  created: Date
  acknowledged: boolean
}

export default function VehicleInspectionNotificationSystem({ 
  vehicles, 
  drivers, 
  onNotificationCreate 
}: VehicleInspectionNotificationSystemProps) {
  const [alerts, setAlerts] = useState<InspectionAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // 点検アラートの生成
  const generateInspectionAlerts = useCallback(() => {
    const today = new Date()
    const newAlerts: InspectionAlert[] = []

    vehicles.forEach(vehicle => {
      if (vehicle.driver && vehicle.nextInspection) {
        const inspectionDate = new Date(vehicle.nextInspection)
        const daysUntilInspection = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const driver = drivers.find(d => d.name === vehicle.driver)

        if (driver) {
          let alertType: '30_days' | '7_days' | '2_days' | '1_day' | null = null
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low'
          let message = ''

          // アラートタイプと優先度の決定
          if (daysUntilInspection === 30) {
            alertType = '30_days'
            priority = 'low'
            message = `${vehicle.plateNumber}の点検が1ヶ月後（${inspectionDate.toLocaleDateString('ja-JP')}）に予定されています。`
          } else if (daysUntilInspection === 7) {
            alertType = '7_days'
            priority = 'medium'
            message = `${vehicle.plateNumber}の点検が1週間後（${inspectionDate.toLocaleDateString('ja-JP')}）に予定されています。代替車両の準備を検討してください。`
          } else if (daysUntilInspection === 2) {
            alertType = '2_days'
            priority = 'high'
            message = `${vehicle.plateNumber}の点検が前々日（${inspectionDate.toLocaleDateString('ja-JP')}）に予定されています。必ず代替車両を確認してください。`
          } else if (daysUntilInspection === 1) {
            alertType = '1_day'
            priority = 'urgent'
            message = `${vehicle.plateNumber}の点検が明日（${inspectionDate.toLocaleDateString('ja-JP')}）に予定されています。この車両は使用できません。代替車両に変更してください。`
          } else if (daysUntilInspection <= 0) {
            alertType = '1_day'
            priority = 'urgent'
            message = `${vehicle.plateNumber}の点検日です。この車両は使用できません。直ちに代替車両に変更してください。`
          }

          if (alertType) {
            const existingAlert = alerts.find(a => 
              a.vehicleId === vehicle.id && 
              a.alertType === alertType &&
              !a.acknowledged
            )

            if (!existingAlert) {
              const alert: InspectionAlert = {
                id: Date.now() + Math.random(),
                vehicleId: vehicle.id,
                driverId: driver.id,
                vehiclePlateNumber: vehicle.plateNumber,
                driverName: driver.name,
                inspectionDate,
                alertType,
                priority,
                message,
                created: new Date(),
                acknowledged: false
              }

              newAlerts.push(alert)

              // DriverNotificationも作成
              const driverNotification: DriverNotification = {
                id: Date.now() + Math.random(),
                driverId: driver.id,
                type: 'vehicle_inspection',
                title: '車両点検通知',
                message: alert.message,
                priority,
                isRead: false,
                createdAt: new Date(),
                scheduledFor: inspectionDate,
                actionRequired: priority === 'urgent' || priority === 'high'
              }

              onNotificationCreate(driverNotification)
            }
          }
        }
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts])
      
      // 音声アラート
      if (soundEnabled && newAlerts.some(a => a.priority === 'urgent' || a.priority === 'high')) {
        playAlertSound()
      }
    }
  }, [vehicles, drivers, alerts, soundEnabled, onNotificationCreate])

  // アラート音の再生
  const playAlertSound = () => {
    if (typeof Audio !== 'undefined') {
      try {
        // ブラウザのbeep音を再生（実際の実装では専用の音声ファイルを使用）
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(context.destination)
        
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, context.currentTime)
        
        oscillator.start()
        oscillator.stop(context.currentTime + 0.2)
      } catch (error) {
        console.log('Audio alert not available')
      }
    }
  }

  // アラートの確認
  const acknowledgeAlert = (alertId: number) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    )
  }

  // 全アラートの確認
  const acknowledgeAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })))
  }

  // 自動更新
  useEffect(() => {
    if (autoRefresh) {
      generateInspectionAlerts()
      
      const interval = setInterval(() => {
        generateInspectionAlerts()
      }, 60000) // 1分ごとにチェック

      return () => clearInterval(interval)
    }
  }, [vehicles, drivers, autoRefresh, soundEnabled, generateInspectionAlerts])

  // 優先度に応じたスタイル
  const getAlertStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const activeAlerts = alerts.filter(alert => !alert.acknowledged)
  const urgentAlerts = activeAlerts.filter(alert => alert.priority === 'urgent')

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">車両点検通知システム</h3>
          {activeAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
            title={soundEnabled ? '音声アラート有効' : '音声アラート無効'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          {activeAlerts.length > 0 && (
            <button
              onClick={acknowledgeAllAlerts}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              全て確認済み
            </button>
          )}
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium text-gray-900 mb-3">通知設定</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">自動更新（1分間隔）</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">音声アラート</span>
            </label>
          </div>
        </div>
      )}

      {/* 緊急アラート */}
      {urgentAlerts.length > 0 && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-800">緊急：即座に対応が必要です</h4>
          </div>
          <p className="text-sm text-red-700">
            {urgentAlerts.length}台の車両で点検期限が迫っています。至急代替車両を手配してください。
          </p>
        </div>
      )}

      {/* アラート一覧 */}
      <div className="space-y-2">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>現在、点検アラートはありません</p>
            <p className="text-sm">すべての車両点検は適切にスケジュールされています</p>
          </div>
        ) : (
          activeAlerts
            .sort((a, b) => {
              const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
              return priorityOrder[b.priority] - priorityOrder[a.priority]
            })
            .map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${getAlertStyle(alert.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.priority)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium">{alert.vehiclePlateNumber}</h5>
                        <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                          {alert.driverName}
                        </span>
                        <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                          {alert.inspectionDate.toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {alert.created.toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="p-1 rounded-lg bg-white bg-opacity-50 hover:bg-opacity-75"
                    title="確認済みにする"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
} 