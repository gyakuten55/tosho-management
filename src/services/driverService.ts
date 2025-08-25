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
      notes: driver.isExternal ? `[EXTERNAL]${driver.notes || ''}` : (driver.notes || null)
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create driver: ${error.message}`)
    }

    // 新規作成したドライバーに車両が割り当てられている場合、車両テーブルを同期
    if (data.assigned_vehicle) {
      try {
        const { VehicleService } = await import('./vehicleService')
        const vehicle = await VehicleService.getByPlateNumber(data.assigned_vehicle)
        if (vehicle) {
          console.log('DriverService: Syncing vehicle for new driver:', data.assigned_vehicle, data.name)
          await VehicleService.update(vehicle.id, { driver: data.name }, true)
        }
      } catch (syncError) {
        console.error('DriverService: Vehicle sync failed for new driver:', syncError)
        // 新規作成時は同期エラーでもドライバー作成を失敗させない
        console.warn('ドライバーは作成されましたが、車両テーブルの同期に失敗しました')
      }
    }

    return DriverService.mapToDriver(data)
  }

  static async update(id: number, updates: Partial<Driver>, skipSync = false): Promise<Driver> {
    console.log('DriverService.update called:', { id, updates, skipSync })
    
    // 現在のドライバーデータを取得
    const currentDriver = await this.getById(id)
    if (!currentDriver) {
      throw new Error('Driver not found')
    }
    
    console.log('DriverService.update current driver:', currentDriver)
    
    // 車両の正規化関数（空文字をundefinedに変換）
    const normalizeVehicle = (vehicle: string | undefined) => {
      return vehicle && vehicle.trim() ? vehicle.trim() : undefined
    }

    const driverData: DriverUpdate = {}
    let hasChanges = false

    if (updates.name !== undefined && updates.name !== currentDriver.name) {
      driverData.name = updates.name
      hasChanges = true
    }
    if (updates.employeeId !== undefined && updates.employeeId !== currentDriver.employeeId) {
      driverData.employee_id = updates.employeeId
      hasChanges = true
    }
    if (updates.team !== undefined && updates.team !== currentDriver.team) {
      driverData.team = updates.team
      hasChanges = true
    }
    if (updates.status !== undefined && updates.status !== currentDriver.status) {
      driverData.status = updates.status
      hasChanges = true
    }
    if ('assignedVehicle' in updates) {
      const normalizedNewVehicle = normalizeVehicle(updates.assignedVehicle)
      const normalizedCurrentVehicle = normalizeVehicle(currentDriver.assignedVehicle)
      if (normalizedNewVehicle !== normalizedCurrentVehicle) {
        driverData.assigned_vehicle = normalizedNewVehicle || null
        hasChanges = true
        console.log('DriverService: Vehicle assignment change detected:', {
          original: updates.assignedVehicle,
          normalized: normalizedNewVehicle,
          current: normalizedCurrentVehicle
        })
      }
    }
    if (updates.isNightShift !== undefined && updates.isNightShift !== currentDriver.isNightShift) {
      driverData.is_night_shift = updates.isNightShift
      hasChanges = true
    }
    
    // パスワードが更新される場合はハッシュ化
    if (updates.password !== undefined && updates.password) {
      const saltRounds = 10
      driverData.password = await bcrypt.hash(updates.password, saltRounds)
    }
    
    if (updates.phone !== undefined && updates.phone !== currentDriver.phone) {
      driverData.phone = updates.phone || null
      hasChanges = true
    }
    if (updates.email !== undefined && updates.email !== currentDriver.email) {
      driverData.email = updates.email || null
      hasChanges = true
    }
    if (updates.address !== undefined && updates.address !== currentDriver.address) {
      driverData.address = updates.address || null
      hasChanges = true
    }
    if (updates.emergencyContactName !== undefined && updates.emergencyContactName !== currentDriver.emergencyContactName) {
      driverData.emergency_contact_name = updates.emergencyContactName || null
      hasChanges = true
    }
    if (updates.emergencyContactPhone !== undefined && updates.emergencyContactPhone !== currentDriver.emergencyContactPhone) {
      driverData.emergency_contact_phone = updates.emergencyContactPhone || null
      hasChanges = true
    }
    if (updates.licenseNumber !== undefined && updates.licenseNumber !== currentDriver.licenseNumber) {
      driverData.license_number = updates.licenseNumber || null
      hasChanges = true
    }
    if (updates.licenseClass !== undefined && updates.licenseClass !== currentDriver.licenseClass) {
      driverData.license_class = updates.licenseClass || null
      hasChanges = true
    }
    if (updates.licenseExpiryDate !== undefined) {
      const newDate = updates.licenseExpiryDate ? updates.licenseExpiryDate.toISOString().split('T')[0] : null
      const oldDate = currentDriver.licenseExpiryDate ? currentDriver.licenseExpiryDate.toISOString().split('T')[0] : null
      if (newDate !== oldDate) {
        driverData.license_expiry_date = newDate
        hasChanges = true
      }
    }
    if (updates.hireDate !== undefined) {
      const newDate = updates.hireDate ? updates.hireDate.toISOString().split('T')[0] : null
      const oldDate = currentDriver.hireDate ? currentDriver.hireDate.toISOString().split('T')[0] : null
      if (newDate !== oldDate) {
        driverData.hire_date = newDate
        hasChanges = true
      }
    }
    if (updates.birthDate !== undefined) {
      const newDate = updates.birthDate ? updates.birthDate.toISOString().split('T')[0] : null
      const oldDate = currentDriver.birthDate ? currentDriver.birthDate.toISOString().split('T')[0] : null
      if (newDate !== oldDate) {
        driverData.birth_date = newDate
        hasChanges = true
      }
    }
    if (updates.notes !== undefined && updates.notes !== currentDriver.notes) {
      driverData.notes = updates.notes || null
      hasChanges = true
    }
    if ('holidayTeams' in updates) {
      const newTeams = updates.holidayTeams ? JSON.stringify(updates.holidayTeams) : '[]'
      const oldTeams = currentDriver.holidayTeams ? JSON.stringify(currentDriver.holidayTeams) : '[]'
      if (newTeams !== oldTeams) {
        driverData.holiday_teams = newTeams
        hasChanges = true
      }
    }
    if ('isExternal' in updates && updates.isExternal !== currentDriver.isExternal) {
      // isExternalフラグをnotesフィールドに埋め込み
      const currentNotes = updates.notes !== undefined ? updates.notes : currentDriver.notes
      driverData.notes = updates.isExternal ? `[EXTERNAL]${currentNotes || ''}` : (currentNotes || null)
      hasChanges = true
    }

    // 変更がない場合は早期リターン
    if (!hasChanges && !updates.password) {
      console.log('DriverService.update: No changes detected, returning current driver')
      return currentDriver
    }
    
    console.log('DriverService.update executing query:', { id, driverData, hasChanges })
    
    const { data, error } = await supabase
      .from('drivers')
      .update(driverData)
      .eq('id', id)
      .select()
      .single()
      
    console.log('DriverService.update query result:', { data, error })

    if (error) {
      throw new Error(`Failed to update driver: ${error.message}`)
    }

    // 車両割り当てが変更された場合、車両テーブルを同期
    const currentVehicleNormalized = normalizeVehicle(currentDriver.assignedVehicle)
    const updatesVehicleNormalized = 'assignedVehicle' in updates ? normalizeVehicle(updates.assignedVehicle) : undefined
    
    const needsVehicleSync = !skipSync && (
      ('assignedVehicle' in updates && updatesVehicleNormalized !== currentVehicleNormalized) ||
      (updates.name !== undefined && updates.name !== currentDriver.name && currentDriver.assignedVehicle)
    )
    
    console.log('DriverService: Sync conditions check:', {
      currentVehicleNormalized,
      updatesVehicleNormalized,
      'vehicle assignment changed': updatesVehicleNormalized !== currentVehicleNormalized,
      needsVehicleSync
    })
    
    if (needsVehicleSync) {
      const oldVehicle = currentDriver.assignedVehicle
      const oldDriverName = currentDriver.name
      const newVehicle = data.assigned_vehicle // 更新後の車両
      const newDriverName = data.name // 更新後のドライバー名
      
      console.log('DriverService: Syncing vehicle assignment', {
        oldVehicle,
        newVehicle, 
        oldDriverName,
        newDriverName,
        needsVehicleSync,
        skipSync
      })
      
      try {
        const { VehicleService } = await import('./vehicleService')

        // 1. 古い車両からドライバー割り当てを解除
        if (oldVehicle && oldVehicle !== newVehicle) {
          const previousVehicle = await VehicleService.getByPlateNumber(oldVehicle)
          console.log('DriverService: Found previous vehicle:', previousVehicle)
          
          if (previousVehicle) {
            // ドライバー名が変更前か後か、どちらかにマッチするかチェック
            const isAssignedToThisDriver = previousVehicle.driver === oldDriverName || 
                                          previousVehicle.driver === newDriverName
            
            console.log('DriverService: Checking old vehicle assignment:', {
              vehiclePlateNumber: oldVehicle,
              vehicleAssignedDriver: previousVehicle.driver,
              oldDriverName,
              newDriverName,
              isAssignedToThisDriver
            })
            
            if (isAssignedToThisDriver) {
              console.log('DriverService: Removing driver from old vehicle:', oldVehicle)
              await VehicleService.update(previousVehicle.id, { driver: undefined }, true)
            } else {
              console.log('DriverService: Old vehicle is not assigned to this driver, skipping removal')
            }
          } else {
            console.warn('DriverService: Previous vehicle not found:', oldVehicle)
          }
        }

        // 2. 新しい車両にドライバーを割り当て
        if (newVehicle && newVehicle !== oldVehicle) {
          const newVehicleRecord = await VehicleService.getByPlateNumber(newVehicle)
          if (newVehicleRecord) {
            console.log('DriverService: Assigning driver to new vehicle:', newVehicle, newDriverName)
            await VehicleService.update(newVehicleRecord.id, { driver: newDriverName }, true)
          }
        }

        // 3. ドライバー名が変更された場合、同じ車両のドライバー名を更新
        if (newVehicle && newVehicle === oldVehicle && newDriverName !== oldDriverName) {
          const vehicleRecord = await VehicleService.getByPlateNumber(newVehicle)
          if (vehicleRecord) {
            console.log('DriverService: Updating driver name for same vehicle:', newVehicle, newDriverName)
            await VehicleService.update(vehicleRecord.id, { driver: newDriverName }, true)
          }
        }
      } catch (syncError) {
        console.error('DriverService: Vehicle sync failed:', syncError)
        throw new Error(`ドライバーの更新は完了しましたが、車両テーブルの同期に失敗しました: ${syncError}`)
      }
    }

    return DriverService.mapToDriver(data)
  }

  static async delete(id: number): Promise<void> {
    console.log('DriverService.delete called:', { id })
    
    // 削除前にドライバー情報を取得し、車両との同期を実行
    const driverToDelete = await this.getById(id)
    if (!driverToDelete) {
      throw new Error('Driver not found')
    }
    
    console.log('DriverService.delete driver info:', driverToDelete)
    
    // 削除対象のドライバーに車両が割り当てられている場合、車両のドライバー割り当てを解除
    if (driverToDelete.assignedVehicle) {
      try {
        const { VehicleService } = await import('./vehicleService')
        const vehicle = await VehicleService.getByPlateNumber(driverToDelete.assignedVehicle)
        if (vehicle && vehicle.driver === driverToDelete.name) {
          console.log('DriverService.delete: Removing driver assignment from vehicle:', vehicle.plateNumber)
          await VehicleService.update(vehicle.id, { driver: undefined }, true)
        }
      } catch (syncError) {
        console.error('DriverService.delete: Vehicle sync failed:', syncError)
        // 削除処理は継続するが、エラーを警告
        console.warn('ドライバーを削除しますが、車両のドライバー割り当て解除に失敗しました')
      }
    }
    
    // ドライバーを削除
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete driver: ${error.message}`)
    }
    
    console.log('DriverService.delete: Driver deleted successfully')
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

  // 名前でドライバーを検索
  static async getByName(name: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch driver by name: ${error.message}`)
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

    // notesフィールドから外部ドライバーフラグを抽出
    let isExternal = false
    let cleanNotes = row.notes || undefined
    if (row.notes && row.notes.startsWith('[EXTERNAL]')) {
      isExternal = true
      cleanNotes = row.notes.substring(10) || undefined // [EXTERNAL]を除去
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
      notes: cleanNotes,
      holidayTeams: holidayTeams,
      isExternal: isExternal
    }
  }
}