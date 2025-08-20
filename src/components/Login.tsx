'use client'

import { useState } from 'react'
import { User, Eye, EyeOff, Building, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginProps {}

export default function Login({}: LoginProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(employeeId, password)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div className="max-w-md w-full" style={{ maxWidth: '28rem', width: '100%' }}>
        <div 
          className="bg-white rounded-2xl shadow-xl p-8"
          style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem'
          }}
        >
          <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div 
              className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"
              style={{
                margin: '0 auto 1rem auto',
                width: '4rem',
                height: '4rem',
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building className="h-8 w-8 text-white" style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h1 
              className="text-2xl font-bold text-gray-900"
              style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0' }}
            >
              東京陸送株式会社
            </h1>
            <p 
              className="text-gray-600 mt-2"
              style={{ color: '#4b5563', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}
            >
              統合管理システム
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" style={{ display: 'block' }}>
            {error && (
              <div 
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}
              >
                <AlertCircle className="h-5 w-5 text-red-500" style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0 }} />
                <span className="text-red-700 text-sm" style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
                  {error}
                </span>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="employeeId" 
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}
              >
                社員番号
              </label>
              <div className="relative" style={{ position: 'relative' }}>
                <div 
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{
                    position: 'absolute',
                    top: '0',
                    bottom: '0',
                    left: '0',
                    paddingLeft: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <User className="h-5 w-5 text-gray-400" style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontSize: '1rem'
                  }}
                  placeholder="例: B001, C001"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}
              >
                パスワード
              </label>
              <div className="relative" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  style={{
                    width: '100%',
                    paddingLeft: '0.75rem',
                    paddingRight: '2.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontSize: '1rem'
                  }}
                  placeholder="パスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  style={{
                    position: 'absolute',
                    top: '0',
                    bottom: '0',
                    right: '0',
                    paddingRight: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '100%',
                backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease-in-out'
              }}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>ログインに問題がある場合は、管理者にお問い合わせください</p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
            <p className="font-medium text-gray-700 mb-2" style={{ fontWeight: '500', color: '#374151', margin: '0 0 0.5rem 0' }}>認証情報:</p>
            <div className="space-y-1" style={{ lineHeight: '1.25' }}>
              <p style={{ margin: '0', color: '#374151', fontWeight: '500' }}>管理者:</p>
              <p style={{ margin: '0 0 0.25rem 1rem', color: '#374151' }}>メール: admin@tosho-management.com</p>
              <p style={{ margin: '0 0 0.5rem 1rem', color: '#374151' }}>パスワード: admin12345</p>
              <p style={{ margin: '0', color: '#374151', fontWeight: '500' }}>運転手:</p>
              <p style={{ margin: '0 0 0.25rem 1rem', color: '#374151' }}>社員ID: B001, C001, B002, C002</p>
              <p style={{ margin: '0 0 0 1rem', color: '#374151' }}>パスワード: 任意の文字列</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 