import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { VacationRequest } from '@/types'
import { formatDateForDB, parseDBDate, getCurrentDate } from '@/utils/dateUtils'

type VacationRequestRow = Database['public']['Tables']['vacation_requests']['Row']
type VacationRequestInsert = Database['public']['Tables']['vacation_requests']['Insert']
type VacationRequestUpdate = Database['public']['Tables']['vacation_requests']['Update']

export class VacationService {
  static async getAll(): Promise<VacationRequest[]> {
    // 1000件制限の問題を修正：2回のクエリで全データを取得
    console.log('VacationService.getAll - Retrieving all vacation data using chunked approach')

    try {
      // 動的に日付範囲を計算（過去12ヶ月から未来12ヶ月）
      const today = getCurrentDate()
      const startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1)
      const endDate = new Date(today.getFullYear(), today.getMonth() + 12 + 1, 0)
      const startDateString = formatDateForDB(startDate)
      const endDateString = formatDateForDB(endDate)
      
      console.log(`VacationService.getAll - Date range: ${startDateString} to ${endDateString}`)

      // まずデータ総数を取得
      const { count, error: countError } = await supabase
        .from('vacation_requests')
        .select('*', { count: 'exact', head: true })
        .gte('date', startDateString)
        .lte('date', endDateString)

      if (countError) {
        throw new Error(`Failed to count vacation requests: ${countError.message}`)
      }

      console.log(`VacationService.getAll - Total records in range: ${count}`)

      // データが1000件以下なら通常通り取得
      if (!count || count <= 1000) {
        const { data, error } = await supabase
          .from('vacation_requests')
          .select('*')
          .gte('date', startDateString)
          .lte('date', endDateString)
          .order('date', { ascending: false })

        if (error) {
          throw new Error(`Failed to fetch vacation requests: ${error.message}`)
        }

        console.log(`VacationService.getAll - Retrieved ${data.length} records in single query`)
        return data.map(this.mapToVacationRequest)
      }

      // データが1000件超の場合は2回に分けて取得
      console.log('VacationService.getAll - Using chunked approach for >1000 records')
      
      // まず最新の1000件を取得して境界日付を確認
      const { data: recentData, error: recentError } = await supabase
        .from('vacation_requests')
        .select('*')
        .gte('date', startDateString)
        .lte('date', endDateString)
        .order('date', { ascending: false })
        .limit(1000)

      if (recentError) {
        throw new Error(`Failed to fetch recent vacation requests: ${recentError.message}`)
      }

      // 境界日付を特定（最古のレコードの日付）
      const boundaryDate = recentData[recentData.length - 1]?.date
      console.log(`VacationService.getAll - Boundary date for chunked query: ${boundaryDate}`)

      // 境界日付より前の古いデータを取得（重複を避けるため）
      const { data: olderData, error: olderError } = await supabase
        .from('vacation_requests')
        .select('*')
        .gte('date', startDateString)
        .lt('date', boundaryDate) // 境界日付より前のみ（重複回避）
        .order('date', { ascending: true })

      if (olderError) {
        throw new Error(`Failed to fetch older vacation requests: ${olderError.message}`)
      }

      // 両方のデータを結合して日付順でソート
      const allData = [...recentData, ...olderData]
      allData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log(`VacationService.getAll - Retrieved ${allData.length} records via chunked approach`)
      console.log(`VacationService.getAll - Date range: ${allData[allData.length - 1]?.date} to ${allData[0]?.date}`)

      return allData.map(this.mapToVacationRequest)
    } catch (error) {
      console.error('VacationService.getAll - Unexpected error:', error)
      throw error instanceof Error ? error : new Error('Unknown error occurred')
    }
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
      date: formatDateForDB(vacationRequest.date),
      work_status: vacationRequest.workStatus,
      is_off: vacationRequest.isOff,
      type: vacationRequest.type,
      reason: vacationRequest.reason || null,
      status: vacationRequest.status,
      request_date: vacationRequest.requestDate.toISOString(),
      is_external_driver: vacationRequest.isExternalDriver,
      has_special_note: vacationRequest.hasSpecialNote || false,
      special_note: vacationRequest.specialNote || null,
      registered_by: vacationRequest.registeredBy
    }

    console.log('VacationService.create - Saving to database:', {
      original_date: vacationRequest.date,
      formatted_date: formatDateForDB(vacationRequest.date),
      requestData
    })

    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .insert(requestData)
        .select()
        .single()

      if (error) {
        console.error('VacationService.create - Database error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          requestData
        })
        throw new Error(`Failed to create vacation request: ${error.message} (Code: ${error.code})`)
      }

      if (!data) {
        console.error('VacationService.create - No data returned from insert')
        throw new Error('No data returned from database insert')
      }

      console.log('VacationService.create - Saved successfully:', data)
      const mapped = this.mapToVacationRequest(data)
      console.log('VacationService.create - Mapped result:', {
        id: mapped.id,
        driverName: mapped.driverName,
        date: mapped.date.toISOString(),
        formattedDate: formatDateForDB(mapped.date),
        workStatus: mapped.workStatus
      })

      return mapped
    } catch (dbError) {
      console.error('VacationService.create - Unexpected error:', dbError)
      throw dbError
    }
  }

  static async update(id: number, updates: Partial<VacationRequest>): Promise<VacationRequest> {
    const requestData: VacationRequestUpdate = {}

    if (updates.driverId !== undefined) requestData.driver_id = updates.driverId
    if (updates.driverName !== undefined) requestData.driver_name = updates.driverName
    if (updates.team !== undefined) requestData.team = updates.team
    if (updates.employeeId !== undefined) requestData.employee_id = updates.employeeId
    if (updates.date !== undefined) {
      requestData.date = formatDateForDB(updates.date)
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
    if (updates.hasSpecialNote !== undefined) {
      requestData.has_special_note = updates.hasSpecialNote
    }
    if (updates.specialNote !== undefined) {
      requestData.special_note = updates.specialNote || null
    }
    if (updates.registeredBy !== undefined) {
      requestData.registered_by = updates.registeredBy
    }

    console.log('VacationService.update - Updating record:', {
      id,
      updates,
      requestData
    })

    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update(requestData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('VacationService.update - Database error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          id,
          requestData
        })
        throw new Error(`Failed to update vacation request: ${error.message} (Code: ${error.code})`)
      }

      if (!data || data.length === 0) {
        console.error('VacationService.update - No record found or updated:', { id, requestData })
        throw new Error(`No vacation request found with id: ${id}`)
      }

      console.log('VacationService.update - Updated successfully:', data[0])
      return this.mapToVacationRequest(data[0])
    } catch (dbError) {
      console.error('VacationService.update - Unexpected error:', dbError)
      throw dbError
    }
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
      .gte('date', formatDateForDB(startDate))
      .lte('date', formatDateForDB(endDate))
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
      .eq('date', formatDateForDB(date))
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
      .eq('date', formatDateForDB(date))
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
      .gte('date', formatDateForDB(startDate))
      .lte('date', formatDateForDB(endDate))
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
      date: parseDBDate(row.date),
      workStatus: row.work_status as VacationRequest['workStatus'],
      isOff: row.is_off,
      type: row.type as VacationRequest['type'],
      reason: row.reason || '',
      status: row.status as VacationRequest['status'],
      requestDate: new Date(row.request_date),
      isExternalDriver: row.is_external_driver,
      hasSpecialNote: row.has_special_note || false,
      specialNote: row.special_note || '',
      registeredBy: (row.registered_by === 'driver' || row.registered_by === 'admin')
        ? row.registered_by as VacationRequest['registeredBy']
        : 'admin'
    }
  }
}