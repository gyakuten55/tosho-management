'use client'

import { useState, useEffect } from 'react'
import { Clock, Car, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { DepartureTime, VacationRequest, Vehicle } from '@/types'
import { DepartureTimeService } from '@/services/departureTimeService'
import { VacationService } from '@/services/vacationService'
import { VehicleService } from '@/services/vehicleService'
import { format, addDays, subDays, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ViewerOperations() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [departureTimes, setDepartureTimes] = useState<DepartureTime[]>([])
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [departureData, vacationsData, vehiclesData] = await Promise.all([
          DepartureTimeService.getAll().catch(() => []),
          VacationService.getAll().catch(() => []),
          VehicleService.getAll().catch(() => [])
        ])
        setDepartureTimes(departureData)
        setVacationRequests(vacationsData)
        setVehicles(vehiclesData)
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

  const getDepartureTimesForDate = (date: Date) => {
    return departureTimes.filter(dt => isSameDay(dt.departureDate, date))
  }

  const getDriverStatusForDate = (driverId: number, date: Date) => {
    const vacation = vacationRequests.find(
      req => req.driverId === driverId && isSameDay(req.date, date)
    )
    if (vacation) {
      if (vacation.workStatus === 'day_off') return '休暇'
      if (vacation.workStatus === 'night_shift') return '夜勤'
    }
    return '出勤'
  }

  const getVehicleInfo = (vehicleId?: number) => {
    if (!vehicleId) return null
    return vehicles.find(v => v.id === vehicleId)
  }

  const selectedDateDepartures = getDepartureTimesForDate(selectedDate)
  const filteredDepartures = teamFilter === 'all'
    ? selectedDateDepartures
    : selectedDateDepartures.filter(dt => {
        const vehicle = getVehicleInfo(dt.vehicleId)
        return vehicle?.team === teamFilter
      })

  // チーム一覧を取得
  const teams = Array.from(new Set(vehicles.map(v => v.team)))

  // 出庫時間でソート
  const sortedDepartures = [...filteredDepartures].sort((a, b) => {
    const timeA = a.departureTime || '00:00'
    const timeB = b.departureTime || '00:00'
    return timeA.localeCompare(timeB)
  })

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
          <p className="text-xs text-slate-600 mb-1">出庫予定</p>
          <p className="text-2xl font-semibold text-blue-600">{sortedDepartures.length}</p>
          <p className="text-xs text-slate-500">件</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">最早出庫</p>
          <p className="text-xl font-semibold text-slate-900">
            {sortedDepartures.length > 0 ? sortedDepartures[0].departureTime : '--:--'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">最遅出庫</p>
          <p className="text-xl font-semibold text-slate-900">
            {sortedDepartures.length > 0
              ? sortedDepartures[sortedDepartures.length - 1].departureTime
              : '--:--'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">使用車両</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {new Set(sortedDepartures.map(d => d.vehicleId).filter(Boolean)).size}
          </p>
          <p className="text-xs text-slate-500">台</p>
        </div>
      </div>

      {/* 日付選択 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            {format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
          </h2>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
          >
            今日
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">フィルター</h2>
        </div>
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
      </div>

      {/* 出庫時間一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">出庫時間一覧</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">登録件数: {sortedDepartures.length}件</p>
        </div>

        <div className="divide-y divide-slate-200">
          {sortedDepartures.length > 0 ? (
            sortedDepartures.map(departure => {
              const vehicle = getVehicleInfo(departure.vehicleId)
              const status = getDriverStatusForDate(departure.driverId, selectedDate)
              return (
                <div key={departure.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{departure.driverName}</h3>
                        <span className="text-sm text-slate-600">({departure.employeeId})</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          status === '出勤' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === '休暇' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-violet-50 text-violet-700 border-violet-200'
                        }`}>
                          {status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-slate-600">出庫時間:</span>
                          <span className="font-semibold text-blue-600 text-lg">
                            {departure.departureTime || '--:--'}
                          </span>
                        </div>

                        {vehicle && (
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-slate-600" />
                            <span className="text-slate-600">車両:</span>
                            <span className="font-medium text-slate-900">
                              {departure.vehiclePlateNumber || vehicle.plateNumber}
                            </span>
                            <span className="text-xs text-slate-500">({vehicle.team})</span>
                          </div>
                        )}
                      </div>

                      {departure.remarks && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700 border border-slate-200">
                          <span className="font-medium">備考:</span> {departure.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">この日の出庫時間登録はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
