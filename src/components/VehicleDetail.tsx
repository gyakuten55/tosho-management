'use client'

import { 
  ArrowLeft, 
  Edit, 
  Car, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Vehicle } from '@/types'

interface VehicleDetailProps {
  vehicle: Vehicle
  onEdit: () => void
  onBack: () => void
}

export default function VehicleDetail({ vehicle, onEdit, onBack }: VehicleDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inspection':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'repair':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />
      case 'inspection':
        return <Calendar className="h-5 w-5" />
      case 'repair':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '稼働中'
      case 'inspection':
        return '点検中'
      case 'repair':
        return '修理中'
      default:
        return '不明'
    }
  }

  const daysUntilInspection = differenceInDays(vehicle.nextInspection, new Date())
  const daysSinceLastInspection = differenceInDays(new Date(), vehicle.lastInspection)

  const inspectionStatus = () => {
    if (daysUntilInspection < 0) {
      return { color: 'text-red-600', text: `${Math.abs(daysUntilInspection)}日超過`, urgent: true }
    } else if (daysUntilInspection <= 7) {
      return { color: 'text-red-600', text: `あと${daysUntilInspection}日`, urgent: true }
    } else if (daysUntilInspection <= 30) {
      return { color: 'text-yellow-600', text: `あと${daysUntilInspection}日`, urgent: false }
    } else {
      return { color: 'text-green-600', text: `あと${daysUntilInspection}日`, urgent: false }
    }
  }

  const inspection = inspectionStatus()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Car className="h-8 w-8 mr-3 text-primary-600" />
            車両詳細
          </h1>
        </div>
        <button
          onClick={onEdit}
          className="btn-primary flex items-center space-x-2"
        >
          <Edit className="h-5 w-5" />
          <span>編集</span>
        </button>
      </div>

      {/* 基本情報カード */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.plateNumber}</h2>
            <p className="text-lg text-gray-600">{vehicle.model} ({vehicle.year}年)</p>
            <p className="text-sm text-gray-500">{vehicle.type}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(vehicle.status)}`}>
            {getStatusIcon(vehicle.status)}
            <span className="ml-2">{getStatusText(vehicle.status)}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">担当ドライバー</p>
              <p className="font-medium text-gray-900">{vehicle.driver || '未割当'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Car className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">チーム</p>
              <p className="font-medium text-gray-900">{vehicle.team}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">車庫情報</p>
              <p className="font-medium text-gray-900">{vehicle.garage}</p>
            </div>
          </div>
        </div>

        {vehicle.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">備考・特記事項</p>
                <p className="text-gray-900 mt-1">{vehicle.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 点検情報カード */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary-600" />
          点検情報
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">前回点検日</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {format(vehicle.lastInspection, 'yyyy年MM月dd日', { locale: ja })}
            </p>
            <p className="text-sm text-gray-500">{daysSinceLastInspection}日前</p>
          </div>

          <div className={`p-4 rounded-lg ${inspection.urgent ? 'bg-red-50' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">次回点検日</p>
              {inspection.urgent ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <Calendar className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {format(vehicle.nextInspection, 'yyyy年MM月dd日', { locale: ja })}
            </p>
            <p className={`text-sm font-medium ${inspection.color}`}>{inspection.text}</p>
          </div>
        </div>

        {inspection.urgent && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium text-red-800">
                点検期限が近づいています。速やかに点検の手配をしてください。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 点検予定通知設定カード */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary-600" />
          通知設定
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">1ヶ月前通知</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">有効</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">1週間前通知</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">有効</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">前々日・前日通知</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">有効</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800">通知設定</p>
              <p className="text-xs text-blue-700">
                通知OFF機能は無効化されており、すべての点検通知が自動で送信されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 