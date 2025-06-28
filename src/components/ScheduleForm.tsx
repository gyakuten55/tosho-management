'use client'

import { useState } from 'react'
import { Save, X, Calendar, Users, Car, MapPin, Clock, Phone, FileText, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { DispatchSchedule, Driver, Vehicle } from '@/types'

interface ScheduleFormProps {
  schedule?: DispatchSchedule | null
  drivers: Driver[]
  vehicles: Vehicle[]
  onSave: (scheduleData: Partial<DispatchSchedule>) => void
  onCancel: () => void
}

export default function ScheduleForm({ schedule, drivers, vehicles, onSave, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    date: schedule?.date ? format(schedule.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    driverId: schedule?.driverId || '',
    vehicleId: schedule?.vehicleId || '',
    team: schedule?.team || 'Bチーム',
    origin: schedule?.route?.origin || '',
    destination: schedule?.route?.destination || '',
    waypoints: schedule?.route?.waypoints?.join(', ') || '',
    startTime: schedule?.timeSlot?.start || '09:00',
    endTime: schedule?.timeSlot?.end || '17:00',
    status: schedule?.status || 'scheduled',
    priority: schedule?.priority || 'normal',
    clientName: schedule?.clientInfo?.name || '',
    clientContact: schedule?.clientInfo?.contact || '',
    clientNotes: schedule?.clientInfo?.notes || '',
    cargoType: schedule?.cargoInfo?.type || '',
    cargoCount: schedule?.cargoInfo?.count?.toString() || '1',
    cargoNotes: schedule?.cargoInfo?.notes || '',
    notes: schedule?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 利用可能なドライバーを取得（出勤中または待機中）
  const availableDrivers = drivers.filter(d => d.status === 'working' || d.status === 'available')
  
  // 利用可能な車両を取得（稼働中でメンテナンス中でない）
  const availableVehicles = vehicles.filter(v => v.status === 'active')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = '配車日は必須です'
    }

    if (!formData.driverId) {
      newErrors.driverId = 'ドライバーは必須です'
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = '車両は必須です'
    }

    if (!formData.origin.trim()) {
      newErrors.origin = '出発地は必須です'
    }

    if (!formData.destination.trim()) {
      newErrors.destination = '目的地は必須です'
    }

    if (!formData.startTime) {
      newErrors.startTime = '開始時間は必須です'
    }

    if (!formData.endTime) {
      newErrors.endTime = '終了時間は必須です'
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = '終了時間は開始時間より後に設定してください'
    }

    if (!formData.cargoType.trim()) {
      newErrors.cargoType = '荷物種別は必須です'
    }

    if (!formData.cargoCount || isNaN(Number(formData.cargoCount)) || Number(formData.cargoCount) < 1) {
      newErrors.cargoCount = '正しい台数を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const selectedDriver = drivers.find(d => d.id === Number(formData.driverId))
    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId))

    const scheduleData: Partial<DispatchSchedule> = {
      date: new Date(formData.date),
      driverId: Number(formData.driverId),
      driverName: selectedDriver?.name || '',
      vehicleId: Number(formData.vehicleId),
      vehicleNumber: selectedVehicle?.plateNumber || '',
      team: formData.team,
      route: {
        origin: formData.origin,
        destination: formData.destination,
        waypoints: formData.waypoints ? formData.waypoints.split(',').map(w => w.trim()).filter(w => w) : undefined
      },
      timeSlot: {
        start: formData.startTime,
        end: formData.endTime
      },
      status: formData.status as any,
      priority: formData.priority as any,
      clientInfo: formData.clientName ? {
        name: formData.clientName,
        contact: formData.clientContact,
        notes: formData.clientNotes
      } : undefined,
      cargoInfo: {
        type: formData.cargoType,
        count: Number(formData.cargoCount),
        notes: formData.cargoNotes
      },
      notes: formData.notes
    }

    onSave(scheduleData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // チーム変更時に利用可能なドライバーと車両をフィルタリング
    if (field === 'team') {
      setFormData(prev => ({ ...prev, driverId: '', vehicleId: '' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {schedule ? '配車予定編集' : '新規配車予定'}
          </h2>
          <p className="text-gray-600 mt-1">
            {schedule ? '配車予定を編集します' : '新しい配車予定を登録します'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <span>キャンセル</span>
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{schedule ? '更新' : '登録'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配車日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.team}
                onChange={(e) => handleChange('team', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Bチーム">Bチーム</option>
                <option value="Cチーム">Cチーム</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">至急</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="scheduled">予定</option>
                <option value="in_progress">運行中</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          </div>
        </div>

        {/* 配車情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">配車情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ドライバー <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => handleChange('driverId', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.driverId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">ドライバーを選択してください</option>
                {availableDrivers
                  .filter(d => d.team === formData.team)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.employeeId})
                    </option>
                  ))}
              </select>
              {errors.driverId && <p className="text-red-500 text-sm mt-1">{errors.driverId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                車両 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleChange('vehicleId', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.vehicleId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">車両を選択してください</option>
                {availableVehicles
                  .filter(v => v.team === formData.team)
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.model})
                    </option>
                  ))}
              </select>
              {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>}
            </div>
          </div>
        </div>

        {/* ルート情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">ルート情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出発地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.origin ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="東京オートサロン"
              />
              {errors.origin && <p className="text-red-500 text-sm mt-1">{errors.origin}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目的地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.destination ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ガリバー府中店"
              />
              {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                経由地（カンマ区切り）
              </label>
              <input
                type="text"
                value={formData.waypoints}
                onChange={(e) => handleChange('waypoints', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="八王子IC, 海老名SA"
              />
            </div>
          </div>
        </div>

        {/* 顧客情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">顧客情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                顧客名
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ガリバー府中店"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                連絡先
              </label>
              <input
                type="tel"
                value={formData.clientContact}
                onChange={(e) => handleChange('clientContact', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="042-123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                顧客備考
              </label>
              <textarea
                value={formData.clientNotes}
                onChange={(e) => handleChange('clientNotes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="当日受注の至急便"
              />
            </div>
          </div>
        </div>

        {/* 荷物情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">荷物情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                荷物種別 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cargoType}
                onChange={(e) => handleChange('cargoType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cargoType ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="中古車回送"
              />
              {errors.cargoType && <p className="text-red-500 text-sm mt-1">{errors.cargoType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                台数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.cargoCount}
                onChange={(e) => handleChange('cargoCount', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.cargoCount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.cargoCount && <p className="text-red-500 text-sm mt-1">{errors.cargoCount}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                荷物詳細
              </label>
              <textarea
                value={formData.cargoNotes}
                onChange={(e) => handleChange('cargoNotes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="トヨタ アクア 2020年式"
              />
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">その他</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="荷受け時に傷チェック必要"
            />
          </div>
        </div>
      </form>
    </div>
  )
} 