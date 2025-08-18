import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Driver } from '@/types'

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverInsert = Database['public']['Tables']['drivers']['Insert']
type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export class DriverService {
  // 祝日チーム情報をローカルストレージで管理（データベース移行まで）
  private static HOLIDAY_TEAMS_KEY = 'driver_holiday_teams'
  
  private static saveHolidayTeams(driverId: number, holidayTeams: string[]): void {
    if (typeof window !== 'undefined') {
      const existingData = JSON.parse(localStorage.getItem(this.HOLIDAY_TEAMS_KEY) || '{}')
      existingData[driverId] = holidayTeams
      localStorage.setItem(this.HOLIDAY_TEAMS_KEY, JSON.stringify(existingData))
    }
  }
  
  private static getHolidayTeams(driverId: number): string[] {
    if (typeof window !== 'undefined') {
      const existingData = JSON.parse(localStorage.getItem(this.HOLIDAY_TEAMS_KEY) || '{}')
      return existingData[driverId] || []
    }
    return []
  }
  
  private static deleteHolidayTeams(driverId: number): void {
    if (typeof window !== 'undefined') {
      const existingData = JSON.parse(localStorage.getItem(this.HOLIDAY_TEAMS_KEY) || '{}')
      delete existingData[driverId]
      localStorage.setItem(this.HOLIDAY_TEAMS_KEY, JSON.stringify(existingData))
    }
  }

  static async getAll(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch drivers: ${error.message}`)
    }

    return data.map(DriverService.mapToDriver)
  }

  static async getById(id: number): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch driver: ${error.message}`)
    }

    return DriverService.mapToDriver(data)
  }

  static async getByEmployeeId(employeeId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch driver by employee ID: ${error.message}`)
    }

    return DriverService.mapToDriver(data)
  }

  static async create(driver: Omit<Driver, 'id'>): Promise<Driver> {
    const driverData: DriverInsert = {
      name: driver.name,
      employee_id: driver.employeeId,
      team: driver.team,
      status: driver.status,
      assigned_vehicle: driver.assignedVehicle || null,
      is_night_shift: driver.isNightShift || false,
      // Note: Additional fields (phone, email, address, etc.) require database migration
      // For now, they are stored in the interface but not persisted to DB
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create driver: ${error.message}`)
    }

    // 祝日チーム情報をローカルストレージに保存
    if (driver.holidayTeams && driver.holidayTeams.length > 0) {
      DriverService.saveHolidayTeams(data.id, driver.holidayTeams)
    }

    return DriverService.mapToDriver(data)
  }

  static async update(id: number, updates: Partial<Driver>): Promise<Driver> {
    const driverData: DriverUpdate = {}

    if (updates.name !== undefined) driverData.name = updates.name
    if (updates.employeeId !== undefined) driverData.employee_id = updates.employeeId
    if (updates.team !== undefined) driverData.team = updates.team
    if (updates.status !== undefined) driverData.status = updates.status
    if (updates.assignedVehicle !== undefined) {
      driverData.assigned_vehicle = updates.assignedVehicle || null
    }
    if (updates.isNightShift !== undefined) driverData.is_night_shift = updates.isNightShift
    // Additional fields commented out until database migration:
    // if (updates.phone !== undefined) driverData.phone = updates.phone || null
    // if (updates.email !== undefined) driverData.email = updates.email || null
    // if (updates.address !== undefined) driverData.address = updates.address || null
    // if (updates.emergencyContactName !== undefined) driverData.emergency_contact_name = updates.emergencyContactName || null
    // if (updates.emergencyContactPhone !== undefined) driverData.emergency_contact_phone = updates.emergencyContactPhone || null
    // if (updates.licenseNumber !== undefined) driverData.license_number = updates.licenseNumber || null
    // if (updates.licenseClass !== undefined) driverData.license_class = updates.licenseClass || null
    // if (updates.licenseExpiryDate !== undefined) driverData.license_expiry_date = updates.licenseExpiryDate ? updates.licenseExpiryDate.toISOString().split('T')[0] : null
    // if (updates.hireDate !== undefined) driverData.hire_date = updates.hireDate ? updates.hireDate.toISOString().split('T')[0] : null
    // if (updates.birthDate !== undefined) driverData.birth_date = updates.birthDate ? updates.birthDate.toISOString().split('T')[0] : null
    // if (updates.notes !== undefined) driverData.notes = updates.notes || null
    // if (updates.holidayTeams !== undefined) driverData.holiday_teams = updates.holidayTeams ? JSON.stringify(updates.holidayTeams) : null

    const { data, error } = await supabase
      .from('drivers')
      .update(driverData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update driver: ${error.message}`)
    }

    // 祝日チーム情報をローカルストレージに保存・更新
    if (updates.holidayTeams !== undefined) {
      if (updates.holidayTeams && updates.holidayTeams.length > 0) {
        DriverService.saveHolidayTeams(id, updates.holidayTeams)
      } else {
        DriverService.deleteHolidayTeams(id)
      }
    }

    return DriverService.mapToDriver(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete driver: ${error.message}`)
    }

    // 祝日チーム情報もローカルストレージから削除
    DriverService.deleteHolidayTeams(id)
  }

  static async getByTeam(team: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('team', team)
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch drivers by team: ${error.message}`)
    }

    return data.map(DriverService.mapToDriver)
  }

  static async getByStatus(status: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', status)
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch drivers by status: ${error.message}`)
    }

    return data.map(DriverService.mapToDriver)
  }

  static async getAvailable(): Promise<Driver[]> {
    return this.getByStatus('available')
  }

  static async getNightShiftDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_night_shift', true)
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch night shift drivers: ${error.message}`)
    }

    return data.map(DriverService.mapToDriver)
  }

  static async updateStatus(id: number, status: Driver['status']): Promise<Driver> {
    return this.update(id, { status })
  }

  static async assignVehicle(id: number, vehicleNumber: string): Promise<Driver> {
    return this.update(id, { assignedVehicle: vehicleNumber })
  }

  static async unassignVehicle(id: number): Promise<Driver> {
    return this.update(id, { assignedVehicle: undefined })
  }

  private static mapToDriver(row: DriverRow): Driver {
    return {
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      team: row.team,
      status: row.status as Driver['status'],
      assignedVehicle: row.assigned_vehicle || undefined,
      isNightShift: row.is_night_shift || false,
      // Additional fields - default to undefined since DB migration not yet applied
      phone: (row as any).phone || undefined,
      email: (row as any).email || undefined,
      address: (row as any).address || undefined,
      emergencyContactName: (row as any).emergency_contact_name || undefined,
      emergencyContactPhone: (row as any).emergency_contact_phone || undefined,
      licenseNumber: (row as any).license_number || undefined,
      licenseClass: (row as any).license_class || undefined,
      licenseExpiryDate: (row as any).license_expiry_date ? new Date((row as any).license_expiry_date) : undefined,
      hireDate: (row as any).hire_date ? new Date((row as any).hire_date) : undefined,
      birthDate: (row as any).birth_date ? new Date((row as any).birth_date) : undefined,
      notes: (row as any).notes || undefined,
      holidayTeams: DriverService.getHolidayTeams(row.id)
    }
  }
}