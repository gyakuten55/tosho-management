'use client'

import { useState, useCallback } from 'react'
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
import VehicleManagement from '@/components/VehicleManagement'
import DriverManagement from '@/components/DriverManagement'
import SettingsComponent from '@/components/Settings'
import Login from '@/components/Login'
import DriverDashboard from '@/components/DriverDashboard'
import DriverVacationRequest from '@/components/DriverVacationRequest'
import DriverVehicleInfo from '@/components/DriverVehicleInfo'
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
  const [currentView, setCurrentView] = useState('vehicles')
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
      setCurrentView('vehicles')
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
    }
  }

  // メモ化された関数
  const handleVacationRequestsChange = useCallback((requests: any[]) => {
    setVacationRequests(requests)
  }, [])

  const handleVacationStatsChange = useCallback((stats: any[]) => {
    setVacationStats(stats)
  }, [])

  const handleVacationSettingsChange = useCallback((settings: any) => {
    setVacationSettings(settings)
  }, [])

  const handleVacationNotificationsChange = useCallback((notifications: any[]) => {
    setVacationNotifications(notifications)
  }, [])

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
          onVacationRequestsChange={handleVacationRequestsChange}
          onVacationStatsChange={handleVacationStatsChange}
          onVacationSettingsChange={handleVacationSettingsChange}
          onVacationNotificationsChange={handleVacationNotificationsChange}
          onVehiclesChange={setVehicles}
        />
      case 'settings':
        return <SettingsComponent 
          vacationSettings={vacationSettings}
          onVacationSettingsChange={handleVacationSettingsChange}
        />
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