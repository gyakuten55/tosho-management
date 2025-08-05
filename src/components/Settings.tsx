'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Bell, 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Calendar,
  Plus,
  Trash2,
  CalendarDays,
  Grid,
  Timer,
  Search
} from 'lucide-react'
import { VacationSettings } from '@/types'

interface SettingsProps {
  vacationSettings: VacationSettings
  onVacationSettingsChange: (settings: VacationSettings) => void
}

export default function Settings({ vacationSettings: propVacationSettings, onVacationSettingsChange }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('system')
  const [showPassword, setShowPassword] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')


  // システム設定の状態
  const [systemSettings, setSystemSettings] = useState({
    defaultTeam: 'Bチーム',
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    inspectionAlertDays: 30,
    urgentJobPriority: true,
    autoAssignDrivers: false,
    maintenanceReminderDays: 7,
    backupFrequency: 'daily',
    dataRetentionDays: 365
  })

  // 通知設定の状態
  const [notificationSettings, setNotificationSettings] = useState({
    inspectionAlerts: true,
    scheduleUpdates: true,
    maintenanceAlerts: true,
    emergencyAlerts: true,
    dailyReports: false,
    weeklyReports: true,
    // 車両点検通知設定
    vehicleInspectionNotifications: {
      soundEnabled: true,
      autoRefresh: true,
      alertDays: {
        thirtyDays: true,
        sevenDays: true,
        twoDays: true,
        oneDay: true
      },
      priorityLevels: {
        urgent: true,
        high: true,
        medium: true,
        low: true
      }
    },
    // 休暇通知設定
    vacationNotifications: {
      monthlyReminder: true,
      shortageAlert: true,
      quotaExceeded: true,
      reminderDay: 25
    },
    // 車両稼働通知設定
    vehicleOperationNotifications: {
      assignmentChanges: true,
      inoperativePeriods: true,
      dailyVehicleSwaps: true,
      tempAssignments: true
    }
  })

  // ユーザー管理の状態
  const [users, setUsers] = useState([
    { id: 1, name: '管理者', email: 'admin@tokyo-rikuso.co.jp', role: 'admin', status: 'active' },
    { id: 2, name: '配車担当者A', email: 'dispatcher-a@tokyo-rikuso.co.jp', role: 'dispatcher', status: 'active' },
    { id: 3, name: '配車担当者B', email: 'dispatcher-b@tokyo-rikuso.co.jp', role: 'dispatcher', status: 'active' },
    { id: 4, name: 'ドライバー山田', email: 'yamada@tokyo-rikuso.co.jp', role: 'driver', status: 'active' }
  ])

  // 休暇設定の状態（propsから受け取った値を使用）
  const [vacationSettings, setVacationSettings] = useState<VacationSettings>(propVacationSettings)
  
  // propsが更新されたときに内部stateも更新
  useEffect(() => {
    setVacationSettings(propVacationSettings)
  }, [propVacationSettings])

  // 統一休暇設定用のstate
  const [selectedVacationTeam, setSelectedVacationTeam] = useState('配送センターチーム')
  const [selectedVacationMonth, setSelectedVacationMonth] = useState(1)
  
  // 特定日付設定用のstate
  const [selectedSpecificTeam, setSelectedSpecificTeam] = useState('配送センターチーム')
  const [selectedSpecificMonth, setSelectedSpecificMonth] = useState(1)
  const [selectedSpecificDate, setSelectedSpecificDate] = useState(1)
  const [customLimit, setCustomLimit] = useState(1)

  // 基本設定変更時に特定日付のcustomLimitをリアルタイム更新
  useEffect(() => {
    const tempDate = new Date(2025, selectedSpecificMonth - 1, selectedSpecificDate)
    const weekday = tempDate.getDay()
    const baseLimit = vacationSettings.teamMonthlyWeekdayLimits[selectedSpecificTeam]?.[selectedSpecificMonth]?.[weekday] || 0
    
    // 既存の特定日付設定がない場合のみ、基本設定値に自動更新
    const dateString = `2025-${String(selectedSpecificMonth).padStart(2, '0')}-${String(selectedSpecificDate).padStart(2, '0')}`
    if (!vacationSettings.specificDateLimits[dateString]) {
      setCustomLimit(baseLimit)
    }
  }, [
    vacationSettings.teamMonthlyWeekdayLimits, 
    selectedSpecificTeam, 
    selectedSpecificMonth, 
    selectedSpecificDate,
    vacationSettings.specificDateLimits
  ])

  const handleSave = async () => {
    setSaveStatus('saving')
    
    // 実際の保存処理をシミュレート
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }


  // 日付指定の削除
  const handleRemoveDateLimit = (date: string) => {
    const newLimits = { ...vacationSettings.specificDateLimits }
    delete newLimits[date]
    const newSettings = {
      ...vacationSettings,
      specificDateLimits: newLimits as { [dateString: string]: number }
    }
    setVacationSettings(newSettings)
    onVacationSettingsChange(newSettings) // 親コンポーネントに通知
  }

  // 月名の取得
  const getMonthName = (month: number) => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return months[month - 1]
  }

  // 曜日名の取得
  const getWeekdayName = (weekday: number) => {
    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
    return weekdays[weekday]
  }

  const tabs = [
    { id: 'system', label: 'システム設定', icon: SettingsIcon },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'users', label: 'ユーザー管理', icon: Users },
    { id: 'vacation', label: '休暇設定', icon: Calendar }
  ]


  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Database className="inline h-4 w-4 mr-1" />
            バックアップ頻度
          </label>
          <select
            value={systemSettings.backupFrequency}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="daily">毎日</option>
            <option value="weekly">毎週</option>
            <option value="monthly">毎月</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          <Bell className="inline h-5 w-5 mr-2" />
          統合通知設定
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                システム全体の通知設定
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                ここで設定した内容は全てのページの通知システムに適用されます。
              </div>
            </div>
          </div>
        </div>


        {/* 車両点検通知設定 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">車両点検通知設定</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">音声アラート</h5>
                  <p className="text-sm text-gray-600">緊急度の高い点検アラート時に音声で通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vehicleInspectionNotifications.soundEnabled}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vehicleInspectionNotifications: {
                        ...prev.vehicleInspectionNotifications,
                        soundEnabled: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">自動更新</h5>
                  <p className="text-sm text-gray-600">1分間隔でアラートを自動チェック</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vehicleInspectionNotifications.autoRefresh}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vehicleInspectionNotifications: {
                        ...prev.vehicleInspectionNotifications,
                        autoRefresh: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 休暇通知設定 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">休暇通知設定</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">月次リマインダー</h5>
                  <p className="text-sm text-gray-600">休暇不足ドライバーへの月次通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vacationNotifications.monthlyReminder}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vacationNotifications: {
                        ...prev.vacationNotifications,
                        monthlyReminder: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">休暇枠超過アラート</h5>
                  <p className="text-sm text-gray-600">1日の最大休暇者数を超過時の警告</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vacationNotifications.quotaExceeded}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vacationNotifications: {
                        ...prev.vacationNotifications,
                        quotaExceeded: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 車両稼働通知設定 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">車両稼働通知設定</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">車両割り当て変更</h5>
                  <p className="text-sm text-gray-600">ドライバーへの車両割り当て変更通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vehicleOperationNotifications.assignmentChanges}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vehicleOperationNotifications: {
                        ...prev.vehicleOperationNotifications,
                        assignmentChanges: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">車両稼働不可期間</h5>
                  <p className="text-sm text-gray-600">車両修理・メンテナンス期間の通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.vehicleOperationNotifications.inoperativePeriods}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      vehicleOperationNotifications: {
                        ...prev.vehicleOperationNotifications,
                        inoperativePeriods: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 基本通知種類 */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">その他の通知</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'inspectionAlerts', label: '点検アラート', desc: '車両点検期限が近づいた際の通知' },
              { key: 'scheduleUpdates', label: 'スケジュール更新', desc: '配車スケジュールが変更された際の通知' },
              { key: 'maintenanceAlerts', label: 'メンテナンスアラート', desc: '車両故障やメンテナンス時の通知' },
              { key: 'emergencyAlerts', label: '緊急アラート', desc: '緊急事態発生時の即座の通知' },
              { key: 'dailyReports', label: '日次レポート', desc: '毎日の業務サマリーレポート' },
              { key: 'weeklyReports', label: '週次レポート', desc: '週間の業績レポート' }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{setting.label}</h4>
                  <p className="text-sm text-gray-600">{setting.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings[setting.key as keyof typeof notificationSettings] as boolean}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">ユーザー一覧</h3>
        <button className="btn-primary">
          <Users className="h-4 w-4 mr-2" />
          新規ユーザー追加
        </button>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メールアドレス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'dispatcher' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? '管理者' :
                     user.role === 'dispatcher' ? '配車担当' : 'ドライバー'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'アクティブ' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-3">編集</button>
                  <button className="text-red-600 hover:text-red-900">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderVacationSettings = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            <Calendar className="inline h-5 w-5 mr-2" />
            休暇上限管理設定
          </h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  統一された休暇上限設定
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  チーム選択 → 月選択 → 曜日別上限設定の簡単な3ステップで設定完了。特定日付の個別設定も可能です。
                </div>
              </div>
            </div>
          </div>

          {/* 統一された休暇上限設定 */}
          {renderUnifiedVacationLimitSettings()}

          {/* 特定日付設定 */}
          {renderSpecificDateSettings()}
        </div>
      </div>
    )
  }


  // 統一された休暇上限設定のレンダリング
  const renderUnifiedVacationLimitSettings = () => {
    const teams = Object.keys(vacationSettings.teamMonthlyWeekdayLimits)
    const months = Array.from({length: 12}, (_, i) => i + 1)
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    
    const updateWeekdayLimit = (team: string, month: number, weekday: number, limit: number) => {
      const newSettings = {
        ...vacationSettings,
        teamMonthlyWeekdayLimits: {
          ...vacationSettings.teamMonthlyWeekdayLimits,
          [team]: {
            ...vacationSettings.teamMonthlyWeekdayLimits[team],
            [month]: {
              ...vacationSettings.teamMonthlyWeekdayLimits[team]?.[month],
              [weekday]: limit
            }
          }
        }
      }
      setVacationSettings(newSettings)
      onVacationSettingsChange(newSettings) // 親コンポーネントに通知
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">休暇上限設定</h4>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Timer className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h5 className="text-sm font-medium text-blue-800">設定方法</h5>
              <div className="mt-2 text-sm text-blue-700">
                1. チームを選択 → 2. 月を選択 → 3. 各曜日の上限人数を設定
              </div>
            </div>
          </div>
        </div>

        {/* ステップ1: チーム選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. チーム選択
          </label>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedVacationTeam(team)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedVacationTeam === team
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {/* ステップ2: 月選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. 月選択
          </label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedVacationMonth(month)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedVacationMonth === month
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {month}月
              </button>
            ))}
          </div>
        </div>

        {/* ステップ3: 曜日別上限設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3. {selectedVacationTeam} - {selectedVacationMonth}月の曜日別上限設定
          </label>
          <div className="grid grid-cols-7 gap-3">
            {weekdays.map((weekdayName, weekdayIndex) => (
              <div 
                key={weekdayIndex}
                className={`bg-white border rounded-lg p-3 ${
                  weekdayIndex === 0 || weekdayIndex === 6 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200'
                }`}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  {weekdayName}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={
                    vacationSettings.teamMonthlyWeekdayLimits[selectedVacationTeam]?.[selectedVacationMonth]?.[weekdayIndex] || 0
                  }
                  onChange={(e) => updateWeekdayLimit(
                    selectedVacationTeam, 
                    selectedVacationMonth, 
                    weekdayIndex, 
                    parseInt(e.target.value) || 0
                  )}
                  className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 text-center mt-1">人</p>
                {(weekdayIndex === 0 || weekdayIndex === 6) && (
                  <p className="text-xs text-red-600 text-center mt-1">週末</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 現在の設定一覧表示 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-3">現在の設定 - {selectedVacationTeam}</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {months.map((month) => (
              <div key={month} className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700 mb-1">{month}月</div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekdays.map((_, weekdayIndex) => (
                    <div key={weekdayIndex} className="text-gray-600">
                      {vacationSettings.teamMonthlyWeekdayLimits[selectedVacationTeam]?.[month]?.[weekdayIndex] || 0}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 特定日付設定のレンダリング
  const renderSpecificDateSettings = () => {
    const teams = Object.keys(vacationSettings.teamMonthlyWeekdayLimits)
    const months = Array.from({length: 12}, (_, i) => i + 1)
    const daysInMonth = new Date(2025, selectedSpecificMonth, 0).getDate()
    const dates = Array.from({length: daysInMonth}, (_, i) => i + 1)
    
    // 基本フローで設定された上限値を取得する関数（リアルタイム更新対応）
    const getBaseLimit = (team: string, month: number, date: number) => {
      const tempDate = new Date(2025, month - 1, date)
      const weekday = tempDate.getDay()
      return vacationSettings.teamMonthlyWeekdayLimits[team]?.[month]?.[weekday] || 0
    }
    
    // 特定日付を追加する関数
    const handleAddSpecificDateLimit = () => {
      const dateString = `2025-${String(selectedSpecificMonth).padStart(2, '0')}-${String(selectedSpecificDate).padStart(2, '0')}`
      
      const newSettings = {
        ...vacationSettings,
        specificDateLimits: {
          ...vacationSettings.specificDateLimits,
          [dateString]: customLimit
        }
      }
      setVacationSettings(newSettings)
      onVacationSettingsChange(newSettings) // 親コンポーネントに通知
    }

    const baseLimitForSelectedDate = getBaseLimit(selectedSpecificTeam, selectedSpecificMonth, selectedSpecificDate)

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">特定日付上限設定</h4>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            <div className="ml-3">
              <h5 className="text-sm font-medium text-purple-800">
                特定日付個別設定
              </h5>
              <div className="mt-2 text-sm text-purple-700">
                基本フローで設定した上限を、特定の日付だけ個別に変更できます。こちらの設定が最優先で適用されます。
              </div>
            </div>
          </div>
        </div>

        {/* ステップ1: チーム選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. チーム選択
          </label>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedSpecificTeam(team)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSpecificTeam === team
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {/* ステップ2: 月選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. 月選択
          </label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedSpecificMonth(month)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedSpecificMonth === month
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {month}月
              </button>
            ))}
          </div>
        </div>

        {/* ステップ3: 日付選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3. 日付選択（{selectedSpecificMonth}月）
          </label>
          <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto">
            {dates.map((date) => {
              const tempDate = new Date(2025, selectedSpecificMonth - 1, date)
              const weekdayName = ['日', '月', '火', '水', '木', '金', '土'][tempDate.getDay()]
              const baseLimit = getBaseLimit(selectedSpecificTeam, selectedSpecificMonth, date)
              
              // 既存の特定日付設定があるかチェック
              const dateString = `2025-${String(selectedSpecificMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`
              const hasSpecificSetting = vacationSettings.specificDateLimits[dateString] !== undefined
              const specificLimit = vacationSettings.specificDateLimits[dateString]
              
              return (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedSpecificDate(date)
                    // 既存設定があればその値を、なければ基本設定値を設定
                    setCustomLimit(hasSpecificSetting ? specificLimit : baseLimit)
                  }}
                  className={`p-2 rounded-lg font-medium transition-colors text-center relative ${
                    selectedSpecificDate === date
                      ? 'bg-primary-600 text-white'
                      : hasSpecificSetting
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-sm">{date}</div>
                  <div className="text-xs opacity-75">{weekdayName}</div>
                  <div className="text-xs opacity-75">
                    {hasSpecificSetting ? `${specificLimit}人` : `${baseLimit}人`}
                  </div>
                  {hasSpecificSetting && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* 凡例 */}
          <div className="flex items-center justify-center space-x-6 mt-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded border"></div>
              <span>基本設定</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 rounded border-2 border-orange-300 relative">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span>個別設定済み</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary-600 rounded"></div>
              <span>選択中</span>
            </div>
          </div>
        </div>

        {/* ステップ4: 上限設定と変更 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            4. {selectedSpecificMonth}月{selectedSpecificDate}日の上限設定
          </label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-3">
              <span className="text-sm text-gray-600">
                基本設定の上限: <strong>{baseLimitForSelectedDate}人</strong>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しい上限人数
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleAddSpecificDateLimit}
                className="btn-primary mt-6"
              >
                変更
              </button>
            </div>
          </div>
        </div>

        {/* 設定済み日付一覧 */}
        <div>
          <h5 className="text-md font-medium text-gray-900 mb-4">設定済み特定日付</h5>
          <div className="border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {Object.entries(vacationSettings.specificDateLimits).map(([date, limit]) => (
                <div key={date} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{date}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(date).toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">{limit}人</span>
                    <button
                      onClick={() => handleRemoveDateLimit(date)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {Object.keys(vacationSettings.specificDateLimits).length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  設定された特定日付がありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
        <div className="flex items-center space-x-3">
          {saveStatus === 'saving' && (
            <div className="flex items-center text-yellow-600">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              保存完了
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            保存
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'system' && renderSystemSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'vacation' && renderVacationSettings()}
        </div>
      </div>
    </div>
  )
}