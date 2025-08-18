import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Vehicle } from '@/types'

type VehicleRow = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export class VehicleService {
  static async getAll(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('id')

    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }

    return data.map(this.mapToVehicle)
  }

  static async getById(id: number): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch vehicle: ${error.message}`)
    }

    return this.mapToVehicle(data)
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

    return this.mapToVehicle(data)
  }

  static async update(id: number, updates: Partial<Vehicle>): Promise<Vehicle> {
    const vehicleData: VehicleUpdate = {}

    if (updates.plateNumber !== undefined) vehicleData.plate_number = updates.plateNumber
    if (updates.model !== undefined) vehicleData.model = updates.model
    if (updates.year !== undefined) vehicleData.year = updates.year
    if (updates.driver !== undefined) vehicleData.driver_name = updates.driver || null
    if (updates.team !== undefined) vehicleData.team = updates.team
    if (updates.status !== undefined) vehicleData.status = updates.status
    if (updates.inspectionDate !== undefined) {
      vehicleData.inspection_date = updates.inspectionDate.toISOString().split('T')[0]
    }
    if (updates.garage !== undefined) vehicleData.garage = updates.garage
    if (updates.notes !== undefined) vehicleData.notes = updates.notes || null

    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle: ${error.message}`)
    }

    return this.mapToVehicle(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle: ${error.message}`)
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
      garage: row.garage,
      notes: row.notes || undefined
    }
  }
}