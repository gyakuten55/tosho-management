'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { VacationRequest, InspectionReservation, Vehicle } from '@/types'
import { VacationService } from '@/services/vacationService'
import { InspectionReservationService } from '@/services/inspectionReservationService'
import { VehicleService } from '@/services/vehicleService'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay
} from 'date-fns'
import { ja } from 'date-fns/locale'

type CalendarView = 'vacation' | 'inspection' | 'operation'

export default function ViewerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [inspectionReservations, setInspectionReservations] = useState<InspectionReservation[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<CalendarView>('vacation')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vacationsData, reservationsData, vehiclesData] = await Promise.all([
          VacationService.getAll().catch(() => []),
          InspectionReservationService.getAll().catch(() => []),
          VehicleService.getAll().catch(() => [])
        ])
        setVacationRequests(vacationsData)
        setInspectionReservations(reservationsData)
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

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }

  const getVacationsForDate = (date: Date) => {
    return vacationRequests.filter(req => isSameDay(req.date, date))
  }

  const getInspectionsForDate = (date: Date) => {
    return inspectionReservations.filter(
      inspection => inspection.status === 'scheduled' && isSameDay(inspection.scheduledDate, date)
    )
  }

  const renderDayContent = (date: Date) => {
    const vacations = getVacationsForDate(date)
    const inspections = getInspectionsForDate(date)
    const dayOffCount = vacations.filter(v => v.workStatus === 'day_off').length
    const nightShiftCount = vacations.filter(v => v.workStatus === 'night_shift').length

    return (
      <button
        onClick={() => setSelectedDate(date)}
        className="w-full h-full min-h-[50px] sm:min-h-[70px] p-1 sm:p-2 text-left hover:bg-blue-50 transition-colors rounded"
      >
        <div className="text-xs sm:text-sm font-medium text-gray-900 mb-0.5 sm:mb-1">
          {format(date, 'd')}
        </div>

        {viewMode === 'vacation' && (
          <div className="space-y-0.5">
            {dayOffCount > 0 && (
              <div className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded leading-tight">
                休暇{dayOffCount}
              </div>
            )}
            {nightShiftCount > 0 && (
              <div className="text-[10px] sm:text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded leading-tight">
                夜勤{nightShiftCount}
              </div>
            )}
          </div>
        )}

        {viewMode === 'inspection' && inspections.length > 0 && (
          <div className="space-y-0.5">
            {inspections.slice(0, 1).map((inspection, idx) => (
              <div key={idx} className="text-[10px] sm:text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded truncate leading-tight">
                {inspection.vehiclePlateNumber}
              </div>
            ))}
            {inspections.length > 1 && (
              <div className="text-[10px] sm:text-xs text-gray-600">+{inspections.length - 1}</div>
            )}
          </div>
        )}

        {viewMode === 'operation' && (
          <div className="text-xs text-gray-600">
            {/* 今後の拡張用 */}
          </div>
        )}
      </button>
    )
  }

  const renderDetailPanel = () => {
    if (!selectedDate) return null

    const vacations = getVacationsForDate(selectedDate)
    const inspections = getInspectionsForDate(selectedDate)

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">
            {format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
          </h3>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            閉じる
          </button>
        </div>

        {viewMode === 'vacation' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">休暇</h4>
              {vacations.filter(v => v.workStatus === 'day_off').length > 0 ? (
                <div className="space-y-1">
                  {vacations.filter(v => v.workStatus === 'day_off').map(vacation => (
                    <div key={vacation.id} className="text-sm bg-blue-50 p-2 rounded border border-blue-100">
                      <span className="font-medium">{vacation.driverName}</span>
                      <span className="text-slate-600 ml-2">({vacation.team})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">休暇者なし</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">夜勤</h4>
              {vacations.filter(v => v.workStatus === 'night_shift').length > 0 ? (
                <div className="space-y-1">
                  {vacations.filter(v => v.workStatus === 'night_shift').map(vacation => (
                    <div key={vacation.id} className="text-sm bg-violet-50 p-2 rounded border border-violet-100">
                      <span className="font-medium">{vacation.driverName}</span>
                      <span className="text-slate-600 ml-2">({vacation.team})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">夜勤者なし</p>
              )}
            </div>
          </div>
        )}

        {viewMode === 'inspection' && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">点検予定</h4>
            {inspections.length > 0 ? (
              <div className="space-y-1">
                {inspections.map(inspection => (
                  <div key={inspection.id} className="text-sm bg-amber-50 p-2 rounded border border-amber-100">
                    <div className="font-medium">{inspection.vehiclePlateNumber}</div>
                    {inspection.memo && (
                      <div className="text-xs text-slate-600 mt-1">{inspection.memo}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">点検予定なし</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']
  const days = getDaysInMonth()
  const startDay = getDay(startOfMonth(currentDate))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ビューモード切り替え */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setViewMode('vacation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              viewMode === 'vacation'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            休暇状況
          </button>
          <button
            onClick={() => setViewMode('inspection')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              viewMode === 'inspection'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            点検スケジュール
          </button>
        </div>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 sm:p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 sm:p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs sm:text-sm font-medium py-1 sm:py-2 ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-slate-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {/* 空白のセル */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[50px] sm:min-h-[70px]" />
          ))}

          {/* 日付のセル */}
          {days.map((day) => {
            const dayOfWeek = getDay(day)
            return (
              <div
                key={day.toISOString()}
                className={`border border-slate-200 rounded ${
                  dayOfWeek === 0 ? 'bg-red-50' : dayOfWeek === 6 ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {renderDayContent(day)}
              </div>
            )
          })}
        </div>
      </div>

      {/* 詳細パネル */}
      {selectedDate && renderDetailPanel()}
    </div>
  )
}
