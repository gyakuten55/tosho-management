import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Vehicle } from '@/types'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export class VehicleService {
  static async getAll(): Promise<Vehicle[]> {
    try {
      console.log('VehicleService.getAll: Starting vehicles fetch')
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('id')

      console.log('VehicleService.getAll: Query result:', { data: data?.length, error })

      if (error) {
        console.error('VehicleService.getAll: Supabase error:', error)
        throw new Error(`Failed to fetch vehicles: ${error.message}`)
      }

      const vehicles = data.map(this.mapToVehicle)
      console.log('VehicleService.getAll: Mapped vehicles count:', vehicles.length)
      
      return vehicles
    } catch (err) {
      console.error('VehicleService.getAll: Unexpected error:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('ネットワーク接続エラー: Supabaseサーバーに接続できません。インターネット接続を確認してください。')
      }
      
      throw err
    }
  }

  static async getById(id: number): Promise<Vehicle | null> {
    try {
      console.log('VehicleService.getById: Fetching vehicle with id:', id)
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      console.log('VehicleService.getById: Query result:', { data: !!data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('VehicleService.getById: Vehicle not found (PGRST116)')
          return null
        }
        console.error('VehicleService.getById: Supabase error:', error)
        throw new Error(`Failed to fetch vehicle: ${error.message}`)
      }

      const vehicle = this.mapToVehicle(data)
      console.log('VehicleService.getById: Successfully mapped vehicle:', vehicle.plateNumber)
      return vehicle
    } catch (err) {
      console.error('VehicleService.getById: Unexpected error:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('ネットワーク接続エラー: 車両情報を取得できません。')
      }
      
      throw err
    }
  }

  static async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const vehicleData: VehicleInsert = {
      plate_number: vehicle.plateNumber,
      model: vehicle.model,
      year: vehicle.year,
      driver_name: vehicle.driver || null,
      team: vehicle.team,
      status: vehicle.status,
      inspection_date: vehicle.inspectionDate.toISOString().split('T')[0],
      crane_annual_inspection_date: vehicle.craneAnnualInspectionDate ? vehicle.craneAnnualInspectionDate.toISOString().split('T')[0] : null,
      garage: vehicle.garage,
      notes: vehicle.notes || null
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle: ${error.message}`)
    }

    // 新規作成した車両にドライバーが割り当てられている場合、ドライバーテーブルを同期
    if (data.driver_name) {
      try {
        const { DriverService } = await import('./driverService')
        const driver = await DriverService.getByName(data.driver_name)
        if (driver) {
          console.log('VehicleService: Syncing driver for new vehicle:', data.driver_name, data.plate_number)
          await DriverService.update(driver.id, { assignedVehicle: data.plate_number }, true)
        }
      } catch (syncError) {
        console.error('VehicleService: Driver sync failed for new vehicle:', syncError)
        // 新規作成時は同期エラーでも車両作成を失敗させない
        console.warn('車両は作成されましたが、ドライバーテーブルの同期に失敗しました')
      }
    }

    return this.mapToVehicle(data)
  }

  static async update(id: number, updates: Partial<Vehicle>, skipSync = false): Promise<Vehicle> {
    console.log('VehicleService.update called:', { id, updates, skipSync })
    
    // 現在の車両データを取得
    const currentVehicle = await this.getById(id)
    if (!currentVehicle) {
      throw new Error('Vehicle not found')
    }
    
    console.log('VehicleService.update current vehicle:', currentVehicle)
    
    // ドライバーの正規化関数（空文字をundefinedに変換）
    const normalizeDriver = (driver: string | undefined) => {
      return driver && driver.trim() ? driver.trim() : undefined
    }

    const vehicleData: VehicleUpdate = {}
    let hasChanges = false

    if (updates.plateNumber !== undefined && updates.plateNumber !== currentVehicle.plateNumber) {
      vehicleData.plate_number = updates.plateNumber
      hasChanges = true
    }
    if (updates.model !== undefined && updates.model !== currentVehicle.model) {
      vehicleData.model = updates.model
      hasChanges = true
    }
    if (updates.year !== undefined && updates.year !== currentVehicle.year) {
      vehicleData.year = updates.year
      hasChanges = true
    }
    if ('driver' in updates) {
      const normalizedNewDriver = normalizeDriver(updates.driver)
      const normalizedCurrentDriver = normalizeDriver(currentVehicle.driver)
      if (normalizedNewDriver !== normalizedCurrentDriver) {
        vehicleData.driver_name = normalizedNewDriver || null
        hasChanges = true
        console.log('VehicleService: Driver change detected in vehicleData creation:', {
          original: updates.driver,
          normalized: normalizedNewDriver,
          current: normalizedCurrentDriver
        })
      }
    }
    if (updates.team !== undefined && updates.team !== currentVehicle.team) {
      vehicleData.team = updates.team
      hasChanges = true
    }
    if (updates.status !== undefined && updates.status !== currentVehicle.status) {
      vehicleData.status = updates.status
      hasChanges = true
    }
    if (updates.inspectionDate !== undefined) {
      const newDate = updates.inspectionDate.toISOString().split('T')[0]
      const oldDate = currentVehicle.inspectionDate.toISOString().split('T')[0]
      if (newDate !== oldDate) {
        vehicleData.inspection_date = newDate
        hasChanges = true
      }
    }
    if ('craneAnnualInspectionDate' in updates) {
      const newDate = updates.craneAnnualInspectionDate ? updates.craneAnnualInspectionDate.toISOString().split('T')[0] : null
      const oldDate = currentVehicle.craneAnnualInspectionDate ? currentVehicle.craneAnnualInspectionDate.toISOString().split('T')[0] : null
      if (newDate !== oldDate) {
        vehicleData.crane_annual_inspection_date = newDate
        hasChanges = true
      }
    }
    if (updates.garage !== undefined && updates.garage !== currentVehicle.garage) {
      vehicleData.garage = updates.garage
      hasChanges = true
    }
    if (updates.notes !== undefined && updates.notes !== currentVehicle.notes) {
      vehicleData.notes = updates.notes || null
      hasChanges = true
    }

    // 変更がない場合は早期リターン
    if (!hasChanges) {
      console.log('VehicleService.update: No changes detected, returning current vehicle')
      return currentVehicle
    }
    
    console.log('VehicleService.update executing query:', { id, vehicleData, hasChanges })
    
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single()
      
    console.log('VehicleService.update query result:', { data, error })

    if (error) {
      throw new Error(`Failed to update vehicle: ${error.message}`)
    }

    // ドライバーの割り当てが変更された場合、ドライバーテーブルを同期
    console.log('VehicleService: Checking sync conditions:', {
      skipSync,
      'updates.driver': updates.driver,
      'currentVehicle.driver': currentVehicle.driver,
      'updates.plateNumber': updates.plateNumber,
      'currentVehicle.plateNumber': currentVehicle.plateNumber,
      'driver changed': updates.driver !== undefined && updates.driver !== currentVehicle.driver,
      'plate changed': updates.plateNumber !== undefined && updates.plateNumber !== currentVehicle.plateNumber && currentVehicle.driver
    })
    
    const currentDriverNormalized = normalizeDriver(currentVehicle.driver)
    const updatesDriverNormalized = 'driver' in updates ? normalizeDriver(updates.driver) : undefined
    
    const needsDriverSync = !skipSync && (
      ('driver' in updates && updatesDriverNormalized !== currentDriverNormalized) ||
      (updates.plateNumber !== undefined && updates.plateNumber !== currentVehicle.plateNumber && currentVehicle.driver)
    )
    
    console.log('VehicleService: Detailed sync condition breakdown:', {
      'skipSync': skipSync,
      '!skipSync': !skipSync,
      "'driver' in updates": 'driver' in updates,
      'updatesDriverNormalized !== currentDriverNormalized': updatesDriverNormalized !== currentDriverNormalized,
      'driver condition result': 'driver' in updates && updatesDriverNormalized !== currentDriverNormalized,
      'plate condition check': updates.plateNumber !== undefined,
      'plate changed': updates.plateNumber !== currentVehicle.plateNumber,
      'has current driver': !!currentVehicle.driver,
      'plate condition result': updates.plateNumber !== undefined && updates.plateNumber !== currentVehicle.plateNumber && currentVehicle.driver,
      'final needsDriverSync': !skipSync && (('driver' in updates && updatesDriverNormalized !== currentDriverNormalized) || (updates.plateNumber !== undefined && updates.plateNumber !== currentVehicle.plateNumber && currentVehicle.driver))
    })
    
    console.log('VehicleService: Normalized values:', {
      currentDriverNormalized,
      updatesDriverNormalized,
      'driver actually changed': updatesDriverNormalized !== currentDriverNormalized
    })
    
    console.log('VehicleService: needsDriverSync:', needsDriverSync)
    
    if (needsDriverSync) {
      const oldDriver = currentVehicle.driver
      const oldPlateNumber = currentVehicle.plateNumber
      const newDriver = data.driver_name || null // 更新後のドライバー（nullの場合の対応）
      const newPlateNumber = data.plate_number // 更新後のプレート番号
      
      console.log('VehicleService: Database returned data:', {
        'data.driver_name': data.driver_name,
        'typeof data.driver_name': typeof data.driver_name,
        'data.driver_name === null': data.driver_name === null,
        'data.driver_name === undefined': data.driver_name === undefined,
        newDriver,
        newPlateNumber
      })
      
      console.log('VehicleService: Syncing driver assignment', {
        oldDriver,
        newDriver,
        oldPlateNumber,
        newPlateNumber,
        needsDriverSync,
        skipSync
      })
      
      try {
        const { DriverService } = await import('./driverService')

        // 1. 古いドライバーから車両割り当てを解除
        if (oldDriver && oldDriver !== newDriver) {
          const previousDriver = await DriverService.getByName(oldDriver)
          console.log('VehicleService: Found previous driver:', previousDriver)
          
          if (previousDriver) {
            // プレート番号が変更前か後か、どちらかにマッチするかチェック
            const isAssignedToThisVehicle = previousDriver.assignedVehicle === oldPlateNumber || 
                                           previousDriver.assignedVehicle === newPlateNumber
            
            console.log('VehicleService: Checking old driver assignment:', {
              driverName: oldDriver,
              driverAssignedVehicle: previousDriver.assignedVehicle,
              oldPlateNumber,
              newPlateNumber,
              isAssignedToThisVehicle
            })
            
            if (isAssignedToThisVehicle) {
              console.log('VehicleService: Removing vehicle from old driver:', oldDriver)
              await DriverService.update(previousDriver.id, { assignedVehicle: undefined }, true)
            } else {
              console.log('VehicleService: Old driver is not assigned to this vehicle, skipping removal')
            }
          } else {
            console.warn('VehicleService: Previous driver not found:', oldDriver)
          }
        }

        // 2. 新しいドライバーに車両を割り当て
        if (newDriver && newDriver !== oldDriver) {
          const newDriverRecord = await DriverService.getByName(newDriver)
          if (newDriverRecord) {
            console.log('VehicleService: Assigning vehicle to new driver:', newDriver, newPlateNumber)
            await DriverService.update(newDriverRecord.id, { assignedVehicle: newPlateNumber }, true)
          }
        }

        // 3. プレート番号が変更された場合、同じドライバーの割り当てを更新
        if (newDriver && newDriver === oldDriver && newPlateNumber !== oldPlateNumber) {
          const driverRecord = await DriverService.getByName(newDriver)
          if (driverRecord) {
            console.log('VehicleService: Updating plate number for same driver:', newDriver, newPlateNumber)
            await DriverService.update(driverRecord.id, { assignedVehicle: newPlateNumber }, true)
          }
        }
      } catch (syncError) {
        console.error('VehicleService: Driver sync failed:', syncError)
        throw new Error(`車両の更新は完了しましたが、ドライバーテーブルの同期に失敗しました: ${syncError}`)
      }
    }

    return this.mapToVehicle(data)
  }

  static async delete(id: number): Promise<void> {
    console.log('VehicleService.delete called:', { id })
    
    try {
      // 削除前に車両情報を取得し、ドライバーとの同期を実行
      const vehicleToDelete = await this.getById(id)
      if (!vehicleToDelete) {
        console.log('VehicleService.delete: Vehicle not found, checking if it exists in database')
        
        // 直接データベースで存在確認
        const { data: existsCheck } = await supabase
          .from('vehicles')
          .select('id')
          .eq('id', id)
          .single()
        
        if (!existsCheck) {
          throw new Error('指定された車両が見つかりません。既に削除されている可能性があります。')
        }
      }
    
      console.log('VehicleService.delete vehicle info:', vehicleToDelete)
      
      // 削除対象の車両にドライバーが割り当てられている場合、ドライバーの車両割り当てを解除
      if (vehicleToDelete && vehicleToDelete.driver) {
        try {
          const { DriverService } = await import('./driverService')
          const driver = await DriverService.getByName(vehicleToDelete.driver)
          if (driver && driver.assignedVehicle === vehicleToDelete.plateNumber) {
            console.log('VehicleService.delete: Removing vehicle assignment from driver:', driver.name)
            await DriverService.update(driver.id, { assignedVehicle: undefined }, true)
          }
        } catch (syncError) {
          console.error('VehicleService.delete: Driver sync failed:', syncError)
          // 削除処理は継続するが、エラーを警告
          console.warn('車両を削除しますが、ドライバーの車両割り当て解除に失敗しました')
        }
      }
      
      // 車両を削除
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('VehicleService.delete: Delete error:', error)
        throw new Error(`車両の削除に失敗しました: ${error.message}`)
      }
      
      console.log('VehicleService.delete: Vehicle deleted successfully')
    } catch (err) {
      console.error('VehicleService.delete: Unexpected error:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('ネットワーク接続エラー: 車両を削除できません。インターネット接続を確認してください。')
      }
      
      throw err
    }
  }

  static async getByTeam(team: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('team', team)
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch vehicles by team: ${error.message}`)
    }

    return data.map(this.mapToVehicle)
  }

  static async getByStatus(status: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', status)
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch vehicles by status: ${error.message}`)
    }

    return data.map(this.mapToVehicle)
  }

  static async getInspectionDue(beforeDate: Date): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .lte('inspection_date', beforeDate.toISOString().split('T')[0])
      .order('inspection_date')

    if (error) {
      throw new Error(`Failed to fetch vehicles with inspection due: ${error.message}`)
    }

    return data.map(this.mapToVehicle)
  }

  // ナンバープレートで車両を検索
  static async getByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate_number', plateNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch vehicle by plate number: ${error.message}`)
    }

    return this.mapToVehicle(data)
  }

  private static mapToVehicle(row: VehicleRow): Vehicle {
    return {
      id: row.id,
      plateNumber: row.plate_number,
      model: row.model,
      year: row.year,
      driver: row.driver_name || undefined,
      team: row.team,
      status: row.status as Vehicle['status'],
      inspectionDate: new Date(row.inspection_date),
      craneAnnualInspectionDate: row.crane_annual_inspection_date ? new Date(row.crane_annual_inspection_date) : undefined,
      garage: row.garage,
      notes: row.notes || undefined
    }
  }
}