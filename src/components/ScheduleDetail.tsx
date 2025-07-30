'use client'

import { 
  ArrowLeft, 
  Edit, 
  Calendar,
  Users,
  Car,
  MapPin,
  Clock,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ArrowRight,
  User,
  Building,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DispatchSchedule, VehicleSwap, Driver, Vehicle } from '@/types'

interface ScheduleDetailProps {
  schedule: DispatchSchedule
  vehicleSwaps: VehicleSwap[]
  drivers: Driver[]
  vehicles: Vehicle[]
  onEdit: () => void
  onStatusChange: (scheduleId: number, newStatus: string) => void
  onBack: () => void
}

export default function ScheduleDetail({ 
  schedule, 
  vehicleSwaps, 
  drivers, 
  vehicles, 
  onEdit, 
  onStatusChange,
  onBack 
}: ScheduleDetailProps) {
  const driver = drivers.find(d => d.id === schedule.driverId)
  const vehicle = vehicles.find(v => v.id === schedule.vehicleId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '予定'
      case 'in_progress':
        return '運行中'
      case 'completed':
        return '完了'
      case 'cancelled':
        return 'キャンセル'
      default:
        return '不明'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <Play className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <Pause className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '至急'
      case 'high':
        return '高'
      case 'normal':
        return '通常'
      case 'low':
        return '低'
      default:
        return '通常'
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">配車予定詳細</h2>
            <p className="text-gray-600 mt-1">
              {format(schedule.date, 'yyyy年MM月dd日(E)', { locale: ja })} {schedule.timeSlot.start} - {schedule.timeSlot.end}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {schedule.status === 'scheduled' && (
            <button
              onClick={() => onStatusChange(schedule.id, 'in_progress')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>運行開始</span>
            </button>
          )}
          {schedule.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(schedule.id, 'completed')}
              className="btn-secondary flex items-center space-x-2"
            >
              <CheckCircle className="h-5 w-5" />
              <span>完了</span>
            </button>
          )}
          <button
            onClick={onEdit}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="h-5 w-5" />
            <span>編集</span>
          </button>
        </div>
      </div>

      {/* ステータス・優先度カード */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${getStatusColor(schedule.status)}`}>
              {getStatusIcon(schedule.status)}
              <span className="font-medium">{getStatusText(schedule.status)}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(schedule.priority)}`}>
              {getPriorityText(schedule.priority)}
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {schedule.team}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            作成: {format(schedule.createdAt, 'MM月dd日 HH:mm', { locale: ja })}
            {schedule.updatedAt.getTime() !== schedule.createdAt.getTime() && (
              <> / 更新: {format(schedule.updatedAt, 'MM月dd日 HH:mm', { locale: ja })}</>
            )}
          </div>
        </div>
      </div>

      {/* メイン情報 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配車情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">配車情報</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">ドライバー</h4>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{schedule.driverName}</p>
                  <p className="text-sm text-gray-500">社員ID: {driver?.employeeId}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">車両</h4>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{schedule.vehicleNumber}</p>
                  <p className="text-sm text-gray-500">{vehicle?.model}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">時間</h4>
              <div className="flex items-center space-x-2 text-gray-900">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{schedule.timeSlot.start} - {schedule.timeSlot.end}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ルート情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ルート情報</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">出発地</p>
                <p className="font-medium text-gray-900">{schedule.route.origin}</p>
              </div>
            </div>

            {schedule.route.waypoints && schedule.route.waypoints.length > 0 && (
              <div className="ml-8">
                <ArrowRight className="h-4 w-4 text-gray-400 mb-2" />
                <div className="space-y-1">
                  {schedule.route.waypoints.map((waypoint, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">{waypoint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">目的地</p>
                <p className="font-medium text-gray-900">{schedule.route.destination}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 顧客・荷物情報 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 顧客情報 */}
        {schedule.clientInfo && (
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">顧客情報</h3>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">顧客名</h4>
                <p className="text-gray-900">{schedule.clientInfo.name}</p>
              </div>
              
              {schedule.clientInfo.contact && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">連絡先</h4>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{schedule.clientInfo.contact}</span>
                  </div>
                </div>
              )}

              {schedule.clientInfo.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">備考</h4>
                  <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded">
                    {schedule.clientInfo.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 荷物情報 */}
        {schedule.cargoInfo && (
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">荷物情報</h3>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">種別</h4>
                <p className="text-gray-900">{schedule.cargoInfo.type}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700">台数</h4>
                <p className="text-gray-900">{schedule.cargoInfo.count}台</p>
              </div>

              {schedule.cargoInfo.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">詳細</h4>
                  <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded">
                    {schedule.cargoInfo.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 車両変更履歴 */}
      {vehicleSwaps.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">車両変更履歴</h3>
          </div>

          <div className="space-y-3">
            {vehicleSwaps.map((swap) => {
              const originalVehicle = vehicles.find(v => v.id === swap.originalVehicleId)
              const newVehicle = vehicles.find(v => v.id === swap.newVehicleId)
              
              return (
                <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {originalVehicle?.plateNumber} → {newVehicle?.plateNumber}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        swap.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {swap.status === 'pending' ? '承認待ち' :
                         swap.status === 'approved' ? '承認済み' : '完了'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(swap.swapTime, 'MM月dd日 HH:mm', { locale: ja })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{swap.reason}</p>
                  {swap.approvedBy && (
                    <p className="text-xs text-gray-500 mt-1">承認者: {swap.approvedBy}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 備考 */}
      {schedule.notes && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">備考</h3>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
            {schedule.notes}
          </p>
        </div>
      )}
    </div>
  )
} 