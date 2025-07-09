'use client'

import { Car, Users, Settings, Home, CalendarDays, Bell, Truck, FileText } from 'lucide-react'

interface NavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  isExternal?: boolean
  url?: string
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'ダッシュボード', icon: Home },
    { id: 'vehicles', label: '車両管理', icon: Car },
    { id: 'drivers', label: 'ドライバー管理', icon: Users },
    { id: 'vacation', label: '休暇管理', icon: CalendarDays },
    { id: 'vehicle-operation', label: '車両稼働管理', icon: Truck },
    { id: 'stock-system', label: '資料ストック', icon: FileText, isExternal: true, url: 'https://tosho-stock.vercel.app/' },
    { id: 'notifications', label: '通知システム', icon: Bell },
    { id: 'settings', label: '設定', icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">東翔運輸</h2>
            <p className="text-sm text-gray-500">管理システム</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.isExternal && item.url) {
                      window.open(item.url, '_blank', 'noopener,noreferrer')
                    } else {
                      onViewChange(item.id)
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                  {item.isExternal && (
                    <svg 
                      className="h-4 w-4 text-gray-400 ml-auto" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">管</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">管理者</p>
            <p className="text-xs text-gray-500">admin@tokyo-rikuso.co.jp</p>
          </div>
        </div>
      </div>
    </div>
  )
} 