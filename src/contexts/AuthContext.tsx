'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  // ログイン機能（Supabaseのusers_profileテーブルを使用）
  const signIn = async (employeeId: string, password: string) => {
    try {
      // パスワードが空でない限り認証成功
      if (!password || password.trim() === '') {
        throw new Error('パスワードを入力してください')
      }

      // Supabaseのusers_profileテーブルから社員番号で検索
      const { data: userProfile, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('employee_id', employeeId)
        .single()

      if (error || !userProfile) {
        throw new Error('社員番号が見つかりません')
      }

      const userData: UserProfile = {
        uid: userProfile.id,
        employeeId: userProfile.employee_id,
        displayName: userProfile.display_name,
        role: userProfile.role as 'admin' | 'driver',
        team: userProfile.team,
        createdAt: new Date(userProfile.created_at),
        lastLogin: userProfile.last_login ? new Date(userProfile.last_login) : null,
      }

      // 最終ログイン時刻を更新
      await supabase
        .from('users_profile')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userProfile.id)

      setUser(userData)
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(userData))
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'ログインに失敗しました')
    }
  }

  // ユーザー登録機能（Supabase使用）
  const signUp = async (
    employeeId: string, 
    password: string, 
    displayName: string, 
    role: 'admin' | 'driver' = 'driver'
  ) => {
    try {
      // 社員番号の重複チェック
      const { data: existingUser } = await supabase
        .from('users_profile')
        .select('employee_id')
        .eq('employee_id', employeeId)
        .single()

      if (existingUser) {
        throw new Error('この社員番号は既に登録されています')
      }

      // 新しいユーザーを作成
      const { data: newUserProfile, error } = await supabase
        .from('users_profile')
        .insert({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          display_name: displayName,
          role: role,
          team: role === 'admin' ? '管理部' : '未分類',
        })
        .select()
        .single()

      if (error) {
        throw new Error(`ユーザー登録に失敗しました: ${error.message}`)
      }

      const newUser: UserProfile = {
        uid: newUserProfile.id,
        employeeId: newUserProfile.employee_id,
        displayName: newUserProfile.display_name,
        role: newUserProfile.role as 'admin' | 'driver',
        team: newUserProfile.team,
        createdAt: new Date(newUserProfile.created_at),
        lastLogin: newUserProfile.last_login ? new Date(newUserProfile.last_login) : null,
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