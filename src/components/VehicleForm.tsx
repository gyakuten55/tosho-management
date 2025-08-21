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
    inspectionDate: string
    garage: string
    notes: string
    hasCrane: boolean
  }>({
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    driver: '',
    team: '配送センターチーム',
    status: 'normal',
    inspectionDate: format(new Date(), 'yyyy-MM-dd'),
    garage: '1車庫',
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
        inspectionDate: format(vehicle.inspectionDate, 'yyyy-MM-dd'),
        garage: vehicle.garage,
        notes: vehicle.notes || '',
        hasCrane: vehicle.model.includes('クレーン')
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
      inspectionDate: new Date(formData.inspectionDate),
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
    '1車庫',
    '2車庫',
    '3車庫',
    '4車庫',
    '5車庫'
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
                  {drivers
                    .filter(driver => driver.team !== 'Bチーム') // Bチームは固定割り当て対象外
                    .map(driver => (
                    <option key={driver.id} value={driver.name}>{driver.name} ({driver.team} - {driver.employeeId})</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  ※ Bチームのドライバーは固定割り当て対象外です。車両運用管理画面で都度割り当てを行ってください。
                </p>
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
                  <option value="配送センターチーム">配送センターチーム</option>
                  <option value="常駐チーム">常駐チーム</option>
                  <option value="Bチーム">Bチーム</option>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">点検情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  点検日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.inspectionDate}
                  onChange={(e) => handleChange('inspectionDate', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  この日付を基準に3ヶ月ごとの点検日が自動計算されます（すべて同じ点検として扱われます）
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">点検日の統一管理について</h4>
                  <p className="text-sm text-blue-700">
                    設定した点検日とその3ヶ月間隔の日付がすべて「点検」として自動計算されます。<br/>
                    車検やクレーン年次点検も含めて統一した点検として管理されます。
                  </p>
                </div>
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