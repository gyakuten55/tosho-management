'use client'

import { useState } from 'react'
import { 
  Car, 
  Calendar, 
  Bell, 
  User, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  ArrowLeft
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function DriverPage() {
  const [currentView, setCurrentView] = useState('dashboard')

  // ドライバー情報（サンプル）
  const driverInfo = {
    name: '田中太郎',
    team: 'B',
    employeeId: 'B001',
    assignedVehicle: '品川 501 あ 1234',
  }

  // 通知情報
  const notifications = [
    {
      id: 1,
      type: 'inspection',
      title: '車両点検予定',
      message: '明日、車両点検が予定されています。代替車両に変更されます。',
      time: new Date(),
      priority: 'high',
    },
    {
      id: 2,
      type: 'vehicle_change',
      title: '車両変更通知',
      message: '本日の配車が「品川 505 か 7890」に変更されました。',
      time: addDays(new Date(), -1),
      priority: 'medium',
    },
  ]

  // 今日のスケジュール
  const todaySchedule = {
    startTime: '08:00',
    endTime: '17:00',
    route: '東京→大阪',
    vehicle: '品川 501 あ 1234',
    notes: '荷物の積み込みは09:00から開始予定',
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* ドライバー情報 */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{driverInfo.name}</h2>
            <p className="text-sm text-gray-500">{driverInfo.team} - {driverInfo.employeeId}</p>
          </div>
        </div>
      </div>

      {/* 今日のスケジュール */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary-600" />
          今日のスケジュール
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">勤務時間</span>
            <span className="font-medium">{todaySchedule.startTime} - {todaySchedule.endTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">配車車両</span>
            <span className="font-medium">{todaySchedule.vehicle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">運行ルート</span>
            <span className="font-medium">{todaySchedule.route}</span>
          </div>
          {todaySchedule.notes && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">{todaySchedule.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 通知 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary-600" />
            重要通知
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            {notifications.length}
          </span>
        </div>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'inspection' ? (
                    <Car className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(notification.time, 'MM月dd日 HH:mm', { locale: ja })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setCurrentView('leave_request')}
          className="card p-4 text-center hover:bg-gray-50 transition-colors"
        >
          <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-900">休暇申請</span>
        </button>
        <button className="card p-4 text-center hover:bg-gray-50 transition-colors">
          <Car className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <span className="text-sm font-medium text-gray-900">車両確認</span>
        </button>
      </div>
    </div>
  )

  const renderLeaveRequest = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">休暇申請</h1>
      </div>

      <div className="card p-4">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申請日
            </label>
            <input 
              type="date" 
              className="input-field"
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              休暇種別
            </label>
            <select className="input-field">
              <option value="annual">年次有給休暇</option>
              <option value="sick">病気休暇</option>
              <option value="personal">私用休暇</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              理由（任意）
            </label>
            <textarea 
              className="input-field" 
              rows={3}
              placeholder="休暇の理由を入力してください"
            ></textarea>
          </div>

          <button type="submit" className="w-full btn-primary">
            申請を送信
          </button>
        </form>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">申請履歴</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm">2024/01/15</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">承認済み</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm">2024/01/20</span>
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">審査中</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">東京陸送</h1>
              <p className="text-xs text-gray-500">ドライバーアプリ</p>
            </div>
          </div>
          <Settings className="h-6 w-6 text-gray-500" />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-4">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'leave_request' && renderLeaveRequest()}
      </div>
    </div>
  )
} 