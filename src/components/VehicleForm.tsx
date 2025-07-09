'use client'

import { useState, useEffect } from 'react'
import { Car, ArrowLeft, Save, X, MapPin } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { Vehicle, Driver } from '@/types'

interface VehicleFormProps {
  vehicle?: Vehicle | null
  drivers?: Driver[]
  onSave: (vehicle: Partial<Vehicle>) => void
  onCancel: () => void
  onDriverUpdate?: (driverUpdates: { driverName: string; vehiclePlateNumber: string }[]) => void
}

export default function VehicleForm({ vehicle, drivers = [], onSave, onCancel, onDriverUpdate }: VehicleFormProps) {
  const [formData, setFormData] = useState<{
    plateNumber: string
    model: string
    year: number
    driver: string
    team: string
    status: 'normal' | 'inspection' | 'repair' | 'maintenance_due' | 'breakdown'
    lastInspection: string
    nextInspection: string
    vehicleInspectionDate: string
    craneAnnualInspection: string
    threeMonthInspection: string
    sixMonthInspection: string
    garage: string
    notes: string
    hasCrane: boolean
  }>({
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    driver: '',
    team: 'A-1',
    status: 'normal',
    lastInspection: format(new Date(), 'yyyy-MM-dd'),
    nextInspection: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    vehicleInspectionDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    craneAnnualInspection: '',
    threeMonthInspection: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    sixMonthInspection: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    garage: '本社車庫',
    notes: '',
    hasCrane: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber,
        model: vehicle.model,
        year: vehicle.year,
        driver: vehicle.driver || '',
        team: vehicle.team,
        status: vehicle.status,
        lastInspection: format(vehicle.lastInspection, 'yyyy-MM-dd'),
        nextInspection: format(vehicle.nextInspection, 'yyyy-MM-dd'),
        vehicleInspectionDate: format(vehicle.vehicleInspectionDate, 'yyyy-MM-dd'),
        craneAnnualInspection: vehicle.craneAnnualInspection ? format(vehicle.craneAnnualInspection, 'yyyy-MM-dd') : '',
        threeMonthInspection: format(vehicle.threeMonthInspection, 'yyyy-MM-dd'),
        sixMonthInspection: format(vehicle.sixMonthInspection, 'yyyy-MM-dd'),
        garage: vehicle.garage,
        notes: vehicle.notes || '',
        hasCrane: !!vehicle.craneAnnualInspection
      })
    }
  }, [vehicle])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = '車両番号は必須です'
    }

    if (!formData.model.trim()) {
      newErrors.model = '車種・モデルは必須です'
    }

    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = '正しい年式を入力してください'
    }

    if (!formData.garage.trim()) {
      newErrors.garage = '車庫情報は必須です'
    }

    const lastInspectionDate = new Date(formData.lastInspection)
    const nextInspectionDate = new Date(formData.nextInspection)

    if (nextInspectionDate <= lastInspectionDate) {
      newErrors.nextInspection = '次回点検日は前回点検日より後の日付を入力してください'
    }

    if (formData.hasCrane && !formData.craneAnnualInspection) {
      newErrors.craneAnnualInspection = 'クレーン車の場合はクレーン年次点検日を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const vehicleData = {
      ...formData,
      lastInspection: new Date(formData.lastInspection),
      nextInspection: new Date(formData.nextInspection),
      vehicleInspectionDate: new Date(formData.vehicleInspectionDate),
      craneAnnualInspection: formData.hasCrane && formData.craneAnnualInspection ? new Date(formData.craneAnnualInspection) : undefined,
      threeMonthInspection: new Date(formData.threeMonthInspection),
      sixMonthInspection: new Date(formData.sixMonthInspection),
      driver: formData.driver.trim() || undefined
    }
    
    // hasCraneは保存に含めない（一時的なフォーム状態のみ）
    const { hasCrane, ...saveData } = vehicleData
    onSave(saveData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 担当ドライバーが変更された場合、そのドライバーのチームに合わせて車両のチーム情報を自動入力
    if (field === 'driver' && drivers.length > 0) {
      const selectedDriver = drivers.find(driver => driver.name === value)
      if (selectedDriver) {
        setFormData(prev => ({ ...prev, driver: value, team: selectedDriver.team }))
      }
      
      // ドライバー側の車両割り当ても自動更新
      if (onDriverUpdate) {
        const updates: { driverName: string; vehiclePlateNumber: string }[] = []
        
        // 前のドライバーから割り当て解除
        if (formData.driver) {
          updates.push({ driverName: formData.driver, vehiclePlateNumber: '' })
        }
        
        // 新しいドライバーに割り当て
        if (value) {
          updates.push({ driverName: value, vehiclePlateNumber: formData.plateNumber })
        }
        
        if (updates.length > 0) {
          onDriverUpdate(updates)
        }
      }
    }
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const garages = [
    '本社車庫',
    '東車庫',
    '西車庫',
    '整備工場',
    '外部整備工場',
    'その他'
  ]

  // driversはpropsから受け取るように変更

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Car className="h-8 w-8 mr-3 text-primary-600" />
          {vehicle ? '車両編集' : '新規車両登録'}
        </h1>
      </div>

      {/* フォーム */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車両番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.plateNumber ? 'border-red-500' : ''}`}
                  placeholder="例: 品川 501 あ 1234"
                  value={formData.plateNumber}
                  onChange={(e) => handleChange('plateNumber', e.target.value)}
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.plateNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車種・モデル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.model ? 'border-red-500' : ''}`}
                  placeholder="例: トヨタ ハイエース"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年式 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={`input-field ${errors.year ? 'border-red-500' : ''}`}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  担当ドライバー
                </label>
                <select
                  className="input-field"
                  value={formData.driver}
                  onChange={(e) => handleChange('driver', e.target.value)}
                >
                  <option value="">未割り当て</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.name}>{driver.name} ({driver.team} - {driver.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チーム <span className="text-red-500">*</span>
                  {formData.driver && (
                    <span className="text-sm text-gray-500 ml-2">
                      (担当ドライバーのチームに自動設定)
                    </span>
                  )}
                </label>
                <select
                  className={`input-field ${formData.driver ? 'bg-gray-100' : ''}`}
                  value={formData.team}
                  onChange={(e) => handleChange('team', e.target.value)}
                  disabled={!!formData.driver}
                >
                  <option value="A-1">A-1</option>
                  <option value="A-2">A-2</option>
                  <option value="B">B</option>
                </select>
                {formData.driver && (
                  <p className="mt-1 text-sm text-gray-600">
                    担当ドライバーが選択されているため、チーム情報は自動的に設定されます
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車庫情報 <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input-field ${errors.garage ? 'border-red-500' : ''}`}
                  value={formData.garage}
                  onChange={(e) => handleChange('garage', e.target.value)}
                >
                  {garages.map(garage => (
                    <option key={garage} value={garage}>{garage}</option>
                  ))}
                </select>
                {errors.garage && (
                  <p className="mt-1 text-sm text-red-600">{errors.garage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="normal">正常</option>
                  <option value="inspection">点検中</option>
                  <option value="repair">修理中</option>
                  <option value="maintenance_due">点検期限</option>
                  <option value="breakdown">故障</option>
                </select>
              </div>

              {/* クレーン車判定 */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasCrane}
                    onChange={(e) => handleChange('hasCrane', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">クレーン車</span>
                </label>
              </div>
            </div>
          </div>

          {/* 点検・車検情報 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">点検・車検情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車検日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.vehicleInspectionDate}
                  onChange={(e) => handleChange('vehicleInspectionDate', e.target.value)}
                />
              </div>

              {formData.hasCrane && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    クレーン年次点検 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`input-field ${errors.craneAnnualInspection ? 'border-red-500' : ''}`}
                    value={formData.craneAnnualInspection}
                    onChange={(e) => handleChange('craneAnnualInspection', e.target.value)}
                  />
                  {errors.craneAnnualInspection && (
                    <p className="mt-1 text-sm text-red-600">{errors.craneAnnualInspection}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3カ月点検（自動設定）
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.threeMonthInspection}
                  onChange={(e) => handleChange('threeMonthInspection', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6カ月点検（自動設定）
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.sixMonthInspection}
                  onChange={(e) => handleChange('sixMonthInspection', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  前回点検日
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.lastInspection}
                  onChange={(e) => handleChange('lastInspection', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  次回点検日
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.nextInspection ? 'border-red-500' : ''}`}
                  value={formData.nextInspection}
                  onChange={(e) => handleChange('nextInspection', e.target.value)}
                />
                {errors.nextInspection && (
                  <p className="mt-1 text-sm text-red-600">{errors.nextInspection}</p>
                )}
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">備考</h3>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="備考事項があれば入力してください"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          {/* ボタン */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {vehicle ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 