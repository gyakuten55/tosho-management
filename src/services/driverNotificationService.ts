import { supabase } from '@/lib/supabase'
import { DriverNotification } from '@/types'
import { Database } from '@/types/supabase'
import { format } from 'date-fns'

type DriverNotificationRow = Database['public']['Tables']['driver_notifications']['Row']
type DriverNotificationInsert = Database['public']['Tables']['driver_notifications']['Insert']
type DriverNotificationUpdate = Database['public']['Tables']['driver_notifications']['Update']

export class DriverNotificationService {
  /**
   * 全通知を取得
   */
  static async getAll(): Promise<DriverNotification[]> {
    try {
      const { data, error } = await supabase
        .from('driver_notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch driver notifications: ${error.message}`)
      }

      return data.map(this.mapToDriverNotification)
    } catch (error) {
      console.error('Failed to fetch driver notifications:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーの通知を取得
   */
  static async getByDriverId(driverId: number): Promise<DriverNotification[]> {
    try {
      const { data, error } = await supabase
        .from('driver_notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch driver notifications: ${error.message}`)
      }

      return data.map(this.mapToDriverNotification)
    } catch (error) {
      console.error('Failed to fetch driver notifications:', error)
      throw error
    }
  }

  /**
   * 通知を作成
   */
  static async create(notification: Omit<DriverNotification, 'id' | 'createdAt'>): Promise<DriverNotification> {
    try {
      const notificationData = {
        driver_id: notification.driverId,
        driver_name: '', // ドライバー名は別途取得する必要がある場合は更新
        employee_id: '', // 社員番号は別途取得する必要がある場合は更新
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        is_read: notification.isRead,
        action_required: notification.actionRequired,
        scheduled_for: notification.scheduledFor?.toISOString()
      }

      const { data, error } = await supabase
        .from('driver_notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create driver notification: ${error.message}`)
      }

      return this.mapToDriverNotification(data)
    } catch (error) {
      console.error('Failed to create driver notification:', error)
      throw error
    }
  }

  /**
   * 通知を既読にする
   */
  static async markAsRead(notificationId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーの全通知を既読にする
   */
  static async markAllAsReadByDriverId(driverId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ is_read: true })
        .eq('driver_id', driverId)
        .eq('is_read', false)

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * 通知を削除する
   */
  static async delete(notificationId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーのすべての通知を削除する
   */
  static async deleteAllByDriverId(driverId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .delete()
        .eq('driver_id', driverId)

      if (error) {
        throw new Error(`Failed to delete all notifications: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      throw error
    }
  }

  /**
   * 未読通知の数を取得
   */
  static async getUnreadCount(driverId: number): Promise<number> {
    try {
      const notifications = await this.getByDriverId(driverId)
      return notifications.filter(n => !n.isRead).length
    } catch (error) {
      console.error('Failed to get unread count:', error)
      throw error
    }
  }

  /**
   * 車両点検通知を自動作成
   */
  static async createVehicleInspectionNotification(
    driverId: number,
    vehiclePlateNumber: string,
    inspectionDate: Date,
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    // 既存の同じ通知があるかチェック
    const existingNotifications = await this.getByDriverId(driverId)
    const duplicateNotification = existingNotifications.find(n => 
      n.type === 'vehicle_inspection' && 
      n.message.includes(vehiclePlateNumber) &&
      n.scheduledFor && 
      Math.abs(n.scheduledFor.getTime() - inspectionDate.getTime()) < 24 * 60 * 60 * 1000 // 1日以内
    )

    if (duplicateNotification) {
      return duplicateNotification
    }

    const notificationData: DriverNotificationInsert = {
      driver_id: driverId,
      driver_name: driverName || '',
      employee_id: employeeId || '',
      type: 'vehicle_inspection',
      title: '車両点検のお知らせ',
      message: `担当車両 ${vehiclePlateNumber} の点検期限が近づいています。期限日: ${format(inspectionDate, 'yyyy/M/d')}`,
      priority: 'medium',
      is_read: false,
      action_required: true,
      scheduled_for: inspectionDate.toISOString()
    }

    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle inspection notification: ${error.message}`)
    }

    return this.mapToDriverNotification(data)
  }

  /**
   * 点検予約完了通知を作成
   */
  static async createInspectionReservedNotification(
    driverId: number,
    vehiclePlateNumber: string,
    reservedDate: Date,
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    const notificationData: DriverNotificationInsert = {
      driver_id: driverId,
      driver_name: driverName || '',
      employee_id: employeeId || '',
      type: 'inspection_reserved',
      title: '点検予約完了のお知らせ',
      message: `担当車両 ${vehiclePlateNumber} の点検が ${format(reservedDate, 'yyyy/M/d')} に予約されました。`,
      priority: 'medium',
      is_read: false,
      action_required: false,
      scheduled_for: reservedDate.toISOString()
    }

    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inspection reserved notification: ${error.message}`)
    }

    return this.mapToDriverNotification(data)
  }

  /**
   * 点検予約完了通知を作成（備考・メモ付き）
   */
  static async createInspectionReservedNotificationWithMemo(
    driverId: number,
    vehiclePlateNumber: string,
    reservedDate: Date,
    memo?: string,
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    const memoText = memo?.trim() ? `\n備考: ${memo}` : ''
    const notificationData: DriverNotificationInsert = {
      driver_id: driverId,
      driver_name: driverName || '',
      employee_id: employeeId || '',
      type: 'inspection_reserved',
      title: '点検予約完了のお知らせ',
      message: `担当車両 ${vehiclePlateNumber} の点検が ${format(reservedDate, 'yyyy/M/d')} に予約されました。${memoText}`,
      priority: 'medium',
      is_read: false,
      action_required: false,
      scheduled_for: reservedDate.toISOString()
    }

    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inspection reserved notification: ${error.message}`)
    }

    return this.mapToDriverNotification(data)
  }

  /**
   * 車両割り当て通知を作成
   */
  static async createVehicleAssignmentNotification(
    driverId: number,
    vehiclePlateNumber: string,
    assignmentType: 'assigned' | 'unassigned',
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    const message = assignmentType === 'assigned'
      ? `車両 ${vehiclePlateNumber} が担当車両として割り当てられました。`
      : `車両 ${vehiclePlateNumber} の担当が解除されました。`

    const notificationData: DriverNotificationInsert = {
      driver_id: driverId,
      driver_name: driverName || '',
      employee_id: employeeId || '',
      type: 'vehicle_assignment',
      title: '車両割り当て変更のお知らせ',
      message,
      priority: 'medium',
      is_read: false,
      action_required: false,
      scheduled_for: null
    }

    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle assignment notification: ${error.message}`)
    }

    return this.mapToDriverNotification(data)
  }

  /**
   * 車両稼働不可期間通知を作成
   */
  static async createVehicleInoperativeNotification(
    driverId: number,
    vehiclePlateNumber: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    inoperativeType: 'repair' | 'maintenance' | 'breakdown' | 'other',
    tempVehiclePlateNumber?: string,
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    const typeText = 
      inoperativeType === 'repair' ? '修理' :
      inoperativeType === 'maintenance' ? '整備' :
      inoperativeType === 'breakdown' ? '故障' : 'その他'

    const tempVehicleText = tempVehiclePlateNumber 
      ? `\n一時的に車両 ${tempVehiclePlateNumber} をご利用ください。` 
      : ''

    const message = `担当車両 ${vehiclePlateNumber} が ${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日から${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日まで${typeText}のため稼働停止となります。\n理由: ${reason}${tempVehicleText}`

    const notificationData: DriverNotificationInsert = {
      driver_id: driverId,
      driver_name: driverName || '',
      employee_id: employeeId || '',
      type: 'vehicle_assignment',
      title: '車両稼働停止のお知らせ',
      message,
      priority: 'high',
      is_read: false,
      action_required: true,
      scheduled_for: startDate.toISOString()
    }

    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle inoperative notification: ${error.message}`)
    }

    return this.mapToDriverNotification(data)
  }

  /**
   * 点検予約キャンセル通知を作成
   */
  static async createVehicleInspectionCancelledNotification(
    driverId: number,
    vehiclePlateNumber: string,
    cancelledDate: Date,
    driverName?: string,
    employeeId?: string
  ): Promise<DriverNotification> {
    try {
      const notificationData: DriverNotificationInsert = {
        driver_id: driverId,
        driver_name: driverName || '',
        employee_id: employeeId || '',
        type: 'vehicle_inspection',
        title: '点検予約キャンセルのお知らせ',
        message: `担当車両 ${vehiclePlateNumber} の点検予約（${format(cancelledDate, 'yyyy/M/d')}）がキャンセルされました。`,
        priority: 'high',
        is_read: false,
        action_required: true,
        scheduled_for: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('driver_notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create inspection cancelled notification: ${error.message}`)
      }

      return this.mapToDriverNotification(data)
    } catch (error) {
      console.error('Failed to create inspection cancelled notification:', error)
      throw error
    }
  }

  /**
   * データベース行をDriverNotification型にマップ
   */
  private static mapToDriverNotification(row: DriverNotificationRow): DriverNotification {
    return {
      id: row.id,
      driverId: row.driver_id,
      type: row.type as DriverNotification['type'],
      title: row.title,
      message: row.message,
      priority: row.priority as DriverNotification['priority'],
      isRead: row.is_read || false,
      createdAt: new Date(row.created_at || new Date()),
      scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
      actionRequired: row.action_required || false
    }
  }
}