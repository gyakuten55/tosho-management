'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VacationSettingsService } from '@/services/vacationSettingsService'

export default function ResetSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleReset = async () => {
    setLoading(true)
    setResult('')
    
    try {
      await VacationSettingsService.resetToDefault()
      setResult('✅ 設定をリセットしました。特定日付データが削除され、デフォルト設定に戻りました。')
    } catch (error) {
      console.error('Reset failed:', error)
      setResult('❌ リセットに失敗しました: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">設定リセット</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            このボタンを押すと、Supabaseの休暇設定データがリセットされ、
            特定日付の設定が完全に削除されます。
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ この操作は元に戻せません。既存の設定がすべて削除されます。
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? 'リセット中...' : '設定をリセットする'}
        </button>

        {result && (
          <div className="mt-6 p-4 rounded-lg bg-gray-50">
            <p className="text-sm">{result}</p>
          </div>
        )}

        <div className="mt-6">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}