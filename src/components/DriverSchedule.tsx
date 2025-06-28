'use client'

import { Users, Calendar, Car, Clock, AlertCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, Vehicle } from '@/types'

interface DriverScheduleProps {
  drivers: Driver[]
  vehicles: Vehicle[]
}

export default function DriverSchedule({ drivers, vehicles }: DriverScheduleProps) {
  // ドライバーデータを表示用に変換
  const driverSchedules = drivers.map(driver => {
    const assignedVehicle = vehicles.find(v => v.plateNumber === driver.assignedVehicle)
    
    let statusText = ''
    let vehicle = ''
    let restRequest = null
    
    switch (driver.status) {
      case 'working':
        statusText = '出勤'
        vehicle = driver.assignedVehicle || '未割当'
        break
      case 'vacation':
        statusText = '休暇申請'
        vehicle = '未割当'
        restRequest = '明日'
        break
      case 'sick':
        statusText = '病気休暇'
        vehicle = '未割当'
        break
      case 'available':
        statusText = '待機中'
        vehicle = '未割当'
        break
    }

    // 車両変更チェック（簡易実装）
    if (assignedVehicle && (assignedVehicle.status === 'maintenance' || assignedVehicle.status === 'inspection')) {
      statusText = '車両変更'
      vehicle = `${driver.assignedVehicle} → 代替車両`
    }

    return {
      id: driver.id,
      name: driver.name,
      team: driver.team,
      status: statusText,
      vehicle,
      schedule: driver.status === 'working' ? '8:00-17:00' : '-',
      route: driver.status === 'working' ? '東京→大阪' : '-',
      restRequest,
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case '出勤':
        return 'bg-green-100 text-green-800 border-green-200'
      case '休暇申請':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '車両変更':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '出勤':
        return <Users className="h-4 w-4" />
      case '休暇申請':
        return <Calendar className="h-4 w-4" />
      case '車両変更':
        return <Car className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            ドライバースケジュール
          </h3>
          <button className="btn-primary text-sm">
            休暇管理
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
                          {driverSchedules.map((driver) => (
            <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{driver.name}</h4>
                    <span className="text-sm text-gray-500">({driver.team})</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(driver.status)}`}>
                      {getStatusIcon(driver.status)}
                      <span className="ml-1">{driver.status}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      <span className="truncate">{driver.vehicle}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {driver.schedule}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📍</span>
                      <span className="truncate">{driver.route}</span>
                    </div>
                    {driver.restRequest && (
                      <div className="flex items-center text-yellow-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        休暇申請: {driver.restRequest}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    編集
                  </button>
                  {driver.status === '車両変更' && (
                    <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      通知済み
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">今日の配車サマリー</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">出勤予定:</span>
              <span className="font-medium ml-1">47名</span>
            </div>
            <div>
              <span className="text-gray-600">休暇申請:</span>
              <span className="font-medium ml-1">8名</span>
            </div>
            <div>
              <span className="text-gray-600">車両変更:</span>
              <span className="font-medium ml-1">3名</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-center text-primary-600 hover:text-primary-700 font-medium text-sm">
            すべてのドライバー予定を表示
          </button>
        </div>
      </div>
    </div>
  )
} 