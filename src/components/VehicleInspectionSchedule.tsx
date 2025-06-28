'use client'

import { Calendar, Clock, AlertTriangle, CheckCircle, Car } from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Vehicle } from '@/types'

interface VehicleInspectionScheduleProps {
  vehicles: Vehicle[]
  onViewChange?: (view: string) => void
}

export default function VehicleInspectionSchedule({ vehicles, onViewChange }: VehicleInspectionScheduleProps) {
  // 車両データから点検予定を生成
  const inspections = vehicles
    .map(vehicle => {
      const daysUntilInspection = differenceInDays(vehicle.nextInspection, new Date())
      let status = '通常'
      if (daysUntilInspection < 0) {
        status = '緊急'
      } else if (daysUntilInspection <= 7) {
        status = '緊急'
      } else if (daysUntilInspection <= 30) {
        status = '注意'
      }

      return {
        id: vehicle.id,
        vehicleNumber: vehicle.plateNumber,
        type: '定期点検',
        date: vehicle.nextInspection,
        status,
        driver: vehicle.driver || '未割当',
        team: vehicle.team,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4) // 最初の4件のみ表示

  const getStatusColor = (status: string) => {
    switch (status) {
      case '緊急':
        return 'bg-red-100 text-red-800 border-red-200'
      case '注意':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '通常':
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
          {inspections.map((inspection) => (
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
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
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditInspection(inspection.id)}
                    className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    編集
                  </button>
                  <button 
                    onClick={() => handleSendNotification(inspection.vehicleNumber, inspection.driver)}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    通知送信
                  </button>
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