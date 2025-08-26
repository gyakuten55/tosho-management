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
import { Vehicle } from '@/types'
import { getNextInspectionDate } from '@/utils/inspectionUtils'

interface DriverVehicleInfoProps {
  assignedVehicle: Vehicle
  vehicleSwapNotifications?: any[]
}

export default function DriverVehicleInfo({ 
  assignedVehicle, 
  vehicleSwapNotifications = []
}: DriverVehicleInfoProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
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
      case 'normal':
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


  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }


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
              <span className="text-sm font-medium text-gray-600">点検日</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {assignedVehicle.inspectionDate.toLocaleDateString('ja-JP')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {assignedVehicle.model.includes('クレーン') ? '車検・クレーン年次点検・定期点検統合' : '車検・定期点検統合'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">次回点検予定</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {getNextInspectionDate(assignedVehicle.inspectionDate).toLocaleDateString('ja-JP')}
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



  return renderOverview()
} 