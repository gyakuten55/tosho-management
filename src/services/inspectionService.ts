import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { InspectionSchedule } from '@/types'

type InspectionScheduleRow = Database['public']['Tables']['inspection_schedules']['Row']
type InspectionScheduleInsert = Database['public']['Tables']['inspection_schedules']['Insert']
type InspectionScheduleUpdate = Database['public']['Tables']['inspection_schedules']['Update']

export class InspectionService {
  static async getAll(): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getById(id: number): Promise<InspectionSchedule | null> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch inspection schedule: ${error.message}`)
    }

    return this.mapToInspectionSchedule(data)
  }

  static async create(inspection: Omit<InspectionSchedule, 'id'>): Promise<InspectionSchedule> {
    const inspectionData: InspectionScheduleInsert = {
      vehicle_id: inspection.vehicleId,
      vehicle_number: inspection.vehicleNumber,
      type: inspection.type,
      date: inspection.date.toISOString().split('T')[0],
      status: inspection.status,
      driver: inspection.driver || null,
      team: inspection.team,
      is_reservation_completed: inspection.isReservationCompleted || false,
      memo: inspection.memo || null,
      has_annual_crane_inspection: inspection.hasAnnualCraneInspection || false
    }

    const { data, error } = await supabase
      .from('inspection_schedules')
      .insert(inspectionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inspection schedule: ${error.message}`)
    }

    return this.mapToInspectionSchedule(data)
  }

  static async update(id: number, updates: Partial<InspectionSchedule>): Promise<InspectionSchedule> {
    const inspectionData: InspectionScheduleUpdate = {}

    if (updates.vehicleId !== undefined) inspectionData.vehicle_id = updates.vehicleId
    if (updates.vehicleNumber !== undefined) inspectionData.vehicle_number = updates.vehicleNumber
    if (updates.type !== undefined) inspectionData.type = updates.type
    if (updates.date !== undefined) {
      inspectionData.date = updates.date.toISOString().split('T')[0]
    }
    if (updates.status !== undefined) inspectionData.status = updates.status
    if (updates.driver !== undefined) inspectionData.driver = updates.driver || null
    if (updates.team !== undefined) inspectionData.team = updates.team
    if (updates.isReservationCompleted !== undefined) {
      inspectionData.is_reservation_completed = updates.isReservationCompleted
    }
    if (updates.memo !== undefined) inspectionData.memo = updates.memo || null
    if (updates.hasAnnualCraneInspection !== undefined) {
      inspectionData.has_annual_crane_inspection = updates.hasAnnualCraneInspection
    }

    const { data, error } = await supabase
      .from('inspection_schedules')
      .update(inspectionData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update inspection schedule: ${error.message}`)
    }

    return this.mapToInspectionSchedule(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('inspection_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete inspection schedule: ${error.message}`)
    }
  }

  static async getByVehicleId(vehicleId: number): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules by vehicle: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules by date range: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getByDate(date: Date): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .order('vehicle_number')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules by date: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getByStatus(status: InspectionSchedule['status']): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('status', status)
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules by status: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getByTeam(team: string): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('team', team)
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch inspection schedules by team: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getUpcoming(beforeDate: Date): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .lte('date', beforeDate.toISOString().split('T')[0])
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch upcoming inspection schedules: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async getUrgent(): Promise<InspectionSchedule[]> {
    return this.getByStatus('urgent')
  }

  static async getIncompleteReservations(): Promise<InspectionSchedule[]> {
    const { data, error } = await supabase
      .from('inspection_schedules')
      .select('*')
      .eq('is_reservation_completed', false)
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch incomplete reservations: ${error.message}`)
    }

    return data.map(this.mapToInspectionSchedule)
  }

  static async completeReservation(id: number): Promise<InspectionSchedule> {
    return this.update(id, { isReservationCompleted: true })
  }

  static async updateStatus(id: number, status: InspectionSchedule['status']): Promise<InspectionSchedule> {
    return this.update(id, { status })
  }

  private static mapToInspectionSchedule(row: InspectionScheduleRow): InspectionSchedule {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleNumber: row.vehicle_number,
      type: row.type,
      date: new Date(row.date),
      status: row.status as InspectionSchedule['status'],
      driver: row.driver || undefined,
      team: row.team,
      isReservationCompleted: row.is_reservation_completed || false,
      memo: row.memo || undefined,
      hasAnnualCraneInspection: row.has_annual_crane_inspection || false
    }
  }
}