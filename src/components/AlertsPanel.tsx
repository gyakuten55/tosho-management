'use client'

import { useState } from 'react'
import { AlertTriangle, Bell, CheckCircle, X, Clock, Car, Users } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Vehicle } from '@/types'

interface AlertsPanelProps {
  vehicles: Vehicle[]
}

interface Alert {
  id: string
  type: string
  title: string
  message: string
  time: Date
  status: string
  priority: string
}

export default function AlertsPanel({ vehicles }: AlertsPanelProps) {
  // アラートの状態管理
  const [alertStatuses, setAlertStatuses] = useState<{ [key: string]: string }>({})

  // 車両データからアラートを生成
  const generateAlerts = (): Alert[] => {
    const vehicleAlerts: Alert[] = []
    
    vehicles.forEach((vehicle) => {
      const daysUntilInspection = differenceInDays(vehicle.nextInspection, new Date())
      
      // 故障車両のアラート
      if (vehicle.status === 'breakdown') {
        vehicleAlerts.push({
          id: `breakdown-${vehicle.id}`,
          type: 'emergency',
          title: '車両故障発生',
          message: `${vehicle.plateNumber}（${vehicle.driver || '未割当'}）にて故障が発生しました。代替車両の手配が必要です。`,
          time: new Date(Date.now() - 1000 * 60 * 15),
          status: alertStatuses[`breakdown-${vehicle.id}`] || 'new',
          priority: 'high',
        })
      }
      
      // 点検期限のアラート
      if (daysUntilInspection <= 1) {
        vehicleAlerts.push({
          id: `inspection-urgent-${vehicle.id}`,
          type: 'inspection',
          title: '点検期限アラート',
          message: `${vehicle.plateNumber}の定期点検が${daysUntilInspection === 0 ? '今日' : '明日'}に迫っています。${vehicle.driver ? `ドライバー${vehicle.driver}に通知済み。` : ''}`,
          time: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: alertStatuses[`inspection-urgent-${vehicle.id}`] || 'acknowledged',
          priority: daysUntilInspection < 0 ? 'high' : 'medium',
        })
      } else if (daysUntilInspection <= 7) {
        vehicleAlerts.push({
          id: `inspection-warning-${vehicle.id}`,
          type: 'inspection',
          title: '点検期限注意',
          message: `${vehicle.plateNumber}の定期点検が${daysUntilInspection}日後です。準備をお願いします。`,
          time: new Date(Date.now() - 1000 * 60 * 60 * 4),
          status: alertStatuses[`inspection-warning-${vehicle.id}`] || 'info',
          priority: 'low',
        })
      }
    })
    
    // システム通知
    const systemAlerts: Alert[] = [
      {
        id: 'vacation-request-1',
        type: 'schedule',
        title: '休暇申請承認待ち',
        message: '鈴木一郎より明日の休暇申請。代替ドライバーの確保をお願いします。',
        time: new Date(Date.now() - 1000 * 60 * 60 * 4),
        status: alertStatuses['vacation-request-1'] || 'pending',
        priority: 'low',
      },
      {
        id: 'system-maintenance',
        type: 'notification',
        title: 'システムメンテナンス予告',
        message: '明日23:00-24:00にシステムメンテナンスを実施します。',
        time: new Date(Date.now() - 1000 * 60 * 60 * 6),
        status: alertStatuses['system-maintenance'] || 'info',
        priority: 'low',
      }
    ]
    
    return [...vehicleAlerts, ...systemAlerts]
      .sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 4)
  }

  const alerts = generateAlerts()

  // ボタンハンドラー関数
  const handleMarkAllAsRead = () => {
    const newStatuses: { [key: string]: string } = {}
    alerts.forEach(alert => {
      if (alert.status === 'new') {
        newStatuses[alert.id] = 'acknowledged'
      } else {
        newStatuses[alert.id] = alert.status
      }
    })
    setAlertStatuses(prev => ({ ...prev, ...newStatuses }))
  }

  const handleAcknowledge = (alertId: string) => {
    setAlertStatuses(prev => ({ ...prev, [alertId]: 'acknowledged' }))
  }

  const handleApprove = (alertId: string) => {
    setAlertStatuses(prev => ({ ...prev, [alertId]: 'approved' }))
    alert('申請が承認されました。')
  }

  const handleReject = (alertId: string) => {
    setAlertStatuses(prev => ({ ...prev, [alertId]: 'rejected' }))
    alert('申請が却下されました。')
  }

  const handleDismiss = (alertId: string) => {
    setAlertStatuses(prev => ({ ...prev, [alertId]: 'dismissed' }))
  }

  // 表示用にフィルターされたアラート（dismissedは除外）
  const visibleAlerts = alerts.filter(alert => {
    const currentStatus = alertStatuses[alert.id] || alert.status
    return currentStatus !== 'dismissed'
  })

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'inspection':
        return <Car className="h-5 w-5 text-yellow-500" />
      case 'schedule':
        return <Users className="h-5 w-5 text-blue-500" />
      case 'notification':
        return <Bell className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getStatusBadge = (alert: Alert) => {
    const currentStatus = alertStatuses[alert.id] || alert.status
    switch (currentStatus) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">新規</span>
      case 'acknowledged':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">確認済み</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">承認待ち</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">承認済み</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">却下済み</span>
      case 'info':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">情報</span>
      default:
        return null
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`
    } else {
      return format(date, 'MM月dd日 HH:mm', { locale: ja })
    }
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary-600" />
            重要アラート・通知
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {visibleAlerts.filter(alert => (alertStatuses[alert.id] || alert.status) === 'new').length}
            </span>
          </h3>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            すべて既読にする
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {visibleAlerts.map((alert) => {
          const currentStatus = alertStatuses[alert.id] || alert.status
          return (
            <div key={alert.id} className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${getPriorityColor(alert.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getAlertIcon(alert.type)}
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    {getStatusBadge(alert)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(alert.time)}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {currentStatus === 'new' && (
                    <button 
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      確認
                    </button>
                  )}
                  {currentStatus === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(alert.id)}
                        className="px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        承認
                      </button>
                      <button 
                        onClick={() => handleReject(alert.id)}
                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        却下
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {visibleAlerts.length === 0 && (
        <div className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">アラートなし</h3>
          <p className="text-gray-600">現在、重要なアラートはありません。</p>
        </div>
      )}
    </div>
  )
} 