'use client'

import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Car, 
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Shield
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, Vehicle } from '@/types'

interface DriverDetailProps {
  driver: Driver
  vehicles: Vehicle[]
  onEdit: () => void
  onBack: () => void
}

export default function DriverDetail({ driver, vehicles, onEdit, onBack }: DriverDetailProps) {
  const assignedVehicle = vehicles.find(v => v.plateNumber === driver.assignedVehicle)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'vacation':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'available':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return '出勤中'
      case 'vacation':
        return '休暇中'
      case 'sick':
        return '病気休暇'
      case 'available':
        return '待機中'
      default:
        return '不明'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4" />
      case 'vacation':
        return <Calendar className="h-4 w-4" />
      case 'sick':
        return <AlertTriangle className="h-4 w-4" />
      case 'available':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // 簡易的な運行履歴データ（実際の実装では外部から受け取る）
  const driverHistory = [
    {
      date: new Date('2024-12-20'),
      vehicle: driver.assignedVehicle || '品川 501 あ 1234',
      route: '東京 → 大阪',
      distance: '515km',
      status: '完了'
    },
    {
      date: new Date('2024-12-19'),
      vehicle: driver.assignedVehicle || '品川 501 あ 1234',
      route: '横浜 → 名古屋',
      distance: '365km',
      status: '完了'
    },
    {
      date: new Date('2024-12-18'),
      vehicle: driver.assignedVehicle || '品川 501 あ 1234',
      route: '東京 → 仙台',
      distance: '352km',
      status: '完了'
    }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ドライバー詳細</h2>
            <p className="text-gray-600 mt-1">{driver.name}の詳細情報</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="btn-primary flex items-center space-x-2"
        >
          <Edit className="h-5 w-5" />
          <span>編集</span>
        </button>
      </div>

      {/* 基本情報カード */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{driver.name}</h3>
              <p className="text-gray-600">社員ID: {driver.employeeId}</p>
              <p className="text-sm text-gray-500">{driver.team}</p>
            </div>
          </div>
          <div className={`px-3 py-2 rounded-lg border flex items-center space-x-2 ${getStatusColor(driver.status)}`}>
            {getStatusIcon(driver.status)}
            <span className="font-medium">{getStatusText(driver.status)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">基本情報</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">チーム:</span>
                  <span className="ml-2 text-gray-900">{driver.team}</span>
                </div>

              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">連絡先</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">電話:</span>
                  <span className="ml-2 text-gray-900">{driver.phone || '未設定'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">メール:</span>
                  <span className="ml-2 text-gray-900">{driver.email || '未設定'}</span>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <span className="text-gray-600">住所:</span>
                  <span className="ml-2 text-gray-900">{driver.address || '未設定'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">車両情報</h4>
              {driver.team === 'Bチーム' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900">都度車両割り当て</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-orange-700">
                      Bチームのドライバーは固定の担当車両を持ちません。<br />
                      必要に応じて車両運用管理画面で車両を割り当ててください。
                    </p>
                  </div>
                </div>
              ) : driver.assignedVehicle ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">割り当て車両</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-blue-900">{driver.assignedVehicle}</p>
                    {assignedVehicle && (
                      <p className="text-sm text-blue-700">{assignedVehicle.model}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">車両未割当</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">緊急連絡先</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">氏名:</span>
                  <span className="ml-2 text-gray-900">{driver.emergencyContactName || '未設定'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">電話:</span>
                  <span className="ml-2 text-gray-900">{driver.emergencyContactPhone || '未設定'}</span>
                </div>
              </div>
            </div>

            {/* 祝日チーム */}
            {(driver.team === '配送センターチーム' || driver.team === '配送センター外注') && driver.holidayTeams && driver.holidayTeams.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">祝日チーム</h4>
                <div className="flex flex-wrap gap-2">
                  {driver.holidayTeams.map((team) => (
                    <span
                      key={team}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 免許情報 */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">免許情報</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">運転免許証番号</h4>
            <p className="text-gray-900">{driver.licenseNumber || '未設定'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">免許の種類</h4>
            <p className="text-gray-900">{driver.licenseClass || '未設定'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">有効期限</h4>
            <p className="text-gray-900">
              {driver.licenseExpiryDate
                ? format(new Date(driver.licenseExpiryDate), 'yyyy年MM月dd日', { locale: ja })
                : '未設定'
              }
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">入社日</h4>
            <p className="text-gray-900">
              {driver.hireDate
                ? format(new Date(driver.hireDate), 'yyyy年MM月dd日', { locale: ja })
                : '未設定'
              }
            </p>
          </div>
        </div>
      </div>

      {/* 祝日チーム */}
      {(driver.team === '配送センターチーム' || driver.team === '配送センター外注') && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">祝日チーム</h3>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">配属祝日チーム</h4>
            {driver.holidayTeams && driver.holidayTeams.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {driver.holidayTeams.map((team: string) => (
                  <span key={team} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {team}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">祝日チームが設定されていません</p>
            )}
          </div>
        </div>
      )}

      {/* 最近の運行履歴 */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近の運行履歴</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日付
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  車両
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ルート
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  距離
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {driverHistory.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(record.date, 'MM月dd日', { locale: ja })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.vehicle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.distance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 備考 */}
      {driver.notes && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">備考</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{driver.notes}</p>
        </div>
      )}
    </div>
  )
} 