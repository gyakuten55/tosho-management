import { useEffect } from 'react'

/**
 * エスケープキーが押された時にコールバック関数を実行するカスタムフック
 * @param callback エスケープキーが押された時に実行する関数
 * @param isActive フックを有効にするかどうか（デフォルト: true）
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        callback()
      }
    }

    // イベントリスナーを追加
    document.addEventListener('keydown', handleEscapeKey)

    // クリーンアップ関数でイベントリスナーを削除
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [callback, isActive])
}