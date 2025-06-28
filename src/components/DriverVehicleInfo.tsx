'use client'

import { useState } from 'react'
import { 
  Car, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  MapPin, 
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react'
import { Vehicle, InspectionSchedule } from '@/types'

interface DriverVehicleInfoProps {
  assignedVehicle: Vehicle
  upcomingInspections: InspectionSchedule[]
  vehicleSwapNotifications?: any[]
}

export default function DriverVehicleInfo({ 
  assignedVehicle, 
  upcomingInspections,
  vehicleSwapNotifications = []
}: DriverVehicleInfoProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inspection':
        return 'bg-blue-100 text-blue-800'
      case 'breakdown':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '稼働中'
      case 'maintenance':
        return 'メンテナンス中'
      case 'inspection':
        return '点検中'
      case 'breakdown':
        return '故障中'
      default:
        return '不明'
    }
  }

  const getInspectionPriority = (date: Date) => {
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 3) return 'urgent'
    if (diffDays <= 7) return 'warning'
    return 'normal'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const tabs = [
    { id: 'overview', label: '概要', icon: Info },
    { id: 'inspections', label: '点検予定', icon: Wrench }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 車両基本情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Car className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assignedVehicle.plateNumber}</h2>
            <p className="text-gray-600">{assignedVehicle.model} ({assignedVehicle.year}年)</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(assignedVehicle.status)}`}>
              {getStatusLabel(assignedVehicle.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">車庫</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{assignedVehicle.garage}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">前回点検</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {assignedVehicle.lastInspection.toLocaleDateString('ja-JP')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">次回点検</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {assignedVehicle.nextInspection.toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>

      {/* 注意事項・メモ */}
      {assignedVehicle.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">注意事項</h3>
              <p className="text-yellow-700">{assignedVehicle.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* 車両交換通知 */}
      {vehicleSwapNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">車両交換のお知らせ</h3>
              <div className="space-y-2">
                {vehicleSwapNotifications.map((notification, index) => (
                  <div key={index} className="text-blue-700 text-sm">
                    {notification.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInspections = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">今後の点検予定</h3>
      
      {upcomingInspections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="text-gray-600">予定されている点検はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingInspections.map((inspection) => {
            const priority = getInspectionPriority(inspection.date)
            const daysUntil = Math.ceil((inspection.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            
            return (
              <div key={inspection.id} className={`border rounded-xl p-4 ${getPriorityColor(priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Wrench className="h-5 w-5" />
                      <h4 className="font-semibold">{inspection.type}</h4>
                      {priority === 'urgent' && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          緊急
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium">予定日:</span> {formatDate(inspection.date)}
                      </div>
                      <div>
                        <span className="font-medium">残り日数:</span> {daysUntil}日
                      </div>
                    </div>

                    {daysUntil <= 7 && (
                      <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium">
                          {daysUntil <= 1 ? '明日以降' : `${daysUntil}日後`}に点検が予定されています。
                          {daysUntil <= 3 && '車両の使用を控えてください。'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'inspections':
        return renderInspections()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
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

      {/* コンテンツ */}
      {renderContent()}
    </div>
  )
} 