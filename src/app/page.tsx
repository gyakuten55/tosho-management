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
import DepartureTimeManagement from '@/components/DepartureTimeManagement'
import { Vehicle, Driver, VacationRequest, DriverNotification, VehicleAssignmentChange, DriverVehicleNotification, VehicleInoperativePeriod, VehicleInoperativeNotification } from '@/types'
import VacationManagement from '@/components/VacationManagement'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading, signOut, isAdmin, isDriver } = useAuth()
  const [currentView, setCurrentView] = useState('vehicles')
  const [notifications, setNotifications] = useState<DriverNotification[]>([])

  const handleLogout = async () => {
    try {
      await signOut()
      setCurrentView('vehicles')
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
        onLogout={handleLogout}
      />
    )
  }

  // 管理者の場合は既存の管理画面を表示
  const renderContent = () => {
    switch (currentView) {
      case 'vehicles':
        return <VehicleManagement />
      case 'drivers':
        return <DriverManagement />
      case 'vacation':
        return <VacationManagement />
      case 'settings':
        return <SettingsComponent />
      case 'vehicle-operation':
        return <VehicleOperationManagement />
      case 'departure-time':
        return <DepartureTimeManagement />
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