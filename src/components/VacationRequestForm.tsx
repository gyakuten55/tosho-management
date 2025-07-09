'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, User, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { VacationRequest, VacationSettings, Driver } from '@/types'

interface VacationRequestFormProps {
  drivers: Driver[]
  vacationSettings: VacationSettings
  existingRequests: VacationRequest[]
  onSave: (request: VacationRequest) => void
  onCancel: () => void
  editingRequest?: VacationRequest
}

export default function VacationRequestForm({
  drivers,
  vacationSettings,
  existingRequests,
  onSave,
  onCancel,
  editingRequest
}: VacationRequestFormProps) {
  const [formData, setFormData] = useState({
    driverId: editingRequest?.driverId || 0,
    date: editingRequest ? format(editingRequest.date, 'yyyy-MM-dd') : '',
    isOff: editingRequest?.isOff ?? true
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([])

  // 選択されたドライバー情報
  const selectedDriver = drivers.find(d => d.id === formData.driverId)

  // バリデーション
  const validateForm = useCallback(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // 必須項目チェック
    if (!formData.driverId) errors.push('ドライバーを選択してください')
    if (!formData.date) errors.push('日付を入力してください')

    if (formData.date && selectedDriver) {
      const selectedDate = new Date(formData.date)
      
      // ブラックアウト日チェック
      const isBlackoutDate = vacationSettings.blackoutDates.some(blackoutDate => 
        format(selectedDate, 'yyyy-MM-dd') === format(blackoutDate, 'yyyy-MM-dd')
      )
      
      if (isBlackoutDate) {
        errors.push('選択した日は休暇取得不可日です')
      }

      // 同じチームの同じ日の休暇申請数チェック
      const sameTeamSameDateRequests = existingRequests.filter(req => {
        if (req.id === editingRequest?.id) return false // 編集中の申請は除外
        if (req.team !== selectedDriver.team) return false
        if (!req.isOff) return false // 休暇申請のみ
        
        return format(req.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      })

      const teamLimit = vacationSettings.maxDriversOffPerDay[selectedDriver.team] || 2
      if (sameTeamSameDateRequests.length >= teamLimit) {
        warnings.push(`${selectedDriver.team}で同じ日に休暇予定のドライバーが既に${teamLimit}人います`)
      }

      // 全体の同じ日の休暇申請数チェック
      const globalSameDateRequests = existingRequests.filter(req => {
        if (req.id === editingRequest?.id) return false
        if (!req.isOff) return false
        
        return format(req.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      })

      if (globalSameDateRequests.length >= vacationSettings.globalMaxDriversOffPerDay) {
        errors.push(`選択した日は既に${vacationSettings.globalMaxDriversOffPerDay}人が休暇予定のため申請できません`)
      }
    }

    setValidationErrors(errors)
    setConflictWarnings(warnings)
    return errors.length === 0
  }, [formData, selectedDriver, vacationSettings, existingRequests, editingRequest])

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const selectedDriver = drivers.find(d => d.id === formData.driverId)
    if (!selectedDriver) return

    const newRequest: VacationRequest = {
      id: editingRequest?.id || Date.now(),
      driverId: formData.driverId,
      driverName: selectedDriver.name,
      team: selectedDriver.team,
      employeeId: selectedDriver.employeeId,
      date: new Date(formData.date),
      workStatus: formData.isOff ? 'day_off' : 'working',
      isOff: formData.isOff,
      type: formData.isOff ? 'day_off' : 'working',
      reason: '',
      status: 'approved',
      requestDate: editingRequest?.requestDate || new Date(),
      isExternalDriver: selectedDriver.employeeId.startsWith('E') // 外部ドライバーの判定
    }

    onSave(newRequest)
  }

  // フォーム変更時のバリデーション
  useEffect(() => {
    if (formData.date && formData.driverId) {
      validateForm()
    }
  }, [formData, validateForm])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingRequest ? '休暇申請編集' : '新規休暇申請'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* エラー・警告表示 */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">入力エラー</h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {conflictWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {conflictWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ドライバー選択 */}
          <div>
            <label className="form-label">
              <User className="h-4 w-4 mr-2" />
              申請者
            </label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: Number(e.target.value) })}
              className="form-select"
              required
            >
              <option value={0}>ドライバーを選択してください</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.team} - {driver.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* 日付選択 */}
          <div>
            <label className="form-label">
              <Calendar className="h-4 w-4 mr-2" />
              休暇日
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input"
              required
            />
          </div>

          {/* 休暇タイプ */}
          <div>
            <label className="form-label">
              申請タイプ
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isOff"
                  checked={formData.isOff === true}
                  onChange={() => setFormData({ ...formData, isOff: true })}
                  className="mr-2"
                />
                休暇申請
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isOff"
                  checked={formData.isOff === false}
                  onChange={() => setFormData({ ...formData, isOff: false })}
                  className="mr-2"
                />
                出勤予定
              </label>
            </div>
          </div>

          {/* 現在の状況表示 */}
          {selectedDriver && formData.date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">現在の状況</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>選択日: {format(new Date(formData.date), 'yyyy年MM月dd日')}</div>
                <div>チーム: {selectedDriver.team}</div>
                <div>
                  同じ日の{selectedDriver.team}休暇者: 
                  {existingRequests.filter(req => 
                    req.team === selectedDriver.team && 
                    req.isOff &&
                    format(req.date, 'yyyy-MM-dd') === formData.date
                  ).length}人
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={validationErrors.length > 0}
            >
              {editingRequest ? '更新' : '申請'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 