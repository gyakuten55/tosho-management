'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, User, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { format, addDays, differenceInDays, isWeekend, isBefore, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
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
    type: editingRequest?.type || 'annual',
    startDate: editingRequest ? format(editingRequest.startDate, 'yyyy-MM-dd') : '',
    endDate: editingRequest ? format(editingRequest.endDate, 'yyyy-MM-dd') : '',
    reason: editingRequest?.reason || '',
    isRecurring: editingRequest?.isRecurring || false,
    recurringPattern: editingRequest?.recurringPattern || 'weekly',
    recurringDays: editingRequest?.recurringDays || []
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([])

  // 選択されたドライバー情報
  const selectedDriver = drivers.find(d => d.id === formData.driverId)

  // 日数を計算
  const calculateDays = useCallback(() => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    return differenceInDays(end, start) + 1
  }, [formData.startDate, formData.endDate])

  // バリデーション
  const validateForm = useCallback(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // 必須項目チェック
    if (!formData.driverId) errors.push('ドライバーを選択してください')
    if (!formData.startDate) errors.push('開始日を入力してください')
    if (!formData.endDate) errors.push('終了日を入力してください')
    if (!formData.reason.trim()) errors.push('理由を入力してください')

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const today = startOfDay(new Date())
      const days = calculateDays()

      // 日付の妥当性チェック
      if (endDate < startDate) {
        errors.push('終了日は開始日以降を選択してください')
      }

      // 事前申請期間チェック
      const advanceDays = differenceInDays(startDate, today)
      if (advanceDays < vacationSettings.minAdvanceNoticeDays) {
        errors.push(`休暇は${vacationSettings.minAdvanceNoticeDays}日前までに申請してください`)
      }

      // 最大連続日数チェック
      if (days > vacationSettings.maxConsecutiveDays) {
        errors.push(`連続休暇は最大${vacationSettings.maxConsecutiveDays}日までです`)
      }

      // ブラックアウト日チェック
      const blackoutConflicts = vacationSettings.blackoutDates.filter(blackoutDate => {
        return startDate <= blackoutDate && blackoutDate <= endDate
      })
      if (blackoutConflicts.length > 0) {
        errors.push('選択した期間に休暇取得不可日が含まれています')
      }

      // 同じチームの他のドライバーとの競合チェック
      if (selectedDriver) {
        const teamConflicts = existingRequests.filter(req => {
          if (req.id === editingRequest?.id) return false // 編集中の申請は除外
          if (req.team !== selectedDriver.team) return false
          if (req.status !== 'approved' && req.status !== 'pending') return false
          
          return (startDate <= req.endDate && endDate >= req.startDate)
        })

        if (teamConflicts.length >= vacationSettings.maxDriversOffPerDay[selectedDriver.team]) {
          warnings.push(`${selectedDriver.team}で同じ期間に休暇予定のドライバーが多数います`)
        }
      }
    }

    setValidationErrors(errors)
    setConflictWarnings(warnings)
    return errors.length === 0
  }, [formData, vacationSettings, existingRequests, editingRequest, selectedDriver, calculateDays])

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
      type: formData.type as 'annual' | 'sick' | 'personal' | 'emergency',
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      days: calculateDays(),
      reason: formData.reason,
      status: editingRequest?.status || 'pending',
      requestedAt: editingRequest?.requestedAt || new Date(),
      reviewedAt: editingRequest?.reviewedAt,
      reviewedBy: editingRequest?.reviewedBy,
      reviewComments: editingRequest?.reviewComments,
      isRecurring: formData.isRecurring,
      recurringPattern: formData.isRecurring ? formData.recurringPattern as 'weekly' | 'monthly' : undefined,
      recurringDays: formData.isRecurring ? formData.recurringDays : undefined
    }

    onSave(newRequest)
  }

  // フォーム変更時のバリデーション
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.driverId) {
      validateForm()
    }
  }, [formData, validateForm])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          {/* 休暇種類 */}
          <div>
            <label className="form-label">休暇種類</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'annual' | 'sick' | 'personal' | 'emergency' })}
              className="form-select"
              required
            >
              <option value="annual">年次有給休暇</option>
              <option value="sick">病気休暇</option>
              <option value="personal">私用休暇</option>
              <option value="emergency">緊急休暇</option>
            </select>
          </div>

          {/* 期間設定 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 mr-2" />
                開始日
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 mr-2" />
                終了日
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* 日数表示 */}
          {formData.startDate && formData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    休暇日数: {calculateDays()}日
                  </p>
                  <p className="text-xs text-blue-600">
                    {format(new Date(formData.startDate), 'yyyy年MM月dd日', { locale: ja })} ～ {format(new Date(formData.endDate), 'yyyy年MM月dd日', { locale: ja })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 定期休暇設定 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="mr-2"
              />
              <span className="form-label mb-0">定期休暇として設定</span>
            </label>
            
            {formData.isRecurring && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="form-label">繰り返しパターン</label>
                  <select
                    value={formData.recurringPattern}
                    onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value as 'weekly' | 'monthly' })}
                    className="form-select"
                  >
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>

                {formData.recurringPattern === 'weekly' && (
                  <div>
                    <label className="form-label">曜日選択</label>
                    <div className="flex flex-wrap gap-2">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                        <label key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.recurringDays.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  recurringDays: [...formData.recurringDays, index]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  recurringDays: formData.recurringDays.filter(d => d !== index)
                                })
                              }
                            }}
                            className="mr-1"
                          />
                          <span className="text-sm">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 理由 */}
          <div>
            <label className="form-label">理由</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="休暇取得の理由を入力してください"
              required
            />
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
              <CheckCircle className="h-4 w-4 mr-2" />
              {editingRequest ? '更新' : '申請'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 