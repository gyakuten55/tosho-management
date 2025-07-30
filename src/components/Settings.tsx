'use client'

import { useState } from 'react'
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
  Calendar
} from 'lucide-react'

interface SettingsProps {}

export default function Settings({}: SettingsProps) {
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

  // 休暇設定の状態
  const [vacationSettings, setVacationSettings] = useState({
    minimumOffDaysPerMonth: 9,
    maximumOffDaysPerMonth: 12,
    notificationDate: 25,
    globalMaxDriversOffPerDay: 3,
    maxDriversOffPerDay: {
      '配送センターチーム': 2,
      '常駐チーム': 1,
      'Bチーム': 2
    },
    blackoutDates: [
      new Date('2025-01-01'),
      new Date('2025-12-31')
    ],
    holidayDates: [
      new Date('2025-01-01'),
      new Date('2025-01-13'),
      new Date('2025-02-11'),
      new Date('2025-03-20'),
      new Date('2025-04-29'),
      new Date('2025-05-03'),
      new Date('2025-05-04'),
      new Date('2025-05-05'),
      new Date('2025-07-21'),
      new Date('2025-08-11'),
      new Date('2025-09-15'),
      new Date('2025-09-23'),
      new Date('2025-10-13'),
      new Date('2025-11-03'),
      new Date('2025-11-23')
    ]
  })

  const handleSave = async () => {
    setSaveStatus('saving')
    
    // 実際の保存処理をシミュレート
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
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

  const renderVacationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          <Calendar className="inline h-5 w-5 mr-2" />
          休暇管理設定
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                休暇管理システム統合設定
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                ここで設定した内容は休暇管理ページ全体に適用されます。
              </div>
            </div>
          </div>
        </div>

        {/* 基本設定 */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">基本設定</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月間最低休暇日数
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={vacationSettings.minimumOffDaysPerMonth}
                  onChange={(e) => setVacationSettings(prev => ({
                    ...prev,
                    minimumOffDaysPerMonth: parseInt(e.target.value) || 9
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">ドライバーが1ヶ月に取得すべき最低休暇日数</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月間最大休暇日数
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={vacationSettings.maximumOffDaysPerMonth}
                  onChange={(e) => setVacationSettings(prev => ({
                    ...prev,
                    maximumOffDaysPerMonth: parseInt(e.target.value) || 12
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">ドライバーが1ヶ月に取得できる最大休暇日数</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知日（毎月）
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={vacationSettings.notificationDate}
                  onChange={(e) => setVacationSettings(prev => ({
                    ...prev,
                    notificationDate: parseInt(e.target.value) || 25
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">休暇不足の通知を送信する日（月の何日か）</p>
              </div>
            </div>
          </div>

          {/* 休暇制限設定 */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">休暇制限設定</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  全体の1日最大休暇者数
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={vacationSettings.globalMaxDriversOffPerDay}
                    onChange={(e) => setVacationSettings(prev => ({
                      ...prev,
                      globalMaxDriversOffPerDay: parseInt(e.target.value) || 3
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    人/日
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">全社的な1日あたりの最大休暇取得者数</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配送センターチーム
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vacationSettings.maxDriversOffPerDay['配送センターチーム']}
                    onChange={(e) => setVacationSettings(prev => ({
                      ...prev,
                      maxDriversOffPerDay: {
                        ...prev.maxDriversOffPerDay,
                        '配送センターチーム': parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    人/日
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">チーム内の1日最大休暇者数</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  常駐チーム
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vacationSettings.maxDriversOffPerDay['常駐チーム']}
                    onChange={(e) => setVacationSettings(prev => ({
                      ...prev,
                      maxDriversOffPerDay: {
                        ...prev.maxDriversOffPerDay,
                        '常駐チーム': parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    人/日
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">チーム内の1日最大休暇者数</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bチーム
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vacationSettings.maxDriversOffPerDay['Bチーム']}
                    onChange={(e) => setVacationSettings(prev => ({
                      ...prev,
                      maxDriversOffPerDay: {
                        ...prev.maxDriversOffPerDay,
                        'Bチーム': parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                    人/日
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">チーム内の1日最大休暇者数</p>
              </div>
            </div>
          </div>

          {/* 設定サマリー */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">設定サマリー</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>月間最低休暇日数：</span>
                  <span className="font-medium">{vacationSettings.minimumOffDaysPerMonth}日</span>
                </div>
                <div className="flex justify-between">
                  <span>月間最大休暇日数：</span>
                  <span className="font-medium">{vacationSettings.maximumOffDaysPerMonth}日</span>
                </div>
                <div className="flex justify-between">
                  <span>通知日：</span>
                  <span className="font-medium">毎月{vacationSettings.notificationDate}日</span>
                </div>
                <div className="flex justify-between">
                  <span>全体の1日最大休暇者数：</span>
                  <span className="font-medium">{vacationSettings.globalMaxDriversOffPerDay}人</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>配送センターチーム：</span>
                  <span className="font-medium">{vacationSettings.maxDriversOffPerDay['配送センターチーム']}人/日</span>
                </div>
                <div className="flex justify-between">
                  <span>常駐チーム：</span>
                  <span className="font-medium">{vacationSettings.maxDriversOffPerDay['常駐チーム']}人/日</span>
                </div>
                <div className="flex justify-between">
                  <span>Bチーム：</span>
                  <span className="font-medium">{vacationSettings.maxDriversOffPerDay['Bチーム']}人/日</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )


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