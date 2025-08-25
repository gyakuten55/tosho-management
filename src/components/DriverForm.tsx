'use client'

import { useState, useEffect } from 'react'
import { Save, X, Users, Phone, Mail, Calendar, Car, MapPin, Lock, Eye, EyeOff } from 'lucide-react'
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
    team: driver?.team || 'Bチーム',
    status: driver?.status || 'available',
    assignedVehicle: driver?.assignedVehicle || '',
    employeeId: driver?.employeeId || '',
    password: '',
    confirmPassword: '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    address: driver?.address || '',
    emergencyContactName: driver?.emergencyContactName || '',
    emergencyContactPhone: driver?.emergencyContactPhone || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseClass: driver?.licenseClass || '',
    licenseExpiryDate: driver?.licenseExpiryDate ? driver.licenseExpiryDate.toISOString().split('T')[0] : '',
    hireDate: driver?.hireDate ? driver.hireDate.toISOString().split('T')[0] : '',
    birthDate: driver?.birthDate ? driver.birthDate.toISOString().split('T')[0] : '',
    notes: driver?.notes || '',
    driverType: driver ? (driver.employeeId.startsWith('E') ? 'external' : 'internal') : 'internal',
    isNightShift: driver?.isNightShift || false,
    holidayTeams: driver?.holidayTeams || []
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  // 祝日チーム（A〜G）の固定リスト
  const holidayTeams = ['祝日Aチーム', '祝日Bチーム', '祝日Cチーム', '祝日Dチーム', '祝日Eチーム', '祝日Fチーム', '祝日Gチーム']


  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '氏名は必須です'
    }

    if (!formData.team) {
      newErrors.team = 'チームは必須です'
    }

    // 社員IDのバリデーション
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = '社員IDは必須です'
    } else {
      // 重複チェック（編集時は自分以外をチェック）
      const isDuplicate = existingDrivers.some(d => 
        d.employeeId === formData.employeeId && 
        (!driver || d.id !== driver.id)
      )
      if (isDuplicate) {
        newErrors.employeeId = 'この社員IDは既に使用されています'
      }
    }

    // パスワードのバリデーション（新規登録時またはパスワード変更時）
    if (!driver || formData.password) {
      if (!formData.password.trim()) {
        newErrors.password = 'パスワードは必須です'
      } else if (formData.password.length < 8) {
        newErrors.password = 'パスワードは8文字以上で入力してください'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'パスワードが一致しません'
      }
    }

    if (formData.phone && !/^[\d-+()]+$/.test(formData.phone)) {
      newErrors.phone = '正しい電話番号を入力してください'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 社員ID自動生成（補助機能として提供）
  const generateEmployeeId = (driverType: string, existingDrivers: Driver[]) => {
    const prefix = driverType === 'external' ? 'E' : 'B'
    const existingIds = existingDrivers
      .filter(d => d.employeeId.startsWith(prefix))
      .map(d => parseInt(d.employeeId.substring(1)))
      .filter(num => !isNaN(num))
    
    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`
  }

  // 自動生成ボタンの処理
  const handleAutoGenerate = () => {
    const newId = generateEmployeeId(formData.driverType, existingDrivers)
    setFormData(prev => ({ ...prev, employeeId: newId }))
    // エラーをクリア
    if (errors.employeeId) {
      setErrors(prev => ({ ...prev, employeeId: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // 新しいDriver型に合わせたデータ構造で保存
    const saveData: Partial<Driver> = {
      name: formData.name,
      team: formData.team,
      status: formData.status as Driver['status'],
      employeeId: formData.employeeId,
      assignedVehicle: formData.team === 'Bチーム' ? '' : formData.assignedVehicle,
      isNightShift: formData.isNightShift,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      licenseNumber: formData.licenseNumber || undefined,
      licenseClass: formData.licenseClass || undefined,
      licenseExpiryDate: formData.licenseExpiryDate ? new Date(formData.licenseExpiryDate) : undefined,
      hireDate: formData.hireDate ? new Date(formData.hireDate) : undefined,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      notes: formData.notes || undefined,
      holidayTeams: formData.holidayTeams
    }

    // パスワードが入力されている場合のみ追加
    if (formData.password) {
      saveData.password = formData.password
    }

    onSave(saveData)
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Bチームの場合は車両割り当てをクリア
      if (field === 'team' && value === 'Bチーム') {
        newData.assignedVehicle = ''
      }

      
      return newData
    })
    
    // Bチームになった場合、車両割り当てを解除
    if (field === 'team' && value === 'Bチーム' && formData.assignedVehicle && onVehicleUpdate) {
      const updates: { plateNumber: string; driverName: string }[] = []
      updates.push({ plateNumber: formData.assignedVehicle, driverName: '' })
      onVehicleUpdate(updates)
    }
    
    // 車両割り当てが変更された場合（Bチーム以外）、車両側の担当ドライバーも自動更新
    if (field === 'assignedVehicle' && formData.team !== 'Bチーム' && onVehicleUpdate && typeof value === 'string') {
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

  // 祝日チーム選択のハンドラー
  const handleHolidayTeamChange = (teamName: string, checked: boolean) => {
    setFormData(prev => {
      const currentTeams = prev.holidayTeams || []
      let newTeams: string[]
      
      if (checked) {
        newTeams = [...currentTeams, teamName]
      } else {
        newTeams = currentTeams.filter(t => t !== teamName)
      }
      
      return { ...prev, holidayTeams: newTeams }
    })
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
              >
                <option value="internal">正社員</option>
                <option value="external">外部ドライバー</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                社員ID <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.employeeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: B001, E001"
                />
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="btn-secondary whitespace-nowrap px-3 py-2"
                  title="自動生成"
                >
                  自動生成
                </button>
              </div>
              {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
                <p className="text-sm text-gray-500 mt-1">
                会社で使用している既存の社員IDを入力してください
                </p>
            </div>

            {/* パスワード設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-1" />
                ログインパスワード {!driver && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={driver ? "パスワードを変更する場合のみ入力" : "8文字以上で入力してください"}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              <p className="text-sm text-gray-500 mt-1">
                {driver ? "空欄の場合、パスワードは変更されません" : "このパスワードでシステムにログインします"}
              </p>
            </div>

            {/* パスワード確認 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="h-4 w-4 inline mr-1" />
                パスワード確認 {(!driver || formData.password) && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="パスワードを再入力してください"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
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
                <option value="配送センターチーム">配送センターチーム</option>
                <option value="常駐チーム">常駐チーム</option>
                <option value="Bチーム">Bチーム</option>
                <option value="外部ドライバー">外部ドライバー</option>
              </select>
              {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
            </div>

            {/* 祝日チーム - 配送センターチーム・外部ドライバー選択時のみ表示 */}
            {(formData.team === '配送センターチーム' || formData.team === '外部ドライバー') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  祝日チーム（A〜G）
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  選択したチームに自動配属されます（複数選択可）
                </p>
                
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {holidayTeams.map((teamName) => (
                    <label key={teamName} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.holidayTeams.includes(teamName)}
                        onChange={(e) => handleHolidayTeamChange(teamName, e.target.checked)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{teamName}</span>
                    </label>
                  ))}
                </div>
                
                {formData.holidayTeams.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">選択中のチーム:</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.holidayTeams.map((team) => (
                        <span
                          key={team}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                割り当て車両
              </label>
              {formData.team === 'Bチーム' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800">Bチーム - 都度車両割り当て</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Bチームのドライバーは固定の担当車両を持ちません。<br />
                        車両運用管理画面で必要に応じて車両を割り当ててください。
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                  <p className="text-sm text-gray-500 mt-1">
                    配送センターチーム、常駐チームのドライバーには固定車両を割り当てます
                  </p>
                </>
              )}
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
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="090-1234-5678"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
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
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
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
                免許の種類
              </label>
              <select
                value={formData.licenseClass}
                onChange={(e) => handleChange('licenseClass', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="普通自動車">普通自動車</option>
                <option value="中型自動車">中型自動車</option>
                <option value="大型自動車">大型自動車</option>
                <option value="大型自動車・大型特殊">大型自動車・大型特殊</option>
                <option value="けん引">けん引</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                免許証有効期限
              </label>
              <input
                type="date"
                value={formData.licenseExpiryDate}
                onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                入社日
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生年月日
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
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