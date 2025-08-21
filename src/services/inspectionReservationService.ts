import { supabase } from '@/lib/supabase'
import { InspectionReservation } from '@/types'
import { Database } from '@/types/supabase'

type InspectionReservationRow = Database['public']['Tables']['inspection_reservations']['Row']
type InspectionReservationInsert = Database['public']['Tables']['inspection_reservations']['Insert']
type InspectionReservationUpdate = Database['public']['Tables']['inspection_reservations']['Update']

export class InspectionReservationService {
  /**
   * 全点検予約を取得
   */
  static async getAll(): Promise<InspectionReservation[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_reservations')
        .select('*')
        .order('scheduled_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch inspection reservations: ${error.message}`)
      }

      return data.map(this.mapToInspectionReservation)
    } catch (error) {
      console.error('Failed to fetch inspection reservations:', error)
      throw error
    }
  }

  /**
   * 特定車両の点検予約を取得
   */
  static async getByVehicleId(vehicleId: number): Promise<InspectionReservation[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_reservations')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch inspection reservations by vehicle: ${error.message}`)
      }

      return data.map(this.mapToInspectionReservation)
    } catch (error) {
      console.error('Failed to fetch inspection reservations by vehicle:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーの点検予約を取得
   */
  static async getByDriverId(driverId: number): Promise<InspectionReservation[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_reservations')
        .select('*')
        .eq('driver_id', driverId)
        .order('scheduled_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch inspection reservations by driver: ${error.message}`)
      }

      return data.map(this.mapToInspectionReservation)
    } catch (error) {
      console.error('Failed to fetch inspection reservations by driver:', error)
      throw error
    }
  }

  /**
   * 点検予約を作成
   */
  static async create(reservation: Omit<InspectionReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<InspectionReservation> {
    try {
      const reservationData: InspectionReservationInsert = {
        vehicle_id: reservation.vehicleId,
        vehicle_plate_number: reservation.vehiclePlateNumber,
        driver_id: reservation.driverId,
        driver_name: reservation.driverName,
        inspection_type: reservation.inspectionType,
        scheduled_date: reservation.scheduledDate.toISOString().split('T')[0],
        deadline_date: reservation.deadlineDate.toISOString().split('T')[0],
        status: reservation.status,
        memo: reservation.memo,
        reserved_by: reservation.reservedBy
      }

      const { data, error } = await supabase
        .from('inspection_reservations')
        .insert(reservationData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create inspection reservation: ${error.message}`)
      }

      return this.mapToInspectionReservation(data)
    } catch (error) {
      console.error('Failed to create inspection reservation:', error)
      throw error
    }
  }

  /**
   * 点検予約を更新
   */
  static async update(id: number, updates: Partial<InspectionReservation>): Promise<InspectionReservation> {
    try {
      const updateData: InspectionReservationUpdate = {}
      
      if (updates.vehicleId !== undefined) updateData.vehicle_id = updates.vehicleId
      if (updates.vehiclePlateNumber !== undefined) updateData.vehicle_plate_number = updates.vehiclePlateNumber
      if (updates.driverId !== undefined) updateData.driver_id = updates.driverId
      if (updates.driverName !== undefined) updateData.driver_name = updates.driverName
      if (updates.inspectionType !== undefined) updateData.inspection_type = updates.inspectionType
      if (updates.scheduledDate !== undefined) updateData.scheduled_date = updates.scheduledDate.toISOString().split('T')[0]
      if (updates.deadlineDate !== undefined) updateData.deadline_date = updates.deadlineDate.toISOString().split('T')[0]
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.memo !== undefined) updateData.memo = updates.memo
      if (updates.reservedBy !== undefined) updateData.reserved_by = updates.reservedBy

      const { data, error } = await supabase
        .from('inspection_reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update inspection reservation: ${error.message}`)
      }

      return this.mapToInspectionReservation(data)
    } catch (error) {
      console.error('Failed to update inspection reservation:', error)
      throw error
    }
  }

  /**
   * 点検予約を削除
   */
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspection_reservations')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete inspection reservation: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete inspection reservation:', error)
      throw error
    }
  }

  /**
   * 点検予約のステータスを更新
   */
  static async updateStatus(id: number, status: 'scheduled' | 'completed' | 'cancelled'): Promise<InspectionReservation> {
    return this.update(id, { status })
  }

  /**
   * 今後の点検予約を取得（期限日順）
   */
  static async getUpcoming(daysAhead: number = 30): Promise<InspectionReservation[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead)
      
      const allReservations = await this.getAll()
      return allReservations
        .filter(reservation => 
          reservation.scheduledDate >= new Date() && 
          reservation.scheduledDate <= cutoffDate &&
          reservation.status === 'scheduled'
        )
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    } catch (error) {
      console.error('Failed to fetch upcoming inspection reservations:', error)
      throw error
    }
  }

  /**
   * 期限切れの点検予約を取得
   */
  static async getOverdue(): Promise<InspectionReservation[]> {
    try {
      const today = new Date()
      const allReservations = await this.getAll()
      
      return allReservations
        .filter(reservation => 
          reservation.deadlineDate < today &&
          reservation.status === 'scheduled'
        )
        .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime())
    } catch (error) {
      console.error('Failed to fetch overdue inspection reservations:', error)
      throw error
    }
  }

  /**
   * 日付範囲内の点検予約を取得
   */
  static async getByDateRange(startDate: Date, endDate: Date): Promise<InspectionReservation[]> {
    try {
      const allReservations = await this.getAll()
      return allReservations
        .filter(reservation => 
          reservation.scheduledDate >= startDate &&
          reservation.scheduledDate <= endDate
        )
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    } catch (error) {
      console.error('Failed to fetch inspection reservations by date range:', error)
      throw error
    }
  }

  /**
   * 車両と期限日から点検予約を作成（VehicleOperationManagementから呼び出し用）
   */
  static async createFromVehicleInspection(
    vehicleId: number,
    vehiclePlateNumber: string,
    driverId: number | undefined,
    driverName: string | undefined,
    scheduledDate: Date,
    deadlineDate: Date,
    memo?: string
  ): Promise<InspectionReservation> {
    const reservation = await this.create({
      vehicleId,
      vehiclePlateNumber,
      driverId,
      driverName,
      inspectionType: '定期点検',
      scheduledDate,
      deadlineDate,
      status: 'scheduled',
      memo,
      reservedBy: 'admin'
    })

    return reservation
  }

  /**
   * データベース行をInspectionReservation型にマップ
   */
  private static mapToInspectionReservation(row: InspectionReservationRow): InspectionReservation {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehiclePlateNumber: row.vehicle_plate_number,
      driverId: row.driver_id || undefined,
      driverName: row.driver_name || undefined,
      inspectionType: row.inspection_type,
      scheduledDate: new Date(row.scheduled_date),
      deadlineDate: new Date(row.deadline_date),
      status: row.status as 'scheduled' | 'completed' | 'cancelled',
      memo: row.memo || undefined,
      reservedBy: row.reserved_by,
      createdAt: new Date(row.created_at || new Date()),
      updatedAt: new Date(row.updated_at || new Date())
    }
  }
}