'use client'

import { useState, useEffect } from 'react'
import {
  LogOut,
  Car,
  Users,
  Calendar,
  Clock,
  LayoutDashboard
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ViewerVehicleList from './viewer/ViewerVehicleList'
import ViewerDriverList from './viewer/ViewerDriverList'
import ViewerCalendar from './viewer/ViewerCalendar'
import ViewerOperations from './viewer/ViewerOperations'

interface ViewerDashboardProps {
  onLogout: () => void
}

type ViewTab = 'overview' | 'vehicles' | 'drivers' | 'calendar' | 'operations'

export default function ViewerDashboard({ onLogout }: ViewerDashboardProps) {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview')
  const [currentTime, setCurrentTime] = useState(new Date())

  // 現在時刻の更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // タブナビゲーション
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '概要', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'vehicles', label: '車両', icon: <Car className="h-5 w-5" /> },
    { id: 'drivers', label: 'ドライバー', icon: <Users className="h-5 w-5" /> },
    { id: 'calendar', label: 'カレンダー', icon: <Calendar className="h-5 w-5" /> },
    { id: 'operations', label: '運用', icon: <Clock className="h-5 w-5" /> },
  ]

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return renderOverview()
      case 'vehicles':
        return <ViewerVehicleList />
      case 'drivers':
        return <ViewerDriverList />
      case 'calendar':
        return <ViewerCalendar />
      case 'operations':
        return <ViewerOperations />
      default:
        return renderOverview()
    }
  }

  const renderOverview = () => (
    <div className="space-y-4">
      {/* 現在時刻 */}
      <div className="text-center py-4">
        <h3 className="text-xs font-medium mb-2 text-slate-500">現在時刻</h3>
        <div className="text-3xl font-semibold text-slate-900">
          {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-sm mt-2 text-slate-600">
          {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">閲覧可能な情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentTab('vehicles')}
            className="flex items-start p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-200"
          >
            <div className="flex-shrink-0 mr-3">
              <Car className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">車両情報</h3>
              <p className="text-xs text-slate-600">車両一覧・点検スケジュール</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('drivers')}
            className="flex items-start p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-200"
          >
            <div className="flex-shrink-0 mr-3">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">ドライバー情報</h3>
              <p className="text-xs text-slate-600">ドライバー一覧・勤務状態</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('calendar')}
            className="flex items-start p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-200"
          >
            <div className="flex-shrink-0 mr-3">
              <Calendar className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">カレンダー</h3>
              <p className="text-xs text-slate-600">休暇・点検・稼働状況</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('operations')}
            className="flex items-start p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-200"
          >
            <div className="flex-shrink-0 mr-3">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">運用状況</h3>
              <p className="text-xs text-slate-600">車両運用・出庫時間</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900">閲覧モード</h1>
              <p className="text-xs text-slate-600">{user?.displayName}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-md hover:bg-slate-200 transition-colors min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                currentTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
        {renderContent()}
      </main>
    </div>
  )
}
