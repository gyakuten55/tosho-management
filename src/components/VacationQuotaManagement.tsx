'use client'

import { useState } from 'react'
import { 
  Calendar, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Save, 
  X, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { VacationQuota, Driver } from '@/types'

interface VacationQuotaManagementProps {
  vacationQuotas: VacationQuota[]
  drivers: Driver[]
  onQuotasChange: (quotas: VacationQuota[]) => void
}

export default function VacationQuotaManagement({
  vacationQuotas,
  drivers,
  onQuotasChange
}: VacationQuotaManagementProps) {
  const [editingQuota, setEditingQuota] = useState<VacationQuota | null>(null)
  const [newQuota, setNewQuota] = useState({
    driverId: 0,
    year: new Date().getFullYear(),
    totalDays: 20,
    usedDays: 0,
    carryOverDays: 0
  })
  const [showAddForm, setShowAddForm] = useState(false)

  // 統計情報を計算
  const stats = {
    totalDrivers: drivers.length,
    averageRemaining: vacationQuotas.length > 0 
      ? Math.round(vacationQuotas.reduce((sum, quota) => sum + quota.remainingDays, 0) / vacationQuotas.length)
      : 0,
    lowQuotaDrivers: vacationQuotas.filter(quota => quota.remainingDays <= 5).length,
    highUsageDrivers: vacationQuotas.filter(quota => {
      const usageRate = quota.totalDays > 0 ? (quota.usedDays / quota.totalDays) * 100 : 0
      return usageRate >= 80
    }).length
  }

  // ドライバー情報を取得
  const getDriverInfo = (driverId: number) => {
    return drivers.find(driver => driver.id === driverId)
  }

  // 使用率を計算
  const calculateUsageRate = (quota: VacationQuota) => {
    if (quota.totalDays === 0) return 0
    return Math.round((quota.usedDays / quota.totalDays) * 100)
  }

  // 使用率の色を取得
  const getUsageRateColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600'
    if (rate >= 60) return 'text-yellow-600'
    if (rate >= 40) return 'text-blue-600'
    return 'text-green-600'
  }

  // 残日数の色を取得
  const getRemainingDaysColor = (days: number) => {
    if (days <= 3) return 'text-red-600 bg-red-50'
    if (days <= 5) return 'text-yellow-600 bg-yellow-50'
    if (days <= 10) return 'text-blue-600 bg-blue-50'
    return 'text-green-600 bg-green-50'
  }

  // 休暇残日数を更新
  const handleUpdateQuota = (updatedQuota: VacationQuota) => {
    const updatedQuotas = vacationQuotas.map(quota =>
      quota.id === updatedQuota.id ? {
        ...updatedQuota,
        remainingDays: updatedQuota.totalDays + updatedQuota.carryOverDays - updatedQuota.usedDays
      } : quota
    )
    onQuotasChange(updatedQuotas)
    setEditingQuota(null)
  }

  // 新しい休暇残日数を追加
  const handleAddQuota = () => {
    const driver = drivers.find(d => d.id === newQuota.driverId)
    if (!driver) return

    const quota: VacationQuota = {
      id: Date.now(),
      driverId: newQuota.driverId,
      year: newQuota.year,
      totalDays: newQuota.totalDays,
      usedDays: newQuota.usedDays,
      remainingDays: newQuota.totalDays + newQuota.carryOverDays - newQuota.usedDays,
      carryOverDays: newQuota.carryOverDays
    }

    onQuotasChange([...vacationQuotas, quota])
    setNewQuota({
      driverId: 0,
      year: new Date().getFullYear(),
      totalDays: 20,
      usedDays: 0,
      carryOverDays: 0
    })
    setShowAddForm(false)
  }

  // 休暇残日数を削除
  const handleDeleteQuota = (quotaId: number) => {
    const updatedQuotas = vacationQuotas.filter(quota => quota.id !== quotaId)
    onQuotasChange(updatedQuotas)
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総ドライバー数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均残日数</p>
              <p className="text-3xl font-bold text-green-600">{stats.averageRemaining}日</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">残日数少</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowQuotaDrivers}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">高使用率</p>
              <p className="text-3xl font-bold text-orange-600">{stats.highUsageDrivers}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">休暇残日数管理</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </button>
      </div>

      {/* 新規追加フォーム */}
      {showAddForm && (
        <div className="card p-6 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">新規休暇残日数追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="form-label">ドライバー</label>
              <select
                value={newQuota.driverId}
                onChange={(e) => setNewQuota({ ...newQuota, driverId: Number(e.target.value) })}
                className="form-select"
              >
                <option value={0}>選択してください</option>
                {drivers.filter(driver => 
                  !vacationQuotas.some(quota => quota.driverId === driver.id && quota.year === newQuota.year)
                ).map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.team})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">年度</label>
              <input
                type="number"
                value={newQuota.year}
                onChange={(e) => setNewQuota({ ...newQuota, year: Number(e.target.value) })}
                className="form-input"
                min="2020"
                max="2030"
              />
            </div>

            <div>
              <label className="form-label">総日数</label>
              <input
                type="number"
                value={newQuota.totalDays}
                onChange={(e) => setNewQuota({ ...newQuota, totalDays: Number(e.target.value) })}
                className="form-input"
                min="0"
                max="30"
              />
            </div>

            <div>
              <label className="form-label">使用日数</label>
              <input
                type="number"
                value={newQuota.usedDays}
                onChange={(e) => setNewQuota({ ...newQuota, usedDays: Number(e.target.value) })}
                className="form-input"
                min="0"
                max={newQuota.totalDays}
              />
            </div>

            <div>
              <label className="form-label">繰越日数</label>
              <input
                type="number"
                value={newQuota.carryOverDays}
                onChange={(e) => setNewQuota({ ...newQuota, carryOverDays: Number(e.target.value) })}
                className="form-input"
                min="0"
                max="20"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </button>
            <button
              onClick={handleAddQuota}
              className="btn-primary"
              disabled={newQuota.driverId === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              追加
            </button>
          </div>
        </div>
      )}

      {/* 休暇残日数一覧 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ドライバー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  総日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  残日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  繰越日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vacationQuotas.map((quota) => {
                const driver = getDriverInfo(quota.driverId)
                const usageRate = calculateUsageRate(quota)
                const isEditing = editingQuota?.id === quota.id

                return (
                  <tr key={quota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {driver?.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver?.name}</div>
                          <div className="text-sm text-gray-500">{driver?.team} - {driver?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quota.year}年
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingQuota.totalDays}
                          onChange={(e) => setEditingQuota({
                            ...editingQuota,
                            totalDays: Number(e.target.value)
                          })}
                          className="w-16 form-input text-sm"
                          min="0"
                          max="30"
                        />
                      ) : (
                        `${quota.totalDays}日`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingQuota.usedDays}
                          onChange={(e) => setEditingQuota({
                            ...editingQuota,
                            usedDays: Number(e.target.value)
                          })}
                          className="w-16 form-input text-sm"
                          min="0"
                          max={editingQuota.totalDays}
                        />
                      ) : (
                        `${quota.usedDays}日`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getRemainingDaysColor(quota.remainingDays)}`}>
                        {quota.remainingDays}日
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingQuota.carryOverDays}
                          onChange={(e) => setEditingQuota({
                            ...editingQuota,
                            carryOverDays: Number(e.target.value)
                          })}
                          className="w-16 form-input text-sm"
                          min="0"
                          max="20"
                        />
                      ) : (
                        `${quota.carryOverDays}日`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getUsageRateColor(usageRate)}`}>
                          {usageRate}%
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              usageRate >= 80 ? 'bg-red-500' :
                              usageRate >= 60 ? 'bg-yellow-500' :
                              usageRate >= 40 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usageRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateQuota(editingQuota)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingQuota(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingQuota(quota)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>残日数が5日以下のドライバーは早めの休暇取得を推奨してください</li>
                <li>使用率が80%以上のドライバーは計画的な休暇管理が必要です</li>
                <li>繰越日数は翌年度に持ち越される日数です（最大20日）</li>
                <li>年度末には未使用日数の確認と調整を行ってください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 