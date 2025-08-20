'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DriverService } from '@/services/driverService'

// ユーザー情報の型定義
interface UserProfile {
  uid: string
  employeeId: string
  displayName: string
  role: 'admin' | 'driver'
  team: string
  createdAt: Date
  lastLogin: Date | null
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

  // ログイン機能（管理者は固定認証、ドライバーはdriiversテーブルでパスワード検証）
  const signIn = async (employeeId: string, password: string) => {
    try {
      // パスワードが空の場合はエラー
      if (!password || password.trim() === '') {
        throw new Error('パスワードを入力してください')
      }

      // 管理者の固定アカウントチェック
      if (employeeId.toLowerCase() === 'admin@tosho-management.com') {
        if (password !== 'admin12345') {
          throw new Error('社員番号またはパスワードが正しくありません')
        }

        // 管理者の固定プロファイル
        const adminUserData: UserProfile = {
          uid: 'admin-fixed-id',
          employeeId: 'admin@tosho-management.com',
          displayName: '管理者',
          role: 'admin',
          team: '管理部',
          createdAt: new Date(),
          lastLogin: new Date(),
        }

        setUser(adminUserData)
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(adminUserData))
        }
        return
      }

      // ドライバーの認証（パスワード必須）
      const driver = await DriverService.authenticateDriver(employeeId, password)
      if (driver) {
        const userData: UserProfile = {
          uid: `driver-${driver.id}`,
          employeeId: driver.employeeId,
          displayName: driver.name,
          role: 'driver',
          team: driver.team,
          createdAt: new Date(),
          lastLogin: new Date(),
        }

        setUser(userData)
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(userData))
        }
        return
      }

      // ここまで到達した場合は認証失敗
      throw new Error('社員番号またはパスワードが正しくありません')
      
    } catch (error: any) {
      throw new Error(error.message || 'ログインに失敗しました')
    }
  }

  // ユーザー登録機能は無効化（ドライバー管理画面から直接作成）
  const signUp = async (
    employeeId: string, 
    password: string, 
    displayName: string, 
    role: 'admin' | 'driver' = 'driver'
  ) => {
    throw new Error('新規ユーザー登録は管理者により行われます')
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