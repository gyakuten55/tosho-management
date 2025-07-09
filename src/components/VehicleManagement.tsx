'use client'

import { useState } from 'react'
import { 
  Car, 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Calendar,
  Settings,
  Eye,
  MapPin
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import VehicleForm from './VehicleForm'
import VehicleDetail from './VehicleDetail'

import { Vehicle, Driver } from '@/types'

interface VehicleManagementProps {
  vehicles: Vehicle[]
  drivers?: Driver[]
  onVehiclesChange: (vehicles: Vehicle[]) => void
  onDriversChange?: (drivers: Driver[]) => void
}

export default function VehicleManagement({ vehicles, drivers = [], onVehiclesChange, onDriversChange }: VehicleManagementProps) {
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'detail'>('list')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inspection':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'repair':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4" />
      case 'inspection':
        return <Calendar className="h-4 w-4" />
      case 'repair':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '稼働中'
      case 'inspection':
        return '点検中'
      case 'repair':
        return '修理中'
      default:
        return '不明'
    }
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.driver && vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         vehicle.garage.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus
    const matchesTeam = filterTeam === 'all' || vehicle.team === filterTeam

    return matchesSearch && matchesStatus && matchesTeam
  })

  const getInspectionDays = (nextInspection: Date) => {
    const today = new Date()
    const diffTime = nextInspection.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getInspectionWarningLevel = (nextInspection: Date) => {
    const days = getInspectionDays(nextInspection)
    if (days <= 7) return 'urgent'
    if (days <= 30) return 'warning'
    return 'normal'
  }

  const getInspectionWarningColor = (level: string) => {
    switch (level) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setCurrentView('form')
  }

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setCurrentView('detail')
  }

  const handleDelete = (vehicleId: number) => {
    if (confirm('この車両を削除してもよろしいですか？')) {
      onVehiclesChange(vehicles.filter(v => v.id !== vehicleId))
    }
  }

  const handleSave = (vehicleData: Partial<Vehicle>) => {
    if (selectedVehicle) {
      // 編集
      onVehiclesChange(vehicles.map(v => 
        v.id === selectedVehicle.id ? { ...v, ...vehicleData } : v
      ))
    } else {
      // 新規追加
      const newVehicle: Vehicle = {
        id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
        ...vehicleData
      } as Vehicle
      onVehiclesChange([...vehicles, newVehicle])
    }
    setCurrentView('list')
    setSelectedVehicle(null)
  }

  if (currentView === 'form') {
    return (
      <VehicleForm
        vehicle={selectedVehicle}
        drivers={drivers}
        onSave={handleSave}
        onCancel={() => {
          setCurrentView('list')
          setSelectedVehicle(null)
        }}
        onDriverUpdate={(updates) => {
          // ドライバーの車両割り当てを自動更新
          if (onDriversChange && drivers) {
            const updatedDrivers = drivers.map(driver => {
              const update = updates.find(u => u.driverName === driver.name)
              if (update) {
                return { ...driver, assignedVehicle: update.vehiclePlateNumber || undefined }
              }
              return driver
            })
            onDriversChange(updatedDrivers)
          }
        }}
      />
    )
  }

  if (currentView === 'detail') {
    return (
      <VehicleDetail
        vehicle={selectedVehicle!}
        onEdit={() => setCurrentView('form')}
        onBack={() => {
          setCurrentView('list')
          setSelectedVehicle(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Car className="h-8 w-8 mr-3 text-primary-600" />
          車両管理
        </h1>
        <button
          onClick={() => {
            setSelectedVehicle(null)
            setCurrentView('form')
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>新規車両登録</span>
        </button>
      </div>

      {/* 統計カード - 要件定義書に基づく表示 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今日動いている車両台数</p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.status === 'normal').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">点検中車両台数</p>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => v.status === 'inspection').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">修理中車両台数</p>
              <p className="text-2xl font-bold text-red-600">
                {vehicles.filter(v => v.status === 'repair').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">点検が近い車両</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => getInspectionDays(v.nextInspection) <= 30).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="車両番号、車種、ドライバー名、車庫で検索..."
                className="w-full pl-10 input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">すべてのステータス</option>
              <option value="active">稼働中</option>
              <option value="inspection">点検中</option>
              <option value="repair">修理中</option>
            </select>
            <select
              className="input-field"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="all">すべてのチーム</option>
                              <option value="A-1">A-1</option>
                <option value="A-2">A-2</option>
                <option value="B">B</option>
            </select>
          </div>
        </div>
      </div>

      {/* 車両リスト */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  車両情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ドライバー・チーム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  次回点検
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  車庫情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => {
                const inspectionDays = getInspectionDays(vehicle.nextInspection)
                const warningLevel = getInspectionWarningLevel(vehicle.nextInspection)
                return (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                        <div className="text-sm text-gray-500">{vehicle.model} ({vehicle.year}年)</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {vehicle.driver || '未割当'}
                        </div>
                        <div className="text-sm text-gray-500">{vehicle.team}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                        {getStatusIcon(vehicle.status)}
                        <span className="ml-1">{getStatusText(vehicle.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {format(vehicle.nextInspection, 'MM月dd日', { locale: ja })}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getInspectionWarningColor(warningLevel)}`}>
                          {inspectionDays > 0 ? `あと${inspectionDays}日` : `${Math.abs(inspectionDays)}日経過`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {vehicle.garage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(vehicle)}
                          className="text-blue-600 hover:text-blue-900"
                          title="詳細表示"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-primary-600 hover:text-primary-900"
                          title="編集"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-900"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 結果表示 */}
      <div className="text-sm text-gray-500 text-center">
        {filteredVehicles.length} 件中 {filteredVehicles.length} 件を表示
      </div>
    </div>
  )
} 