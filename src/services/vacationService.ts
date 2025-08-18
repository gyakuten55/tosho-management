import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { VacationRequest } from '@/types'

type VacationRequestRow = Database['public']['Tables']['vacation_requests']['Row']
type VacationRequestInsert = Database['public']['Tables']['vacation_requests']['Insert']
type VacationRequestUpdate = Database['public']['Tables']['vacation_requests']['Update']

export class VacationService {
  static async getAll(): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation requests: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getById(id: number): Promise<VacationRequest | null> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch vacation request: ${error.message}`)
    }

    return this.mapToVacationRequest(data)
  }

  static async create(vacationRequest: Omit<VacationRequest, 'id'>): Promise<VacationRequest> {
    const requestData: VacationRequestInsert = {
      driver_id: vacationRequest.driverId,
      driver_name: vacationRequest.driverName,
      team: vacationRequest.team,
      employee_id: vacationRequest.employeeId,
      date: vacationRequest.date.toISOString().split('T')[0],
      work_status: vacationRequest.workStatus,
      is_off: vacationRequest.isOff,
      type: vacationRequest.type,
      reason: vacationRequest.reason || null,
      status: vacationRequest.status,
      request_date: vacationRequest.requestDate.toISOString(),
      is_external_driver: vacationRequest.isExternalDriver
    }

    const { data, error } = await supabase
      .from('vacation_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vacation request: ${error.message}`)
    }

    return this.mapToVacationRequest(data)
  }

  static async update(id: number, updates: Partial<VacationRequest>): Promise<VacationRequest> {
    const requestData: VacationRequestUpdate = {}

    if (updates.driverId !== undefined) requestData.driver_id = updates.driverId
    if (updates.driverName !== undefined) requestData.driver_name = updates.driverName
    if (updates.team !== undefined) requestData.team = updates.team
    if (updates.employeeId !== undefined) requestData.employee_id = updates.employeeId
    if (updates.date !== undefined) {
      requestData.date = updates.date.toISOString().split('T')[0]
    }
    if (updates.workStatus !== undefined) requestData.work_status = updates.workStatus
    if (updates.isOff !== undefined) requestData.is_off = updates.isOff
    if (updates.type !== undefined) requestData.type = updates.type
    if (updates.reason !== undefined) requestData.reason = updates.reason || null
    if (updates.status !== undefined) requestData.status = updates.status
    if (updates.requestDate !== undefined) {
      requestData.request_date = updates.requestDate.toISOString()
    }
    if (updates.isExternalDriver !== undefined) {
      requestData.is_external_driver = updates.isExternalDriver
    }

    const { data, error } = await supabase
      .from('vacation_requests')
      .update(requestData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vacation request: ${error.message}`)
    }

    return this.mapToVacationRequest(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vacation_requests')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vacation request: ${error.message}`)
    }
  }

  static async getByDriverId(driverId: number): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('driver_id', driverId)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation requests by driver: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch vacation requests by date range: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getByDate(date: Date): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .order('driver_name')

    if (error) {
      throw new Error(`Failed to fetch vacation requests by date: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getByTeam(team: string): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('team', team)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch vacation requests by team: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getByMonth(year: number, month: number): Promise<VacationRequest[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    return this.getByDateRange(startDate, endDate)
  }

  static async getOffRequestsByDate(date: Date): Promise<VacationRequest[]> {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .eq('is_off', true)
      .order('driver_name')

    if (error) {
      throw new Error(`Failed to fetch off requests by date: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  static async getByDriverAndMonth(driverId: number, year: number, month: number): Promise<VacationRequest[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('driver_id', driverId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch vacation requests by driver and month: ${error.message}`)
    }

    return data.map(this.mapToVacationRequest)
  }

  private static mapToVacationRequest(row: VacationRequestRow): VacationRequest {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      team: row.team,
      employeeId: row.employee_id,
      date: new Date(row.date),
      workStatus: row.work_status as VacationRequest['workStatus'],
      isOff: row.is_off,
      type: row.type as VacationRequest['type'],
      reason: row.reason || '',
      status: row.status as VacationRequest['status'],
      requestDate: new Date(row.request_date),
      isExternalDriver: row.is_external_driver
    }
  }
}