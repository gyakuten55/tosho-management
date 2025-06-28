'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  Car, 
  Calendar, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Settings,
  LogOut,
  User,
  CalendarCheck,
  Wrench,
  RefreshCw,
  Home
} from 'lucide-react'
import { User as UserType, Vehicle, DriverNotification, VacationRequest, InspectionSchedule, MonthlyVacationStats } from '@/types'
import DriverVacationRequest from './DriverVacationRequest'
import DriverVehicleInfo from './DriverVehicleInfo'
import { initialVacationRequests, initialDrivers } from '@/data/sampleData'

interface DriverDashboardProps {
  currentUser: UserType
  onLogout: () => void
}

export default function DriverDashboard({ currentUser, onLogout }: DriverDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null)
  const [notifications, setNotifications] = useState<DriverNotification[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>(initialVacationRequests)
  const [upcomingInspections, setUpcomingInspections] = useState<InspectionSchedule[]>([])
  const [monthlyVacationStats, setMonthlyVacationStats] = useState<MonthlyVacationStats | null>(null)

  // サンプルデータの初期化
  useEffect(() => {
    // 割り当て車両（サンプル）
    setAssignedVehicle({
      id: 1,
      plateNumber: '品川 501 あ 1234',
      type: '2トントラック',
      model: 'いすゞエルフ',
      year: 2022,
      driver: currentUser.name,
      team: currentUser.team,
      status: 'active',
      lastInspection: new Date('2024-11-15'),
      nextInspection: new Date('2025-02-15'),
      garage: '本社車庫',
      notes: '定期点検予定あり'
    })

    // 通知（サンプル）
    setNotifications([
      {
        id: 1,
        driverId: currentUser.id,
        type: 'vehicle_inspection',
        title: '車両点検のお知らせ',
        message: '2月15日に車両点検が予定されています。',
        priority: 'medium',
        isRead: false,
        createdAt: new Date(),
        scheduledFor: new Date('2025-02-15'),
        actionRequired: true
      }
    ])

    // 点検予定（サンプル）
    setUpcomingInspections([
      {
        id: 1,
        vehicleId: 1,
        vehicleNumber: '品川 501 あ 1234',
        type: '定期点検',
        date: new Date('2025-02-15'),
        status: 'warning',
        driver: currentUser.name,
        team: currentUser.team
      }
    ])

    // 月間休暇統計の生成
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const userVacations = vacationRequests.filter(req => 
      req.driverId === currentUser.id &&
      req.date.getFullYear() === currentYear &&
      req.date.getMonth() + 1 === currentMonth &&
      req.isOff
    )

    setMonthlyVacationStats({
      driverId: currentUser.id,
      driverName: currentUser.name,
      team: currentUser.team,
      employeeId: currentUser.employeeId,
      month: currentMonth,
      year: currentYear,
      totalOffDays: userVacations.length,
      requiredMinimumDays: 9,
      remainingRequiredDays: Math.max(0, 9 - userVacations.length),
      maxAllowedDays: 12
    })
  }, [currentUser, vacationRequests])

  const handleVacationRequest = (request: Omit<VacationRequest, 'id' | 'requestedAt'>) => {
    const newRequest: VacationRequest = {
      ...request,
      id: Math.max(...vacationRequests.map(r => r.id), 0) + 1,
      requestedAt: new Date()
    }
    setVacationRequests(prev => [...prev, newRequest])
  }

  const handleVacationDelete = (requestId: number) => {
    setVacationRequests(prev => prev.filter(req => req.id !== requestId))
  }

  const formatTime = (date: Date | undefined) => {
    if (!date) return '--:--'
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">おはようございます</h1>
          <p className="text-gray-600">{currentUser.name}さん（{currentUser.team}）</p>
          <p className="text-sm text-gray-500">社員番号: {currentUser.employeeId}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-500 hover:text-primary-600 cursor-pointer" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* 今日の情報カード */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 担当車両情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-blue-600" />
            担当車両
          </h2>
          {assignedVehicle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-700">{assignedVehicle.plateNumber}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assignedVehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                  assignedVehicle.status === 'inspection' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assignedVehicle.status === 'active' ? '稼働中' :
                   assignedVehicle.status === 'inspection' ? '点検中' : '修理中'}
                </span>
              </div>
              <p className="text-gray-600">{assignedVehicle.model}</p>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {assignedVehicle.garage}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">次回点検予定</span>
                  <span className="font-medium">
                    {assignedVehicle.nextInspection.toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('vehicle')}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                車両詳細を見る
              </button>
            </div>
          ) : (
            <p className="text-gray-500">担当車両が割り当てられていません</p>
          )}
        </div>

        {/* 点検予定 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-orange-600" />
            点検予定
          </h2>
          {upcomingInspections.length > 0 ? (
            <div className="space-y-3">
              {upcomingInspections.map(inspection => (
                <div key={inspection.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{inspection.vehicleNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inspection.status === 'urgent' ? 'bg-red-100 text-red-800' :
                      inspection.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inspection.status === 'urgent' ? '緊急' :
                       inspection.status === 'warning' ? '警告' : '正常' }
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{inspection.type}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">予定日</span>
                    <span className="font-medium">{inspection.date.toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">近日の点検予定はありません</p>
          )}
        </div>
      </div>

      {/* 通知パネル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2 text-blue-600" />
          通知
        </h2>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-lg border ${
                notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{notification.createdAt.toLocaleDateString('ja-JP')}</span>
                      {notification.actionRequired && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          要対応
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">新しい通知はありません</p>
        )}
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentView('vacation')}
            className="flex items-center justify-center space-x-2 bg-green-100 text-green-800 p-4 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>休暇申請</span>
          </button>
          <button
            onClick={() => setCurrentView('vehicle')}
            className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-800 p-4 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Car className="h-5 w-5" />
            <span>車両情報</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderVacationRequest = () => (
    <DriverVacationRequest
      currentUser={currentUser}
      existingRequests={vacationRequests}
      monthlyStats={monthlyVacationStats}
      onRequestSubmit={handleVacationRequest}
      onRequestDelete={handleVacationDelete}
      allUsers={initialDrivers}
    />
  )

  const renderVehicleInfo = () => (
    <DriverVehicleInfo
      assignedVehicle={assignedVehicle!}
      upcomingInspections={upcomingInspections}
    />
  )

  const renderContent = () => {
    switch (currentView) {
      case 'vacation':
        return renderVacationRequest()
      case 'vehicle':
        return assignedVehicle ? renderVehicleInfo() : (
          <div className="text-center py-8">
            <p className="text-gray-500">担当車両が割り当てられていません</p>
          </div>
        )
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>ダッシュボード</span>
            </button>
            <button
              onClick={() => setCurrentView('vacation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'vacation' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>休暇申請</span>
            </button>
            <button
              onClick={() => setCurrentView('vehicle')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                currentView === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>車両情報</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{currentUser.name}さん</span>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>
    </div>
  )
} 