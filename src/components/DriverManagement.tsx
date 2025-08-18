'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Calendar,
  Car,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Driver, Vehicle } from '@/types'
import DriverForm from './DriverForm'
import DriverDetail from './DriverDetail'
import { DriverService } from '@/services/driverService'
import { VehicleService } from '@/services/vehicleService'

interface DriverManagementProps {}

export default function DriverManagement({}: DriverManagementProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'detail'>('list')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
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
      
      const [driversData, vehiclesData] = await Promise.all([
        DriverService.getAll(),
        VehicleService.getAll()
      ])
      
      setDrivers(driversData)
      setVehicles(vehiclesData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }



  const toggleNightShift = async (driverId: number) => {
    try {
      const driver = drivers.find(d => d.id === driverId)
      if (!driver) return
      
      const isCurrentlyNightShift = driver.isNightShift
      const updatedDriver = await DriverService.update(driverId, {
        isNightShift: !isCurrentlyNightShift,
        status: (!isCurrentlyNightShift ? 'night_shift' : 'working') as Driver['status']
      })
      
      setDrivers(drivers.map(d => d.id === driverId ? updatedDriver : d))
    } catch (err) {
      console.error('Failed to toggle night shift:', err)
      alert('夕勤状態の切替えに失敗しました')
    }
  }

  const handleDelete = async (driverId: number) => {
    if (confirm('このドライバーを削除してもよろしいですか？')) {
      try {
        const driverToDelete = drivers.find(d => d.id === driverId)
        
        // 割り当てられた車両があれば解除
        if (driverToDelete?.assignedVehicle) {
          const vehicleToUpdate = vehicles.find(v => v.plateNumber === driverToDelete.assignedVehicle)
          if (vehicleToUpdate) {
            await VehicleService.update(vehicleToUpdate.id, { driver: undefined })
            const updatedVehicles = vehicles.map(v => 
              v.plateNumber === driverToDelete.assignedVehicle 
                ? { ...v, driver: undefined }
                : v
            )
            setVehicles(updatedVehicles)
          }
        }
        
        await DriverService.delete(driverId)
        setDrivers(drivers.filter(d => d.id !== driverId))
      } catch (err) {
        console.error('Failed to delete driver:', err)
        alert('ドライバーの削除に失敗しました')
      }
    }
  }

  const handleSave = async (driverData: Partial<Driver>) => {
    try {
      if (selectedDriver) {
        // 編集
        const updatedDriver = await DriverService.update(selectedDriver.id, driverData)
        setDrivers(drivers.map(d => d.id === selectedDriver.id ? updatedDriver : d))
        
        // 車両の割り当て更新
        if (driverData.assignedVehicle !== selectedDriver.assignedVehicle) {
          let updatedVehicles = [...vehicles]
          
          // 前の車両から割り当て解除
          if (selectedDriver.assignedVehicle) {
            const oldVehicle = vehicles.find(v => v.plateNumber === selectedDriver.assignedVehicle)
            if (oldVehicle) {
              await VehicleService.update(oldVehicle.id, { driver: undefined })
            }
            updatedVehicles = updatedVehicles.map(v => 
              v.plateNumber === selectedDriver.assignedVehicle 
                ? { ...v, driver: undefined }
                : v
            )
          }
          
          // 新しい車両に割り当て
          if (driverData.assignedVehicle) {
            const newVehicle = vehicles.find(v => v.plateNumber === driverData.assignedVehicle)
            if (newVehicle) {
              await VehicleService.update(newVehicle.id, { driver: `${driverData.name || selectedDriver.name}` })
            }
            updatedVehicles = updatedVehicles.map(v => 
              v.plateNumber === driverData.assignedVehicle 
                ? { ...v, driver: `${driverData.name || selectedDriver.name}` }
                : v
            )
          }
          
          setVehicles(updatedVehicles)
        }
      } else {
        // 新規追加
        const newDriver = await DriverService.create(driverData as Omit<Driver, 'id'>)
        setDrivers([...drivers, newDriver])
        
        // 車両割り当て
        if (driverData.assignedVehicle) {
          const vehicle = vehicles.find(v => v.plateNumber === driverData.assignedVehicle)
          if (vehicle) {
            await VehicleService.update(vehicle.id, { driver: driverData.name })
          }
          const updatedVehicles = vehicles.map(v => 
            v.plateNumber === driverData.assignedVehicle 
              ? { ...v, driver: driverData.name }
              : v
          )
          setVehicles(updatedVehicles)
        }
      }
      setCurrentView('list')
      setSelectedDriver(null)
    } catch (err) {
      console.error('Failed to save driver:', err)
      alert('ドライバーの保存に失敗しました')
    }
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 祝日チームでのフィルタリング
    const matchesHolidayTeam = filterStatus === 'all' || 
      (filterStatus === 'none' ? (!driver.holidayTeams || driver.holidayTeams.length === 0) :
       (driver.holidayTeams && driver.holidayTeams.includes(filterStatus)))
    
    const matchesTeam = filterTeam === 'all' || driver.team === filterTeam
    
    return matchesSearch && matchesHolidayTeam && matchesTeam
  })


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

  if (currentView === 'form') {
    return (
      <DriverForm
        driver={selectedDriver}
        vehicles={vehicles.filter(v => !v.driver || v.driver === selectedDriver?.name)}
        existingDrivers={drivers}
        onSave={handleSave}
        onCancel={() => {
          setCurrentView('list')
          setSelectedDriver(null)
        }}
        onVehicleUpdate={(updates) => {
          // 車両の担当ドライバーを自動更新
          const updatedVehicles = vehicles.map(vehicle => {
            const update = updates.find(u => u.plateNumber === vehicle.plateNumber)
            if (update) {
              return { ...vehicle, driver: update.driverName || undefined }
            }
            return vehicle
          })
          setVehicles(updatedVehicles)
        }}
      />
    )
  }

  if (currentView === 'detail' && selectedDriver) {
    return (
      <DriverDetail
        driver={selectedDriver}
        vehicles={vehicles}
        onEdit={() => setCurrentView('form')}
        onBack={() => {
          setCurrentView('list')
          setSelectedDriver(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ドライバー管理</h2>
          <p className="text-gray-600 mt-1">ドライバーの登録・編集・スケジュール管理</p>
        </div>
        <button
          onClick={() => {
            setSelectedDriver(null)
            setCurrentView('form')
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>新規ドライバー登録</span>
        </button>
      </div>


      {/* 検索・フィルター */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ドライバー名または社員IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">すべての祝日チーム</option>
              <option value="Aチーム">Aチーム</option>
              <option value="Bチーム">Bチーム</option>
              <option value="Cチーム">Cチーム</option>
              <option value="Dチーム">Dチーム</option>
              <option value="Eチーム">Eチーム</option>
              <option value="Fチーム">Fチーム</option>
              <option value="Gチーム">Gチーム</option>
              <option value="none">祝日チーム未設定</option>
            </select>
            
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">すべてのチーム</option>
              <option value="配送センターチーム">配送センターチーム</option>
              <option value="常駐チーム">常駐チーム</option>
              <option value="Bチーム">Bチーム</option>
              <option value="外部ドライバー">外部ドライバー</option>
            </select>
          </div>
        </div>
      </div>

      {/* ドライバー一覧 */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            ドライバー一覧 ({filteredDrivers.length}件)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ドライバー情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  チーム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  祝日チーム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  割り当て車両
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          社員ID: {driver.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {driver.team}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(driver.team === '配送センターチーム' || driver.team === '外部ドライバー') ? (
                      driver.holidayTeams && driver.holidayTeams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {driver.holidayTeams.map((team: string) => (
                            <span key={team} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {team}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">未設定</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {driver.team === 'Bチーム' ? (
                        <div className="flex items-center">
                          <Car className="h-4 w-4 text-orange-400 mr-1" />
                          <span className="text-orange-600 font-medium">都度割り当て</span>
                        </div>
                      ) : driver.assignedVehicle ? (
                        <div className="flex items-center">
                          <Car className="h-4 w-4 text-gray-400 mr-1" />
                          <div>
                            <div className="font-medium">{driver.assignedVehicle}</div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const assignedVehicle = vehicles.find(v => v.plateNumber === driver.assignedVehicle)
                                return assignedVehicle ? assignedVehicle.model : '車種不明'
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">未割当</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver)
                          setCurrentView('detail')
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="詳細表示"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDriver(driver)
                          setCurrentView('form')
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleNightShift(driver.id)}
                        className={`${
                          driver.isNightShift 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-orange-600 hover:text-orange-900'
                        }`}
                        title={driver.isNightShift ? '夜勤解除' : '夜勤設定'}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="text-red-600 hover:text-red-900"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDrivers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ドライバーが見つかりません</h3>
            <p className="mt-1 text-sm text-gray-500">
              検索条件を変更するか、新しいドライバーを追加してください。
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 