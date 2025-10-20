import { supabase } from '@/lib/supabase'
import { DepartureTime } from '@/types'
import { Database } from '@/types/supabase'

type DepartureTimeRow = Database['public']['Tables']['departure_times']['Row']
type DepartureTimeInsert = Database['public']['Tables']['departure_times']['Insert']
type DepartureTimeUpdate = Database['public']['Tables']['departure_times']['Update']

export class DepartureTimeService {
  /**
   * 全出庫時間を取得
   */
  static async getAll(): Promise<DepartureTime[]> {
    try {
      const { data, error } = await supabase
        .from('departure_times')
        .select('*')
        .order('departure_date', { ascending: false })
        .order('departure_time', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch departure times: ${error.message}`)
      }

      return data.map(this.mapToDepartureTime)
    } catch (error) {
      console.error('Failed to fetch departure times:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーの出庫時間を取得
   */
  static async getByDriverId(driverId: number): Promise<DepartureTime[]> {
    try {
      const { data, error } = await supabase
        .from('departure_times')
        .select('*')
        .eq('driver_id', driverId)
        .order('departure_date', { ascending: false })
        .order('departure_time', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch departure times for driver: ${error.message}`)
      }

      return data.map(this.mapToDepartureTime)
    } catch (error) {
      console.error('Failed to fetch departure times for driver:', error)
      throw error
    }
  }

  /**
   * 特定日付の全出庫時間を取得
   */
  static async getByDate(date: Date): Promise<DepartureTime[]> {
    try {
      const dateString = date.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('departure_times')
        .select('*')
        .eq('departure_date', dateString)
        .order('departure_time', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch departure times for date: ${error.message}`)
      }

      return data.map(this.mapToDepartureTime)
    } catch (error) {
      console.error('Failed to fetch departure times for date:', error)
      throw error
    }
  }

  /**
   * 出庫時間を登録
   */
  static async create(departureTime: Omit<DepartureTime, 'id' | 'createdAt' | 'updatedAt'>): Promise<DepartureTime> {
    try {
      const departureTimeData: DepartureTimeInsert = {
        driver_id: departureTime.driverId,
        driver_name: departureTime.driverName,
        employee_id: departureTime.employeeId,
        vehicle_id: departureTime.vehicleId || null,
        vehicle_plate_number: departureTime.vehiclePlateNumber || null,
        departure_date: departureTime.departureDate.toISOString().split('T')[0],
        departure_time: departureTime.departureTime
        // NOTE: remarksは一時的にコメントアウト（Supabaseスキーマキャッシュの問題により）
        // remarks: departureTime.remarks || null
      }

      const { data, error } = await supabase
        .from('departure_times')
        .insert(departureTimeData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create departure time: ${error.message}`)
      }

      // 備考がある場合は別途UPDATEで保存（スキーマキャッシュ問題の回避）
      if (departureTime.remarks && departureTime.remarks.trim() !== '') {
        try {
          await supabase
            .from('departure_times')
            .update({ remarks: departureTime.remarks })
            .eq('id', data.id)
        } catch (remarksError) {
          console.warn('Failed to save remarks, but main data was saved:', remarksError)
        }
      }

      return this.mapToDepartureTime(data)
    } catch (error) {
      console.error('Failed to create departure time:', error)
      throw error
    }
  }

  /**
   * 出庫時間を更新
   */
  static async update(id: number, updates: Partial<Omit<DepartureTime, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DepartureTime> {
    try {
      const updateData: DepartureTimeUpdate = {}
      
      if (updates.departureDate !== undefined) {
        updateData.departure_date = updates.departureDate.toISOString().split('T')[0]
      }
      if (updates.departureTime !== undefined) {
        updateData.departure_time = updates.departureTime
      }
      if (updates.vehicleId !== undefined) {
        updateData.vehicle_id = updates.vehicleId || null
      }
      if (updates.vehiclePlateNumber !== undefined) {
        updateData.vehicle_plate_number = updates.vehiclePlateNumber || null
      }
      // NOTE: remarksは別途UPDATEで処理するため、メインのupdateDataには含めない

      const { data, error } = await supabase
        .from('departure_times')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update departure time: ${error.message}`)
      }

      // 備考の更新がある場合は別途UPDATEで処理（スキーマキャッシュ問題の回避）
      if (updates.remarks !== undefined) {
        try {
          await supabase
            .from('departure_times')
            .update({ remarks: updates.remarks || null })
            .eq('id', id)
        } catch (remarksError) {
          console.warn('Failed to update remarks, but main data was updated:', remarksError)
        }
      }

      return this.mapToDepartureTime(data)
    } catch (error) {
      console.error('Failed to update departure time:', error)
      throw error
    }
  }

  /**
   * 出庫時間を削除
   */
  static async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('departure_times')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete departure time: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete departure time:', error)
      throw error
    }
  }

  /**
   * 特定ドライバーの特定日付の出庫時間を取得
   */
  static async getByDriverAndDate(driverId: number, date: Date): Promise<DepartureTime | null> {
    try {
      const dateString = date.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('departure_times')
        .select('*')
        .eq('driver_id', driverId)
        .eq('departure_date', dateString)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw new Error(`Failed to fetch departure time: ${error.message}`)
      }

      return this.mapToDepartureTime(data)
    } catch (error) {
      console.error('Failed to fetch departure time for driver and date:', error)
      throw error
    }
  }

  /**
   * 時間オプションを生成（15分刻み）
   */
  static generateTimeOptions(): string[] {
    const times: string[] = []
    // 3:00から30:00まで対応
    for (let hour = 3; hour <= 30; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeString)
      }
    }
    return times
  }

  /**
   * CSV用のデータを取得（特定日付の全ドライバー）
   */
  static async getCsvDataForDate(date: Date): Promise<{
    date: string
    time: string
    driverName: string
    vehiclePlateNumber: string
  }[]> {
    try {
      const departureTimes = await this.getByDate(date)
      
      return departureTimes.map(dt => ({
        date: `${dt.departureDate.getFullYear()}/${(dt.departureDate.getMonth() + 1).toString().padStart(2, '0')}/${dt.departureDate.getDate().toString().padStart(2, '0')}`,
        time: `${dt.departureDate.getFullYear()}/${(dt.departureDate.getMonth() + 1).toString().padStart(2, '0')}/${dt.departureDate.getDate().toString().padStart(2, '0')} ${dt.departureTime}:00`,
        driverName: dt.driverName,
        vehiclePlateNumber: dt.vehiclePlateNumber || '未割当'
      }))
    } catch (error) {
      console.error('Failed to get CSV data for date:', error)
      throw error
    }
  }

  /**
   * データベース行をDepartureTime型にマップ
   */
  private static mapToDepartureTime(row: DepartureTimeRow): DepartureTime {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      employeeId: row.employee_id,
      vehicleId: row.vehicle_id || undefined,
      vehiclePlateNumber: row.vehicle_plate_number || undefined,
      departureDate: new Date(row.departure_date),
      departureTime: row.departure_time,
      remarks: row.remarks || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}