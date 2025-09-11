'use client'

import { useState, useEffect } from 'react'
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
  MapPin
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import VehicleForm from './VehicleForm'
import VehicleDetail from './VehicleDetail'

import { Vehicle, Driver } from '@/types'
import { getNextInspectionDate } from '@/utils/inspectionUtils'
import { VehicleService } from '@/services/vehicleService'

interface VehicleManagementProps {}

export default function VehicleManagement({}: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'detail'>('list')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [vehiclesData, driversData] = await Promise.all([
        VehicleService.getAll(),
        import('@/services/driverService').then(m => m.DriverService.getAll())
      ])
      
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

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

  const getInspectionWarningLevel = (inspectionDate: Date) => {
    const nextInspection = getNextInspectionDate(inspectionDate)
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


  const handleDelete = async (vehicleId: number) => {
    if (confirm('この車両を削除してもよろしいですか？')) {
      try {
        await VehicleService.delete(vehicleId)
        // データベース同期後、最新データを再取得
        await loadData()
      } catch (err) {
        console.error('Failed to delete vehicle:', err)
        alert('車両の削除に失敗しました')
      }
    }
  }

  const handleSave = async (vehicleData: Partial<Vehicle>) => {
    try {
      if (selectedVehicle) {
        // 編集
        await VehicleService.update(selectedVehicle.id, vehicleData)
        // データベース同期後、最新データを再取得
        await loadData()
      } else {
        // 新規追加
        await VehicleService.create(vehicleData as Omit<Vehicle, 'id'>)
        // データベース同期後、最新データを再取得
        await loadData()
      }
      setCurrentView('list')
      setSelectedVehicle(null)
    } catch (err) {
      console.error('Failed to save vehicle:', err)
      alert('車両の保存に失敗しました')
    }
  }

  if (currentView === 'form') {
    return (
      <VehicleForm
        vehicle={selectedVehicle}
        drivers={drivers}
        vehicles={vehicles}
        onSave={handleSave}
        onCancel={() => {
          setCurrentView('list')
          setSelectedVehicle(null)
        }}
        onDriverUpdate={(updates) => {
          // ドライバーの車両割り当てを自動更新
          if (drivers) {
            const updatedDrivers = drivers.map(driver => {
              const update = updates.find(u => u.driverName === driver.name)
              if (update) {
                return { ...driver, assignedVehicle: update.vehiclePlateNumber || undefined }
              }
              return driver
            })
            setDrivers(updatedDrivers)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
        <button 
          onClick={loadData}
          className="ml-4 btn-primary"
        >
          再試行
        </button>
      </div>
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
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="all">すべてのチーム</option>
              <option value="配送センターチーム">配送センターチーム</option>
              <option value="常駐チーム">常駐チーム</option>
              <option value="Bチーム">Bチーム</option>
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
                  次回車検
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
                const nextInspection = getNextInspectionDate(vehicle.inspectionDate)
                const inspectionDays = getInspectionDays(nextInspection)
                const warningLevel = getInspectionWarningLevel(vehicle.inspectionDate)
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
                          {vehicle.driver || (
                            <span className="text-gray-500">未割当</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{vehicle.team}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {format(nextInspection, 'MM月dd日', { locale: ja })}
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