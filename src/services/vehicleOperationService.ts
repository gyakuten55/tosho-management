import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { 
  VehicleAssignmentChange, 
  DriverVehicleNotification,
  VehicleInoperativePeriod,
  VehicleInoperativeNotification,
  DailyVehicleSwap,
  DispatchSchedule
} from '@/types'

type VehicleAssignmentChangeRow = Database['public']['Tables']['vehicle_assignment_changes']['Row']
type VehicleAssignmentChangeInsert = Database['public']['Tables']['vehicle_assignment_changes']['Insert']
type VehicleAssignmentChangeUpdate = Database['public']['Tables']['vehicle_assignment_changes']['Update']

export class VehicleAssignmentChangeService {
  static async getAll(): Promise<VehicleAssignmentChange[]> {
    const { data, error } = await supabase
      .from('vehicle_assignment_changes')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vehicle assignment changes: ${error.message}`)
    }

    return data.map(this.mapToVehicleAssignmentChange)
  }

  static async create(change: Omit<VehicleAssignmentChange, 'id'>): Promise<VehicleAssignmentChange> {
    const changeData: VehicleAssignmentChangeInsert = {
      vehicle_id: change.vehicleId,
      plate_number: change.plateNumber,
      date: change.date.toISOString().split('T')[0],
      original_driver_id: change.originalDriverId,
      original_driver_name: change.originalDriverName,
      new_driver_id: change.newDriverId,
      new_driver_name: change.newDriverName,
      reason: change.reason,
      created_by: change.createdBy,
      is_temporary: change.isTemporary || false,
      end_date: change.endDate ? change.endDate.toISOString().split('T')[0] : null
    }

    const { data, error } = await supabase
      .from('vehicle_assignment_changes')
      .insert(changeData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle assignment change: ${error.message}`)
    }

    return this.mapToVehicleAssignmentChange(data)
  }

  static async update(id: number, updates: Partial<VehicleAssignmentChange>): Promise<VehicleAssignmentChange> {
    const updateData: VehicleAssignmentChangeUpdate = {}

    if (updates.plateNumber !== undefined) updateData.plate_number = updates.plateNumber
    if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0]
    if (updates.originalDriverName !== undefined) updateData.original_driver_name = updates.originalDriverName
    if (updates.newDriverName !== undefined) updateData.new_driver_name = updates.newDriverName
    if (updates.reason !== undefined) updateData.reason = updates.reason
    if (updates.isTemporary !== undefined) updateData.is_temporary = updates.isTemporary
    if (updates.endDate !== undefined) {
      updateData.end_date = updates.endDate ? updates.endDate.toISOString().split('T')[0] : null
    }

    const { data, error } = await supabase
      .from('vehicle_assignment_changes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle assignment change: ${error.message}`)
    }

    return this.mapToVehicleAssignmentChange(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vehicle_assignment_changes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle assignment change: ${error.message}`)
    }
  }

  private static mapToVehicleAssignmentChange(row: VehicleAssignmentChangeRow): VehicleAssignmentChange {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      plateNumber: row.plate_number,
      date: new Date(row.date),
      originalDriverId: row.original_driver_id,
      originalDriverName: row.original_driver_name,
      newDriverId: row.new_driver_id,
      newDriverName: row.new_driver_name,
      reason: row.reason,
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      isTemporary: row.is_temporary || false,
      endDate: row.end_date ? new Date(row.end_date) : undefined
    }
  }
}

type DriverVehicleNotificationRow = Database['public']['Tables']['driver_vehicle_notifications']['Row']
type DriverVehicleNotificationInsert = Database['public']['Tables']['driver_vehicle_notifications']['Insert']

export class DriverVehicleNotificationService {
  static async getAll(): Promise<DriverVehicleNotification[]> {
    const { data, error } = await supabase
      .from('driver_vehicle_notifications')
      .select('*')
      .order('sent_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch driver vehicle notifications: ${error.message}`)
    }

    return data.map(this.mapToDriverVehicleNotification)
  }

  static async getByDriverId(driverId: number): Promise<DriverVehicleNotification[]> {
    const { data, error } = await supabase
      .from('driver_vehicle_notifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('sent_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch driver vehicle notifications: ${error.message}`)
    }

    return data.map(this.mapToDriverVehicleNotification)
  }

  static async create(notification: Omit<DriverVehicleNotification, 'id'>): Promise<DriverVehicleNotification> {
    const notificationData: DriverVehicleNotificationInsert = {
      driver_id: notification.driverId,
      driver_name: notification.driverName,
      type: notification.type,
      vehicle_id: notification.vehicleId,
      plate_number: notification.plateNumber,
      assignment_date: notification.assignmentDate.toISOString().split('T')[0],
      end_date: notification.endDate ? notification.endDate.toISOString().split('T')[0] : null,
      message: notification.message,
      priority: notification.priority || 'medium'
    }

    const { data, error } = await supabase
      .from('driver_vehicle_notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create driver vehicle notification: ${error.message}`)
    }

    return this.mapToDriverVehicleNotification(data)
  }

  static async markAsRead(id: number): Promise<void> {
    const { error } = await supabase
      .from('driver_vehicle_notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  private static mapToDriverVehicleNotification(row: DriverVehicleNotificationRow): DriverVehicleNotification {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      type: row.type as DriverVehicleNotification['type'],
      vehicleId: row.vehicle_id,
      plateNumber: row.plate_number,
      assignmentDate: new Date(row.assignment_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      message: row.message,
      isRead: row.is_read || false,
      sentAt: new Date(row.sent_at),
      priority: (row.priority as DriverVehicleNotification['priority']) || 'medium'
    }
  }
}

