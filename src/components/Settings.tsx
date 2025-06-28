'use client'

import { useState } from 'react'
import { 
  Building, 
  Users, 
  Bell, 
  Shield, 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Globe,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react'

interface SettingsProps {}

export default function Settings({}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('company')
  const [showPassword, setShowPassword] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // 会社情報の状態
  const [companyInfo, setCompanyInfo] = useState({
    name: '東京陸送株式会社',
    address: '東京都江東区新木場2-6-10',
    phone: '03-3522-1234',
    email: 'info@tokyo-rikuso.co.jp',
    website: 'https://www.tokyo-rikuso.co.jp',
    licenseNumber: '関東運輸局第12345号',
    establishedYear: '1962',
    representative: '田中太郎',
    businessHours: '8:00-18:00',
    emergencyContact: '090-1234-5678'
  })

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
    emailNotifications: true,
    smsNotifications: false,
    inspectionAlerts: true,
    scheduleUpdates: true,
    maintenanceAlerts: true,
    emergencyAlerts: true,
    dailyReports: false,
    weeklyReports: true
  })

  // ユーザー管理の状態
  const [users, setUsers] = useState([
    { id: 1, name: '管理者', email: 'admin@tokyo-rikuso.co.jp', role: 'admin', status: 'active' },
    { id: 2, name: '配車担当者A', email: 'dispatcher-a@tokyo-rikuso.co.jp', role: 'dispatcher', status: 'active' },
    { id: 3, name: '配車担当者B', email: 'dispatcher-b@tokyo-rikuso.co.jp', role: 'dispatcher', status: 'active' },
    { id: 4, name: 'ドライバー山田', email: 'yamada@tokyo-rikuso.co.jp', role: 'driver', status: 'active' }
  ])

  const handleSave = async () => {
    setSaveStatus('saving')
    
    // 実際の保存処理をシミュレート
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }

  const tabs = [
    { id: 'company', label: '会社情報', icon: Building },
    { id: 'system', label: 'システム設定', icon: SettingsIcon },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'users', label: 'ユーザー管理', icon: Users },
    { id: 'security', label: 'セキュリティ', icon: Shield }
  ]

  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label">
            会社名
          </label>
          <input
            type="text"
            value={companyInfo.name}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
            className="form-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            代表者名
          </label>
          <input
            type="text"
            value={companyInfo.representative}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, representative: e.target.value }))}
            className="form-input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            住所
          </label>
          <input
            type="text"
            value={companyInfo.address}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            電話番号
          </label>
          <input
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline h-4 w-4 mr-1" />
            メールアドレス
          </label>
          <input
            type="email"
            value={companyInfo.email}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="inline h-4 w-4 mr-1" />
            ウェブサイト
          </label>
          <input
            type="url"
            value={companyInfo.website}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            運輸許可番号
          </label>
          <input
            type="text"
            value={companyInfo.licenseNumber}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            設立年
          </label>
          <input
            type="text"
            value={companyInfo.establishedYear}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, establishedYear: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            営業時間
          </label>
          <input
            type="text"
            value={companyInfo.businessHours}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, businessHours: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            緊急連絡先
          </label>
          <input
            type="tel"
            value={companyInfo.emergencyContact}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>
  )

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            デフォルトチーム
          </label>
          <select
            value={systemSettings.defaultTeam}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultTeam: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="Bチーム">Bチーム</option>
            <option value="Cチーム">Cチーム</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            点検アラート日数
          </label>
          <input
            type="number"
            value={systemSettings.inspectionAlertDays}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, inspectionAlertDays: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            勤務開始時間
          </label>
          <input
            type="time"
            value={systemSettings.workingHours.start}
            onChange={(e) => setSystemSettings(prev => ({ 
              ...prev, 
              workingHours: { ...prev.workingHours, start: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            勤務終了時間
          </label>
          <input
            type="time"
            value={systemSettings.workingHours.end}
            onChange={(e) => setSystemSettings(prev => ({ 
              ...prev, 
              workingHours: { ...prev.workingHours, end: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メンテナンス提醒日数
          </label>
          <input
            type="number"
            value={systemSettings.maintenanceReminderDays}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceReminderDays: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

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

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">至急便優先処理</h4>
            <p className="text-sm text-gray-600">至急便を自動的に最優先で処理します</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={systemSettings.urgentJobPriority}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, urgentJobPriority: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">ドライバー自動割り当て</h4>
            <p className="text-sm text-gray-600">利用可能なドライバーを自動的に配車に割り当てます</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={systemSettings.autoAssignDrivers}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, autoAssignDrivers: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">通知方法</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                <Mail className="inline h-4 w-4 mr-1" />
                メール通知
              </h4>
              <p className="text-sm text-gray-600">重要な通知をメールで受信します</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                <Phone className="inline h-4 w-4 mr-1" />
                SMS通知
              </h4>
              <p className="text-sm text-gray-600">緊急時にSMSで通知を受信します</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">通知種類</h3>
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

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          <Shield className="inline h-5 w-5 mr-2" />
          セキュリティ設定
        </h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                セキュリティ設定の変更には管理者権限が必要です
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                これらの設定を変更する前に、現在のパスワードを入力してください。
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在のパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                placeholder="現在のパスワードを入力"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="新しいパスワードを入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード確認
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="新しいパスワードを再入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セッションタイムアウト（分）
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">セキュリティオプション</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">二段階認証</h4>
                <p className="text-sm text-gray-600">ログイン時に追加の認証を要求します</p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                設定する
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">ログイン履歴</h4>
                <p className="text-sm text-gray-600">過去のログイン記録を確認します</p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                確認する
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">アクセス権限</h4>
                <p className="text-sm text-gray-600">ユーザーのアクセス権限を管理します</p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                管理する
              </button>
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
          {activeTab === 'company' && renderCompanySettings()}
          {activeTab === 'system' && renderSystemSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'security' && renderSecuritySettings()}
        </div>
      </div>
    </div>
  )
}