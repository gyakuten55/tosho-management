'use client'

import { useState, useEffect } from 'react'
import { Users, Filter, User, Car } from 'lucide-react'
import { Driver, VacationRequest } from '@/types'
import { DriverService } from '@/services/driverService'
import { VacationService } from '@/services/vacationService'
import { format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ViewerDriverList() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [driversData, vacationsData] = await Promise.all([
          DriverService.getAll(),
          VacationService.getAll().catch(() => [])
        ])
        setDrivers(driversData)
        setVacationRequests(vacationsData)
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getDriverStatus = (driver: Driver) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayVacation = vacationRequests.find(req =>
      req.driverId === driver.id && isSameDay(req.date, today)
    )

    if (todayVacation) {
      if (todayVacation.workStatus === 'day_off') return '休暇'
      if (todayVacation.workStatus === 'night_shift') return '夜勤'
      if (todayVacation.workStatus === 'working') return '出勤'
    }

    // 休暇申請がない場合は出勤とみなす
    return '出勤'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '出勤':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">出勤</span>
      case '休暇':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">休暇</span>
      case '夜勤':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-violet-50 text-violet-700 border border-violet-200">夜勤</span>
      case '病欠':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200">病欠</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-50 text-slate-700 border border-slate-200">{status}</span>
    }
  }

  const getMonthlyOffDays = (driver: Driver) => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    return vacationRequests.filter(req =>
      req.driverId === driver.id &&
      req.date.getFullYear() === currentYear &&
      req.date.getMonth() + 1 === currentMonth &&
      req.workStatus === 'day_off'
    ).length
  }

  const filteredDrivers = drivers.filter(driver => {
    if (teamFilter !== 'all' && driver.team !== teamFilter) return false
    const status = getDriverStatus(driver)
    if (statusFilter !== 'all' && status !== statusFilter) return false
    return true
  })

  const teams = Array.from(new Set(drivers.map(d => d.team)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">総ドライバー数</p>
          <p className="text-2xl font-semibold text-slate-900">{drivers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">本日出勤</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {drivers.filter(d => getDriverStatus(d) === '出勤').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">本日休暇</p>
          <p className="text-2xl font-semibold text-blue-600">
            {drivers.filter(d => getDriverStatus(d) === '休暇').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">夜勤</p>
          <p className="text-2xl font-semibold text-violet-600">
            {drivers.filter(d => getDriverStatus(d) === '夜勤').length}
          </p>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">フィルター</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">チーム</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white"
            >
              <option value="all">すべて</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">勤務状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white"
            >
              <option value="all">すべて</option>
              <option value="出勤">出勤</option>
              <option value="休暇">休暇</option>
              <option value="夜勤">夜勤</option>
              <option value="病欠">病欠</option>
            </select>
          </div>
        </div>
      </div>

      {/* ドライバー一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">ドライバー一覧</h2>
          <p className="text-xs text-slate-600 mt-1">全{filteredDrivers.length}名</p>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredDrivers.map(driver => {
            const status = getDriverStatus(driver)
            const monthlyOffDays = getMonthlyOffDays(driver)
            return (
              <div key={driver.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{driver.name}</h3>
                      <p className="text-sm text-slate-600">社員番号: {driver.employeeId}</p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">チーム:</span>
                    <span className="ml-2 font-medium text-slate-900">{driver.team}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">今月の休暇:</span>
                    <span className="ml-2 font-medium text-slate-900">{monthlyOffDays}日</span>
                  </div>
                  {driver.assignedVehicle && (
                    <div className="col-span-2 flex items-center">
                      <Car className="h-4 w-4 text-slate-600 mr-1" />
                      <span className="text-slate-600">担当車両:</span>
                      <span className="ml-2 font-medium text-slate-900">{driver.assignedVehicle}</span>
                    </div>
                  )}
                  {driver.isNightShift && (
                    <div className="col-span-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-violet-50 text-violet-700 border border-violet-200">
                        夜勤勤務
                      </span>
                    </div>
                  )}
                </div>

                {driver.phone && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
                    <span className="text-slate-600">電話:</span>
                    <span className="ml-2 text-slate-900">{driver.phone}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
