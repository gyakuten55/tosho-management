'use client'

import { useState, useEffect } from 'react'
import { Car, AlertTriangle, CheckCircle, Wrench, Filter } from 'lucide-react'
import { Vehicle, InspectionReservation } from '@/types'
import { VehicleService } from '@/services/vehicleService'
import { InspectionReservationService } from '@/services/inspectionReservationService'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function ViewerVehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [inspectionReservations, setInspectionReservations] = useState<InspectionReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehiclesData, reservationsData] = await Promise.all([
          VehicleService.getAll(),
          InspectionReservationService.getAll().catch(() => [])
        ])
        setVehicles(vehiclesData)
        setInspectionReservations(reservationsData)
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

  const getVehicleInspectionInfo = (vehicle: Vehicle) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const vehicleInspections = inspectionReservations.filter(
      inspection => inspection.vehicleId === vehicle.id &&
        inspection.status === 'scheduled' &&
        inspection.scheduledDate >= new Date()
    )

    const nextInspection = vehicleInspections.length > 0
      ? vehicleInspections.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0]
      : null

    let daysUntilInspection = null
    if (nextInspection) {
      const inspectionDate = new Date(nextInspection.scheduledDate)
      inspectionDate.setHours(0, 0, 0, 0)
      daysUntilInspection = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    const daysUntilDeadline = vehicle.inspectionDate
      ? differenceInDays(vehicle.inspectionDate, today)
      : null

    return {
      nextInspection,
      daysUntilInspection,
      daysUntilDeadline
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">稼働中</span>
      case 'inspection':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">点検中</span>
      case 'repair':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200">修理中</span>
      case 'maintenance_due':
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-50 text-orange-700 border border-orange-200">点検期限</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-50 text-slate-700 border border-slate-200">{status}</span>
    }
  }

  const getDaysColor = (days: number | null) => {
    if (days === null) return 'text-slate-600'
    if (days <= 0) return 'text-red-700 font-semibold'
    if (days <= 7) return 'text-orange-700 font-semibold'
    if (days <= 14) return 'text-amber-700'
    return 'text-emerald-700'
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    if (statusFilter !== 'all' && vehicle.status !== statusFilter) return false
    if (teamFilter !== 'all' && vehicle.team !== teamFilter) return false
    return true
  })

  const teams = Array.from(new Set(vehicles.map(v => v.team)))

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
          <p className="text-xs text-slate-600 mb-1">総車両数</p>
          <p className="text-2xl font-semibold text-slate-900">{vehicles.length}</p>
          <p className="text-xs text-slate-500">台</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">稼働中</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {vehicles.filter(v => v.status === 'normal').length}
          </p>
          <p className="text-xs text-slate-500">台</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">点検中</p>
          <p className="text-2xl font-semibold text-amber-600">
            {vehicles.filter(v => v.status === 'inspection').length}
          </p>
          <p className="text-xs text-slate-500">台</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-600 mb-1">修理中</p>
          <p className="text-2xl font-semibold text-red-600">
            {vehicles.filter(v => v.status === 'repair').length}
          </p>
          <p className="text-xs text-slate-500">台</p>
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
            <label className="block text-xs font-medium text-slate-700 mb-1.5">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white"
            >
              <option value="all">すべて</option>
              <option value="normal">稼働中</option>
              <option value="inspection">点検中</option>
              <option value="repair">修理中</option>
              <option value="maintenance_due">点検期限</option>
            </select>
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
      </div>

      {/* 車両一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">車両一覧</h2>
          <p className="text-xs text-slate-600 mt-1">全{filteredVehicles.length}台</p>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredVehicles.map(vehicle => {
            const inspectionInfo = getVehicleInspectionInfo(vehicle)
            return (
              <div key={vehicle.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Car className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{vehicle.plateNumber}</h3>
                      <p className="text-sm text-slate-600">{vehicle.model}</p>
                    </div>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">チーム:</span>
                    <span className="ml-2 font-medium text-slate-900">{vehicle.team}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">担当:</span>
                    <span className="ml-2 font-medium text-slate-900">{vehicle.driver || '未割当'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">車庫:</span>
                    <span className="ml-2 font-medium text-slate-900">{vehicle.garage}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">年式:</span>
                    <span className="ml-2 font-medium text-slate-900">{vehicle.year}年</span>
                  </div>
                </div>

                {/* 点検情報 */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">点検期限:</span>
                    <span className={`font-medium ${getDaysColor(inspectionInfo.daysUntilDeadline)}`}>
                      {vehicle.inspectionDate
                        ? format(vehicle.inspectionDate, 'yyyy/MM/dd', { locale: ja })
                        : '未設定'}
                      {inspectionInfo.daysUntilDeadline !== null && (
                        <span className="ml-2">
                          ({inspectionInfo.daysUntilDeadline <= 0
                            ? '期限超過'
                            : `あと${inspectionInfo.daysUntilDeadline}日`})
                        </span>
                      )}
                    </span>
                  </div>

                  {inspectionInfo.nextInspection ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">実施予定:</span>
                      <span className={`font-medium ${getDaysColor(inspectionInfo.daysUntilInspection)}`}>
                        {format(inspectionInfo.nextInspection.scheduledDate, 'yyyy/MM/dd', { locale: ja })}
                        {inspectionInfo.daysUntilInspection !== null && (
                          <span className="ml-2">
                            ({inspectionInfo.daysUntilInspection === 0
                              ? '本日'
                              : `あと${inspectionInfo.daysUntilInspection}日`})
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">実施予定:</span>
                      <span className="text-orange-700 font-medium">未予約</span>
                    </div>
                  )}
                </div>

                {vehicle.notes && (
                  <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                    備考: {vehicle.notes}
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
