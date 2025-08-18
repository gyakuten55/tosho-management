import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { VacationNotification } from '@/types'

type VacationNotificationRow = Database['public']['Tables']['vacation_notifications']['Row']
type VacationNotificationInsert = Database['public']['Tables']['vacation_notifications']['Insert']
type VacationNotificationUpdate = Database['public']['Tables']['vacation_notifications']['Update']

export class NotificationService {
  static async getAll(): Promise<VacationNotification[]> {
    const { data, error } = await supabase
      .from('vacation_notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation notifications: ${error.message}`)
    }

    return data.map(this.mapToVacationNotification)
  }

  static async getById(id: number): Promise<VacationNotification | null> {
    const { data, error } = await supabase
      .from('vacation_notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch vacation notification: ${error.message}`)
    }

    return this.mapToVacationNotification(data)
  }

  static async create(notification: Omit<VacationNotification, 'id'>): Promise<VacationNotification> {
    const notificationData: VacationNotificationInsert = {
      driver_id: notification.driverId,
      driver_name: notification.driverName,
      type: notification.type,
      message: notification.message,
      date: notification.date.toISOString().split('T')[0],
      is_read: notification.isRead,
      priority: notification.priority
    }

    const { data, error } = await supabase
      .from('vacation_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vacation notification: ${error.message}`)
    }

    return this.mapToVacationNotification(data)
  }

  static async update(id: number, updates: Partial<VacationNotification>): Promise<VacationNotification> {
    const notificationData: VacationNotificationUpdate = {}

    if (updates.driverName !== undefined) notificationData.driver_name = updates.driverName
    if (updates.type !== undefined) notificationData.type = updates.type
    if (updates.message !== undefined) notificationData.message = updates.message
    if (updates.date !== undefined) {
      notificationData.date = updates.date.toISOString().split('T')[0]
    }
    if (updates.isRead !== undefined) notificationData.is_read = updates.isRead
    if (updates.priority !== undefined) notificationData.priority = updates.priority

    const { data, error } = await supabase
      .from('vacation_notifications')
      .update(notificationData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vacation notification: ${error.message}`)
    }

    return this.mapToVacationNotification(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vacation_notifications')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vacation notification: ${error.message}`)
    }
  }

  static async getByDriverId(driverId: number): Promise<VacationNotification[]> {
    const { data, error } = await supabase
      .from('vacation_notifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation notifications by driver: ${error.message}`)
    }

    return data.map(this.mapToVacationNotification)
  }

  static async getUnread(): Promise<VacationNotification[]> {
    const { data, error } = await supabase
      .from('vacation_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch unread vacation notifications: ${error.message}`)
    }

    return data.map(this.mapToVacationNotification)
  }

  static async markAsRead(id: number): Promise<VacationNotification> {
    return this.update(id, { isRead: true })
  }

  static async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('vacation_notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<VacationNotification[]> {
    const { data, error } = await supabase
      .from('vacation_notifications')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation notifications by date range: ${error.message}`)
    }

    return data.map(this.mapToVacationNotification)
  }

  private static mapToVacationNotification(row: VacationNotificationRow): VacationNotification {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      type: row.type as VacationNotification['type'],
      message: row.message,
      date: new Date(row.date),
      isRead: row.is_read || false,
      priority: row.priority as VacationNotification['priority']
    }
  }
}