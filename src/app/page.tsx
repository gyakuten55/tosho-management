'use client'

import { useState } from 'react'
import { 
  Car, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Settings,
  Bell,
  Menu,
  X,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import DashboardStats from '@/components/DashboardStats'
import VehicleInspectionSchedule from '@/components/VehicleInspectionSchedule'
import VehicleManagement from '@/components/VehicleManagement'
import DriverManagement from '@/components/DriverManagement'
import SettingsComponent from '@/components/Settings'
import Login from '@/components/Login'
import DriverDashboard from '@/components/DriverDashboard'
import DriverVacationRequest from '@/components/DriverVacationRequest'
import DriverVehicleInfo from '@/components/DriverVehicleInfo'
import VehicleInspectionNotificationSystem from '@/components/VehicleInspectionNotificationSystem'
import VehicleOperationManagement from '@/components/VehicleOperationManagement'
import { Vehicle, Driver, VacationRequest, DriverNotification, VehicleAssignmentChange, DriverVehicleNotification, VehicleInoperativePeriod, VehicleInoperativeNotification } from '@/types'
import { 
  initialVehicles, 
  initialDrivers, 
  initialVacationRequests,
  initialMonthlyVacationStats,
  initialVacationSettings,
  initialVacationNotifications,
  initialVehicleAssignmentChanges,
  initialDriverVehicleNotifications,
  initialVehicleInoperativePeriods,
  initialVehicleInoperativeNotifications,
  samplePerformanceMetrics, 
  sampleMaintenanceReport,
  sampleFinancialReport
} from '@/data/sampleData'
import VacationManagement from '@/components/VacationManagement'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading, signOut, isAdmin, isDriver } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [drivers, setDrivers] = useState(initialDrivers)
  const [vacationRequests, setVacationRequests] = useState(initialVacationRequests)
  const [vacationStats, setVacationStats] = useState(initialMonthlyVacationStats)
  const [vacationSettings, setVacationSettings] = useState(initialVacationSettings)
  const [vacationNotifications, setVacationNotifications] = useState(initialVacationNotifications)
  const [vehicleAssignmentChanges, setVehicleAssignmentChanges] = useState(initialVehicleAssignmentChanges)
  const [driverVehicleNotifications, setDriverVehicleNotifications] = useState(initialDriverVehicleNotifications)
  const [vehicleInoperativePeriods, setVehicleInoperativePeriods] = useState(initialVehicleInoperativePeriods)
  const [vehicleInoperativeNotifications, setVehicleInoperativeNotifications] = useState(initialVehicleInoperativeNotifications)
  const [performanceMetrics, setPerformanceMetrics] = useState(samplePerformanceMetrics)
  const [maintenanceReports, setMaintenanceReports] = useState(sampleMaintenanceReport)
  const [financialReports, setFinancialReports] = useState(sampleFinancialReport)
  const [notifications, setNotifications] = useState<DriverNotification[]>([])

  const handleLogout = async () => {
    try {
      await signOut()
      setCurrentView('dashboard')
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ログインしていない場合はログイン画面を表示
  if (!user) {
    return <Login />
  }

  // 運転手の場合は専用UIを表示
  if (isDriver) {
    return (
      <DriverDashboard 
        currentUser={{
          id: parseInt(user.uid.replace(/[^0-9]/g, '')) || 1,
          name: user.displayName,
          role: user.role,
          employeeId: user.employeeId,
          team: 'チーム1', // デフォルトチーム名
          isActive: true,
          lastLogin: user.lastLogin
        }} 
        onLogout={handleLogout}
      />
    )
  }

  // 管理者の場合は既存の管理画面を表示
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">統合管理ダッシュボード</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('notifications')}
                  className="text-gray-500 hover:text-primary-600 cursor-pointer transition-colors"
                >
                  <Bell className="h-6 w-6" />
                </button>
                <span className="text-gray-600">{user.displayName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  ログアウト
                </button>
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">管</span>
                </div>
              </div>
            </div>
            
            <DashboardStats vehicles={vehicles} drivers={drivers} />
            
            <div className="space-y-6">
              <VehicleInspectionSchedule vehicles={vehicles} onViewChange={setCurrentView} />
            </div>
          </div>
        )
      case 'vehicles':
        return <VehicleManagement 
          vehicles={vehicles} 
          drivers={drivers} 
          onVehiclesChange={setVehicles}
          onDriversChange={setDrivers}
        />
      case 'drivers':
        return <DriverManagement 
          drivers={drivers} 
          vehicles={vehicles}
          onDriversChange={setDrivers}
          onVehiclesChange={setVehicles}
        />
      case 'vacation':
        return <VacationManagement
          vacationRequests={vacationRequests}
          vacationStats={vacationStats}
          vacationSettings={vacationSettings}
          vacationNotifications={vacationNotifications}
          drivers={drivers}
          vehicles={vehicles}
          onVacationRequestsChange={setVacationRequests}
          onVacationStatsChange={setVacationStats}
          onVacationSettingsChange={setVacationSettings}
          onVacationNotificationsChange={setVacationNotifications}
          onVehiclesChange={setVehicles}
        />
      case 'notifications':
        return <VehicleInspectionNotificationSystem 
          vehicles={vehicles}
          drivers={drivers}
          onNotificationCreate={(notification) => {
            setNotifications(prev => [...prev, notification])
          }}
        />
      case 'settings':
        return <SettingsComponent />
      case 'vehicle-operation':
        return <VehicleOperationManagement 
          vehicles={vehicles}
          drivers={drivers}
          vacationRequests={vacationRequests}
          vehicleAssignmentChanges={vehicleAssignmentChanges}
          driverVehicleNotifications={driverVehicleNotifications}
          vehicleInoperativePeriods={vehicleInoperativePeriods}
          vehicleInoperativeNotifications={vehicleInoperativeNotifications}
          onVehicleAssignmentChangesChange={setVehicleAssignmentChanges}
          onDriverVehicleNotificationsChange={setDriverVehicleNotifications}
          onVehicleInoperativePeriodsChange={setVehicleInoperativePeriods}
          onVehicleInoperativeNotificationsChange={setVehicleInoperativeNotifications}
          onVehiclesChange={setVehicles}
        />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  )
} 