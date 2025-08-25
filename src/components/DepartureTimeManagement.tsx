'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Calendar, Search, Trash2, Edit3 } from 'lucide-react'
import { DepartureTime } from '@/types'
import { DepartureTimeService } from '@/services/departureTimeService'
import Papa from 'papaparse'

export default function DepartureTimeManagement() {
  const [departureTimes, setDepartureTimes] = useState<DepartureTime[]>([])
  const [filteredDepartureTimes, setFilteredDepartureTimes] = useState<DepartureTime[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'time' | 'driver'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // データの初期化
  useEffect(() => {
    const loadDepartureTimes = async () => {
      try {
        setLoading(true)
        const allDepartureTimes = await DepartureTimeService.getAll()
        setDepartureTimes(allDepartureTimes)
        setFilteredDepartureTimes(allDepartureTimes)
      } catch (error) {
        console.error('Failed to load departure times:', error)
        alert('出庫時間の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadDepartureTimes()
  }, [])

  // 日付フィルタリング
  useEffect(() => {
    if (selectedDate) {
      const filtered = departureTimes.filter(dt => 
        dt.departureDate.toDateString() === selectedDate.toDateString()
      )
      setFilteredDepartureTimes(filtered)
    } else {
      setFilteredDepartureTimes(departureTimes)
    }
  }, [selectedDate, departureTimes])

  // ソート処理
  const sortedDepartureTimes = [...filteredDepartureTimes].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = a.departureDate.getTime() - b.departureDate.getTime()
        break
      case 'time':
        comparison = a.departureTime.localeCompare(b.departureTime)
        break
      case 'driver':
        comparison = a.driverName.localeCompare(b.driverName)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // CSV出力
  const handleCsvExport = async () => {
    try {
      const csvData = await DepartureTimeService.getCsvDataForDate(selectedDate)
      
      if (csvData.length === 0) {
        alert('選択した日付の出庫時間データがありません')
        return
      }

      // CSV形式に変換（ヘッダーを日本語に）
      const csvDataWithHeaders = [
        ['日付', '出庫時間', 'ドライバー名', '車両番号'],
        ...csvData.map(row => [row.date, row.time, row.driverName, row.vehiclePlateNumber])
      ]
      
      const csvContent = Papa.unparse(csvDataWithHeaders)

      // ファイルダウンロード
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const dateString = selectedDate.toISOString().split('T')[0]
      link.setAttribute('href', url)
      link.setAttribute('download', `departure_times_${dateString}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert('CSVファイルをダウンロードしました')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      alert('CSV出力に失敗しました')
    }
  }

  // データ再読み込み
  const handleRefresh = async () => {
    try {
      setLoading(true)
      const allDepartureTimes = await DepartureTimeService.getAll()
      setDepartureTimes(allDepartureTimes)
    } catch (error) {
      console.error('Failed to refresh departure times:', error)
      alert('データの再読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 出庫時間削除
  const handleDelete = async (id: number, driverName: string, date: string) => {
    if (!confirm(`${driverName}さんの${date}の出庫時間を削除しますか？`)) return

    try {
      await DepartureTimeService.delete(id)
      await handleRefresh()
      alert('出庫時間を削除しました')
    } catch (error) {
      console.error('Failed to delete departure time:', error)
      alert('出庫時間の削除に失敗しました')
    }
  }

  // ソートハンドラー
  const handleSort = (newSortBy: 'date' | 'time' | 'driver') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">出庫時間管理</h1>
            <p className="text-gray-600">ドライバーの出庫時間を管理します</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          <span>更新</span>
        </button>
      </div>

      {/* フィルター・エクスポートエリア */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">フィルター・エクスポート</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 日付選択 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日付を選択
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* CSV出力ボタン */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleCsvExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>CSV出力</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          選択した日付: {selectedDate.toLocaleDateString('ja-JP')} 
          ({filteredDepartureTimes.length}件の出庫時間)
        </div>
      </div>

      {/* 出庫時間一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">出庫時間一覧</h2>
          <p className="text-sm text-gray-600 mt-1">
            クリックしてソート可能です
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>日付</span>
                    {sortBy === 'date' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center space-x-1">
                    <span>出庫時間</span>
                    {sortBy === 'time' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('driver')}
                >
                  <div className="flex items-center space-x-1">
                    <span>ドライバー名</span>
                    {sortBy === 'driver' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  社員番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  車両番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDepartureTimes.length > 0 ? (
                sortedDepartureTimes.map(depTime => (
                  <tr key={depTime.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {depTime.departureDate.toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600">
                        {depTime.departureTime}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {depTime.driverName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {depTime.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {depTime.vehiclePlateNumber || '未割当'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {depTime.createdAt.toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(depTime.id, depTime.driverName, depTime.departureDate.toLocaleDateString('ja-JP'))}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {selectedDate ? '選択した日付の出庫時間データがありません' : '出庫時間データがありません'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">本日の出庫登録数</p>
              <p className="text-2xl font-bold text-blue-600">
                {departureTimes.filter(dt => 
                  dt.departureDate.toDateString() === new Date().toDateString()
                ).length}件
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">選択日の出庫登録数</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredDepartureTimes.length}件
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総出庫登録数</p>
              <p className="text-2xl font-bold text-purple-600">
                {departureTimes.length}件
              </p>
            </div>
            <Download className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )

}