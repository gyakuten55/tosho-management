'use client'

import { useState } from 'react'
import { Save, X, Users, Phone, Mail, Calendar, Car, MapPin } from 'lucide-react'
import { Driver, Vehicle } from '@/types'

interface DriverFormProps {
  driver?: Driver | null
  vehicles: Vehicle[]
  existingDrivers: Driver[]
  onSave: (driverData: Partial<Driver>) => void
  onCancel: () => void
  onVehicleUpdate?: (vehicleUpdates: { plateNumber: string; driverName: string }[]) => void
}

export default function DriverForm({ driver, vehicles, existingDrivers, onSave, onCancel, onVehicleUpdate }: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    team: driver?.team || 'B',
    status: driver?.status || 'available',
    assignedVehicle: driver?.assignedVehicle || '',
    phoneNumber: (driver as any)?.phoneNumber || '',
    email: (driver as any)?.email || '',
    licenseNumber: (driver as any)?.licenseNumber || '',
    licenseExpiry: (driver as any)?.licenseExpiry || '',
    address: (driver as any)?.address || '',
    emergencyContact: (driver as any)?.emergencyContact || '',
    emergencyPhone: (driver as any)?.emergencyPhone || '',
    notes: (driver as any)?.notes || '',
    driverType: driver ? (driver.employeeId.startsWith('E') ? 'external' : 'internal') : 'internal' // 正社員 or 外部ドライバー
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '氏名は必須です'
    }

    if (!formData.team) {
      newErrors.team = 'チームは必須です'
    }

    if (formData.phoneNumber && !/^[\d-+()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '正しい電話番号を入力してください'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 社員ID自動生成
  const generateEmployeeId = (driverType: string, existingDrivers: Driver[]) => {
    const prefix = driverType === 'external' ? 'E' : 'B'
    const existingIds = existingDrivers
      .filter(d => d.employeeId.startsWith(prefix))
      .map(d => parseInt(d.employeeId.substring(1)))
      .filter(num => !isNaN(num))
    
    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // 新規登録の場合は社員IDを自動生成
    const employeeId = driver ? driver.employeeId : generateEmployeeId(formData.driverType, existingDrivers)
    
    const saveData = {
      ...formData,
      employeeId
    }

    onSave(saveData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 車両割り当てが変更された場合、車両側の担当ドライバーも自動更新
    if (field === 'assignedVehicle' && onVehicleUpdate) {
      const updates: { plateNumber: string; driverName: string }[] = []
      
      // 前の車両から割り当て解除
      if (formData.assignedVehicle) {
        updates.push({ plateNumber: formData.assignedVehicle, driverName: '' })
      }
      
      // 新しい車両に割り当て
      if (value) {
        updates.push({ plateNumber: value, driverName: formData.name })
      }
      
      if (updates.length > 0) {
        onVehicleUpdate(updates)
      }
    }
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {driver ? 'ドライバー編集' : '新規ドライバー登録'}
          </h2>
          <p className="text-gray-600 mt-1">
            {driver ? 'ドライバー情報を編集します' : '新しいドライバーを登録します'}
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
            <span>{driver ? '更新' : '登録'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="山田太郎"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ドライバー区分
              </label>
              <select
                value={formData.driverType}
                onChange={(e) => handleChange('driverType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!!driver} // 編集時は変更不可
              >
                <option value="internal">正社員</option>
                <option value="external">外部ドライバー</option>
              </select>
              {driver && (
                <p className="text-sm text-gray-500 mt-1">
                  社員ID: {driver.employeeId} (編集時は変更できません)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チーム <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.team}
                onChange={(e) => handleChange('team', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.team ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="A-1">A-1</option>
                <option value="A-2">A-2</option>
                <option value="B">B</option>
              </select>
              {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
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
                <option value="working">出勤中</option>
                <option value="vacation">休暇中</option>
                <option value="sick">病気休暇</option>
                <option value="available">待機中</option>
              </select>
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                割り当て車両
              </label>
              <select
                value={formData.assignedVehicle}
                onChange={(e) => handleChange('assignedVehicle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">車両を選択してください</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plateNumber}>
                    {vehicle.plateNumber} ({vehicle.model})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 連絡先情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">連絡先情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="090-1234-5678"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="yamada@tokyorikuso.co.jp"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="東京都○○区○○町1-1-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                緊急連絡先（氏名）
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="山田花子"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                緊急連絡先（電話番号）
              </label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="090-1234-5678"
              />
            </div>
          </div>
        </div>

        {/* 免許情報 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">免許情報</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                運転免許証番号
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="第12345678901号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                免許証有効期限
              </label>
              <input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-gray-600" />
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
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="特記事項があれば記入してください..."
            />
          </div>
        </div>
      </form>
    </div>
  )
} 