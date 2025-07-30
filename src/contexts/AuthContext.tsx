'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

// ユーザー情報の型定義
interface UserProfile {
  uid: string
  employeeId: string
  displayName: string
  role: 'admin' | 'driver'
  createdAt: Date
  lastLogin: Date
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: UserProfile | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (employeeId: string, password: string) => Promise<void>
  signUp: (employeeId: string, password: string, displayName: string, role?: 'admin' | 'driver') => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isDriver: boolean
}

// デモ用のユーザーデータ
const DEMO_USERS = [
  {
    uid: 'admin-1',
    employeeId: 'ADMIN001',
    displayName: '管理者',
    role: 'admin' as const,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'driver-1',
    employeeId: 'B001',
    displayName: '運転手1',
    role: 'driver' as const,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'driver-2',
    employeeId: 'C001',
    displayName: '運転手2',
    role: 'driver' as const,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'driver-3',
    employeeId: 'B002',
    displayName: '運転手3',
    role: 'driver' as const,
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'driver-4',
    employeeId: 'C002',
    displayName: '運転手4',
    role: 'driver' as const,
    createdAt: new Date(),
    lastLogin: new Date(),
  }
]

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 認証コンテキストプロバイダー
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージから認証状態を復元（クライアントサイドのみ）
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser({
            ...userData,
            createdAt: new Date(userData.createdAt),
            lastLogin: new Date(userData.lastLogin)
          })
        } catch (error) {
          console.error('ユーザーデータの復元に失敗しました:', error)
          localStorage.removeItem('currentUser')
        }
      }
    }
    setLoading(false)
  }, [])

  // ログイン機能
  const signIn = async (employeeId: string, password: string) => {
    try {
      // 社員番号の存在チェック（パスワードは任意の文字列で認証）
      const user = DEMO_USERS.find(u => u.employeeId === employeeId)
      
      if (!user) {
        throw new Error('社員番号が見つかりません')
      }

      // パスワードが空でない限り認証成功
      if (!password || password.trim() === '') {
        throw new Error('パスワードを入力してください')
      }

      const userProfile: UserProfile = {
        uid: user.uid,
        employeeId: user.employeeId,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: new Date(),
      }

      setUser(userProfile)
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(userProfile))
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'ログインに失敗しました')
    }
  }

  // ユーザー登録機能（デモ用）
  const signUp = async (
    employeeId: string, 
    password: string, 
    displayName: string, 
    role: 'admin' | 'driver' = 'driver'
  ) => {
    try {
      // 社員番号の重複チェック
      const existingUser = DEMO_USERS.find(u => u.employeeId === employeeId)
      if (existingUser) {
        throw new Error('この社員番号は既に登録されています')
      }

      // 新しいユーザーを作成
      const newUser: UserProfile = {
        uid: `user-${Date.now()}`,
        employeeId,
        displayName,
        role,
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      setUser(newUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(newUser))
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'ユーザー登録に失敗しました')
    }
  }

  // ログアウト機能
  const signOut = async () => {
    try {
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser')
      }
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
      throw new Error('ログアウトに失敗しました')
    }
  }

  // 権限チェック
  const isAdmin = user?.role === 'admin'
  const isDriver = user?.role === 'driver'

  const value: AuthContextType = {
    user,
    userProfile: user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isDriver,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキストを使用するためのフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 認証が必要なコンポーネントを保護するためのHOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin: boolean = false
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, isAdmin } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ログインが必要です
            </h2>
            <p className="text-gray-600">
              このページにアクセスするにはログインしてください。
            </p>
          </div>
        </div>
      )
    }

    if (requireAdmin && !isAdmin) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600">
              管理者権限が必要です。
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
} 