type VehicleInoperativePeriodRow = Database['public']['Tables']['vehicle_inoperative_periods']['Row']
type VehicleInoperativePeriodInsert = Database['public']['Tables']['vehicle_inoperative_periods']['Insert']
type VehicleInoperativePeriodUpdate = Database['public']['Tables']['vehicle_inoperative_periods']['Update']

export class VehicleInoperativePeriodService {
  static async getAll(): Promise<VehicleInoperativePeriod[]> {
    const { data, error } = await supabase
      .from('vehicle_inoperative_periods')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vehicle inoperative periods: ${error.message}`)
    }

    return data.map(this.mapToVehicleInoperativePeriod)
  }

  static async create(period: Omit<VehicleInoperativePeriod, 'id'>): Promise<VehicleInoperativePeriod> {
    const periodData: VehicleInoperativePeriodInsert = {
      vehicle_id: period.vehicleId,
      plate_number: period.plateNumber,
      start_date: period.startDate.toISOString().split('T')[0],
      end_date: period.endDate.toISOString().split('T')[0],
      reason: period.reason,
      type: period.type,
      original_driver_id: period.originalDriverId || null,
      original_driver_name: period.originalDriverName || null,
      temp_assignment_driver_id: period.tempAssignmentDriverId || null,
      temp_assignment_vehicle_id: period.tempAssignmentVehicleId || null,
      created_by: period.createdBy,
      notes: period.notes || null
    }

    const { data, error } = await supabase
      .from('vehicle_inoperative_periods')
      .insert(periodData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle inoperative period: ${error.message}`)
    }

    return this.mapToVehicleInoperativePeriod(data)
  }

  static async update(id: number, updates: Partial<VehicleInoperativePeriod>): Promise<VehicleInoperativePeriod> {
    const updateData: VehicleInoperativePeriodUpdate = {}

    if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0]
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0]
    if (updates.reason !== undefined) updateData.reason = updates.reason
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from('vehicle_inoperative_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle inoperative period: ${error.message}`)
    }

    return this.mapToVehicleInoperativePeriod(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vehicle_inoperative_periods')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle inoperative period: ${error.message}`)
    }
  }

  private static mapToVehicleInoperativePeriod(row: VehicleInoperativePeriodRow): VehicleInoperativePeriod {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      plateNumber: row.plate_number,
      startDate: new Date(row.start_date + 'T00:00:00'),
      endDate: new Date(row.end_date + 'T00:00:00'),
      reason: row.reason,
      type: row.type as VehicleInoperativePeriod['type'],
      originalDriverId: row.original_driver_id || undefined,
      originalDriverName: row.original_driver_name || undefined,
      tempAssignmentDriverId: row.temp_assignment_driver_id || undefined,
      tempAssignmentVehicleId: row.temp_assignment_vehicle_id || undefined,
      status: (row.status as VehicleInoperativePeriod['status']) || 'active',
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      notes: row.notes || undefined
    }
  }
}

type DailyVehicleSwapRow = Database['public']['Tables']['daily_vehicle_swaps']['Row']
type DailyVehicleSwapInsert = Database['public']['Tables']['daily_vehicle_swaps']['Insert']

export class DailyVehicleSwapService {
  static async getAll(): Promise<DailyVehicleSwap[]> {
    const { data, error } = await supabase
      .from('daily_vehicle_swaps')
      .select('*')
      .order('swap_time', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch daily vehicle swaps: ${error.message}`)
    }

    return data.map(this.mapToDailyVehicleSwap)
  }

  static async getByDate(date: Date): Promise<DailyVehicleSwap[]> {
    const dateString = date.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_vehicle_swaps')
      .select('*')
      .gte('swap_time', `${dateString} 00:00:00`)
      .lt('swap_time', `${dateString} 23:59:59`)
      .order('swap_time', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch daily vehicle swaps by date: ${error.message}`)
    }

    return data.map(this.mapToDailyVehicleSwap)
  }

  static async create(swap: Omit<DailyVehicleSwap, 'id'>): Promise<DailyVehicleSwap> {
    const swapData: DailyVehicleSwapInsert = {
      driver_id: swap.driverId,
      driver_name: swap.driverName,
      original_vehicle_id: swap.originalVehicleId,
      original_plate_number: swap.originalPlateNumber,
      new_vehicle_id: swap.newVehicleId,
      new_plate_number: swap.newPlateNumber,
      reason: swap.reason,
      status: swap.status || 'active'
    }

    const { data, error } = await supabase
      .from('daily_vehicle_swaps')
      .insert(swapData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create daily vehicle swap: ${error.message}`)
    }

    return this.mapToDailyVehicleSwap(data)
  }

  private static mapToDailyVehicleSwap(row: DailyVehicleSwapRow): DailyVehicleSwap {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      originalVehicleId: row.original_vehicle_id,
      originalPlateNumber: row.original_plate_number,
      newVehicleId: row.new_vehicle_id,
      newPlateNumber: row.new_plate_number,
      swapTime: new Date(row.swap_time),
      reason: row.reason,
      status: (row.status as DailyVehicleSwap['status']) || 'active'
    }
  }
}