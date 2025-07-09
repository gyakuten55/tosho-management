'use client'

import { AlertTriangle, TrendingUp, Car } from 'lucide-react'
import { Vehicle, Driver } from '@/types'
import { differenceInDays } from 'date-fns'

interface DashboardStatsProps {
  vehicles: Vehicle[]
  drivers: Driver[]
}

export default function DashboardStats({ vehicles, drivers }: DashboardStatsProps) {
  // 点検要注意車両（7日以内または期限超過）
  const urgentInspections = vehicles.filter(vehicle => {
    const daysUntilInspection = differenceInDays(vehicle.nextInspection, new Date())
    return daysUntilInspection <= 7
  }).length

  // 今日動いている車両台数（故障・点検・修理中でない車両）
  const operatingVehicles = vehicles.filter(vehicle => 
    vehicle.status === 'normal' || vehicle.status === 'maintenance_due'
  ).length

  const stats = [
    {
      title: '今日動いている車両台数',
      value: operatingVehicles.toString(),
      change: '',
      changeType: 'neutral',
      icon: Car,
      color: 'bg-blue-500',
    },
    {
      title: '点検要注意車両',
      value: urgentInspections.toString(),
      change: '+1',
      changeType: 'increase',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const isIncrease = stat.changeType === 'increase'
        const isNeutral = stat.changeType === 'neutral'
        
        return (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {!isNeutral && (
                  <div className="flex items-center mt-2">
                    <TrendingUp 
                      className={`h-4 w-4 mr-1 ${
                        isIncrease ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'
                      }`} 
                    />
                    <span 
                      className={`text-sm font-medium ${
                        isIncrease ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">前週比</span>
                  </div>
                )}
              </div>
              <div className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 