import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { TemporaryAssignment } from '@/types'

type TemporaryAssignmentRow = Database['public']['Tables']['temporary_assignments']['Row']
type TemporaryAssignmentInsert = Database['public']['Tables']['temporary_assignments']['Insert']

export class TemporaryAssignmentService {
  static async getAll(): Promise<TemporaryAssignment[]> {
    const { data, error } = await supabase
      .from('temporary_assignments')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
        console.warn('temporary_assignments table not found, returning empty array. Please create the table using create-table.sql')
        return []
      }
      throw new Error(`Failed to fetch temporary assignments: ${error.message}`)
    }

    return data.map(this.mapToTemporaryAssignment)
  }

  static async create(assignment: Omit<TemporaryAssignment, 'id' | 'createdAt'>): Promise<TemporaryAssignment> {
    const insertData: TemporaryAssignmentInsert = {
      driver_id: assignment.driverId,
      driver_name: assignment.driverName,
      vehicle_id: assignment.vehicleId,
      plate_number: assignment.plateNumber,
      start_date: assignment.startDate.toISOString(),
      end_date: assignment.endDate.toISOString(),
      created_by: assignment.createdBy || 'system',
      original_driver_name: assignment.originalDriverName
    }

    const { data, error } = await supabase
      .from('temporary_assignments')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create temporary assignment: ${error.message}`)
    }

    return this.mapToTemporaryAssignment(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('temporary_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete temporary assignment: ${error.message}`)
    }
  }

  static async getActiveAssignments(): Promise<TemporaryAssignment[]> {
    const today = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('temporary_assignments')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
        console.warn('temporary_assignments table not found, returning empty array. Please create the table using create-table.sql')
        return []
      }
      throw new Error(`Failed to fetch active temporary assignments: ${error.message}`)
    }

    return data.map(this.mapToTemporaryAssignment)
  }

  static async deleteExpired(): Promise<number> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data, error } = await supabase
      .from('temporary_assignments')
      .delete()
      .lt('end_date', yesterday.toISOString())
      .select('id')

    if (error) {
      // If table doesn't exist, return 0 instead of throwing
      if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
        console.warn('temporary_assignments table not found, returning 0. Please create the table using create-table.sql')
        return 0
      }
      throw new Error(`Failed to delete expired temporary assignments: ${error.message}`)
    }

    return data?.length || 0
  }

  private static mapToTemporaryAssignment(row: TemporaryAssignmentRow): TemporaryAssignment {
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      vehicleId: row.vehicle_id,
      plateNumber: row.plate_number,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      createdAt: new Date(row.created_at),
      createdBy: row.created_by,
      originalDriverName: row.original_driver_name || undefined
    }
  }
}