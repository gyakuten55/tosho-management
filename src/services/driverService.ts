import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Driver } from '@/types'
import bcrypt from 'bcryptjs'

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverInsert = Database['public']['Tables']['drivers']['Insert']
type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export class DriverService {

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
    // パスワードをハッシュ化
    let hashedPassword = null
    if (driver.password) {
      const saltRounds = 10
      hashedPassword = await bcrypt.hash(driver.password, saltRounds)
    }

    const driverData: DriverInsert = {
      name: driver.name,
      employee_id: driver.employeeId,
      team: driver.team,
      status: driver.status,
      assigned_vehicle: driver.assignedVehicle || null,
      is_night_shift: driver.isNightShift || false,
      password: hashedPassword,
      holiday_teams: driver.holidayTeams ? JSON.stringify(driver.holidayTeams) : '[]',
      phone: driver.phone || null,
      email: driver.email || null,
      address: driver.address || null,
      emergency_contact_name: driver.emergencyContactName || null,
      emergency_contact_phone: driver.emergencyContactPhone || null,
      license_number: driver.licenseNumber || null,
      license_class: driver.licenseClass || null,
      license_expiry_date: driver.licenseExpiryDate ? driver.licenseExpiryDate.toISOString().split('T')[0] : null,
      hire_date: driver.hireDate ? driver.hireDate.toISOString().split('T')[0] : null,
      birth_date: driver.birthDate ? driver.birthDate.toISOString().split('T')[0] : null,
      notes: driver.notes || null
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create driver: ${error.message}`)
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
    
    // パスワードが更新される場合はハッシュ化
    if (updates.password !== undefined && updates.password) {
      const saltRounds = 10
      driverData.password = await bcrypt.hash(updates.password, saltRounds)
    }
    
    if (updates.phone !== undefined) driverData.phone = updates.phone || null
    if (updates.email !== undefined) driverData.email = updates.email || null
    if (updates.address !== undefined) driverData.address = updates.address || null
    if (updates.emergencyContactName !== undefined) driverData.emergency_contact_name = updates.emergencyContactName || null
    if (updates.emergencyContactPhone !== undefined) driverData.emergency_contact_phone = updates.emergencyContactPhone || null
    if (updates.licenseNumber !== undefined) driverData.license_number = updates.licenseNumber || null
    if (updates.licenseClass !== undefined) driverData.license_class = updates.licenseClass || null
    if (updates.licenseExpiryDate !== undefined) driverData.license_expiry_date = updates.licenseExpiryDate ? updates.licenseExpiryDate.toISOString().split('T')[0] : null
    if (updates.hireDate !== undefined) driverData.hire_date = updates.hireDate ? updates.hireDate.toISOString().split('T')[0] : null
    if (updates.birthDate !== undefined) driverData.birth_date = updates.birthDate ? updates.birthDate.toISOString().split('T')[0] : null
    if (updates.notes !== undefined) driverData.notes = updates.notes || null
    if (updates.holidayTeams !== undefined) driverData.holiday_teams = updates.holidayTeams ? JSON.stringify(updates.holidayTeams) : '[]'

    const { data, error } = await supabase
      .from('drivers')
      .update(driverData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update driver: ${error.message}`)
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

  // パスワード認証用メソッド
  static async authenticateDriver(employeeId: string, password: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('employee_id', employeeId)
      .single()

    if (error || !data) {
      return null
    }

    // パスワードが設定されていない場合は認証失敗
    if (!data.password) {
      return null
    }

    // パスワードを比較
    const isPasswordValid = await bcrypt.compare(password, data.password)
    if (!isPasswordValid) {
      return null
    }

    return DriverService.mapToDriver(data)
  }

  private static mapToDriver(row: DriverRow): Driver {
    let holidayTeams: string[] = []
    try {
      if (row.holiday_teams) {
        holidayTeams = typeof row.holiday_teams === 'string' 
          ? JSON.parse(row.holiday_teams) 
          : row.holiday_teams as string[]
      }
    } catch (error) {
      console.warn('Failed to parse holiday teams for driver', row.id, error)
      holidayTeams = []
    }

    return {
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      team: row.team,
      status: row.status as Driver['status'],
      assignedVehicle: row.assigned_vehicle || undefined,
      isNightShift: row.is_night_shift || false,
      phone: row.phone || undefined,
      email: row.email || undefined,
      address: row.address || undefined,
      emergencyContactName: row.emergency_contact_name || undefined,
      emergencyContactPhone: row.emergency_contact_phone || undefined,
      licenseNumber: row.license_number || undefined,
      licenseClass: row.license_class || undefined,
      licenseExpiryDate: row.license_expiry_date ? new Date(row.license_expiry_date) : undefined,
      hireDate: row.hire_date ? new Date(row.hire_date) : undefined,
      birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
      notes: row.notes || undefined,
      holidayTeams: holidayTeams
    }
  }
}