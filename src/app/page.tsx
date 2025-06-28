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
import { Vehicle, Driver, User, VacationRequest, DriverNotification, VehicleAssignmentChange, DriverVehicleNotification } from '@/types'
import { 
  initialVehicles, 
  initialDrivers, 
  initialVacationRequests,
  initialMonthlyVacationStats,
  initialVacationSettings,
  initialVacationNotifications,
  initialVehicleAssignmentChanges,
  initialDriverVehicleNotifications,
  samplePerformanceMetrics, 
  sampleMaintenanceReport,
  sampleFinancialReport
} from '@/data/sampleData'
import VacationManagement from '@/components/VacationManagement'

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState<string>('')
  const [currentView, setCurrentView] = useState('dashboard')
  const [isDriverMode, setIsDriverMode] = useState(false)
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [drivers, setDrivers] = useState(initialDrivers)
  const [vacationRequests, setVacationRequests] = useState(initialVacationRequests)
  const [vacationStats, setVacationStats] = useState(initialMonthlyVacationStats)
  const [vacationSettings, setVacationSettings] = useState(initialVacationSettings)
  const [vacationNotifications, setVacationNotifications] = useState(initialVacationNotifications)
  const [vehicleAssignmentChanges, setVehicleAssignmentChanges] = useState(initialVehicleAssignmentChanges)
  const [driverVehicleNotifications, setDriverVehicleNotifications] = useState(initialDriverVehicleNotifications)
  const [performanceMetrics, setPerformanceMetrics] = useState(samplePerformanceMetrics)
  const [maintenanceReports, setMaintenanceReports] = useState(sampleMaintenanceReport)
  const [financialReports, setFinancialReports] = useState(sampleFinancialReport)
  const [notifications, setNotifications] = useState<DriverNotification[]>([])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setLoginError('')
    // 運転手の場合は専用ダッシュボードに遷移
    if (user.role === 'driver') {
      setCurrentView('driver-dashboard')
      setIsDriverMode(true)
    }
  }

  const handleLoginError = (message: string) => {
    setLoginError(message)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('dashboard')
    setIsDriverMode(false)
  }

  // ログインしていない場合はログイン画面を表示
  if (!currentUser) {
    return (
      <div>
        <Login onLogin={handleLogin} onError={handleLoginError} />
        {loginError && (
          <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {loginError}
          </div>
        )}
      </div>
    )
  }

  // 運転手の場合は専用UIを表示
  if (isDriverMode) {
    return (
      <DriverDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout}
        vehicles={vehicles}
        vacationRequests={vacationRequests}
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
                <span className="text-gray-600">{currentUser.name}</span>
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
        return <VehicleManagement vehicles={vehicles} drivers={drivers} onVehiclesChange={setVehicles} />
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
          onVacationRequestsChange={setVacationRequests}
          onVacationStatsChange={setVacationStats}
          onVacationSettingsChange={setVacationSettings}
          onVacationNotificationsChange={setVacationNotifications}
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
          onVehicleAssignmentChangesChange={setVehicleAssignmentChanges}
          onDriverVehicleNotificationsChange={setDriverVehicleNotifications}
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