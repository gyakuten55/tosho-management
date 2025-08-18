import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { Holiday, HolidayTeam } from '@/types'

type HolidayRow = Database['public']['Tables']['holidays']['Row']
type HolidayInsert = Database['public']['Tables']['holidays']['Insert']
type HolidayUpdate = Database['public']['Tables']['holidays']['Update']

export class HolidayService {
  static async getAll(): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch holidays: ${error.message}`)
    }

    return data.map(this.mapToHoliday)
  }

  static async getByYear(year: number): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date')

    if (error) {
      throw new Error(`Failed to fetch holidays by year: ${error.message}`)
    }

    return data.map(this.mapToHoliday)
  }

  static async create(holiday: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<Holiday> {
    const holidayData: HolidayInsert = {
      name: holiday.name,
      date: holiday.date.toISOString().split('T')[0],
      is_national_holiday: holiday.isNationalHoliday,
      is_recurring: holiday.isRecurring
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert(holidayData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create holiday: ${error.message}`)
    }

    return this.mapToHoliday(data)
  }

  static async update(id: number, updates: Partial<Holiday>): Promise<Holiday> {
    const holidayData: HolidayUpdate = {}
    
    if (updates.name !== undefined) holidayData.name = updates.name
    if (updates.date !== undefined) holidayData.date = updates.date.toISOString().split('T')[0]
    if (updates.isNationalHoliday !== undefined) holidayData.is_national_holiday = updates.isNationalHoliday
    if (updates.isRecurring !== undefined) holidayData.is_recurring = updates.isRecurring

    const { data, error } = await supabase
      .from('holidays')
      .update(holidayData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update holiday: ${error.message}`)
    }

    return this.mapToHoliday(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete holiday: ${error.message}`)
    }
  }

  static async isHoliday(date: Date): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('holidays')
      .select('id')
      .eq('date', dateString)
      .limit(1)

    if (error) {
      throw new Error(`Failed to check holiday: ${error.message}`)
    }

    return data.length > 0
  }

  private static mapToHoliday(row: HolidayRow): Holiday {
    return {
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      isNationalHoliday: row.is_national_holiday || false,
      isRecurring: row.is_recurring || false,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
    }
  }
}

type HolidayTeamRow = Database['public']['Tables']['holiday_teams']['Row']
type HolidayTeamInsert = Database['public']['Tables']['holiday_teams']['Insert']
type HolidayTeamUpdate = Database['public']['Tables']['holiday_teams']['Update']

export class HolidayTeamService {
  static async getAll(): Promise<HolidayTeam[]> {
    const { data, error } = await supabase
      .from('holiday_teams')
      .select('*')
      .order('team_name')

    if (error) {
      throw new Error(`Failed to fetch holiday teams: ${error.message}`)
    }

    return data.map(this.mapToHolidayTeam)
  }

  static async create(team: Omit<HolidayTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<HolidayTeam> {
    const teamData: HolidayTeamInsert = {
      team_name: team.teamName,
      works_on_holidays: team.worksOnHolidays,
      holiday_pay_rate: team.holidayPayRate
    }

    const { data, error } = await supabase
      .from('holiday_teams')
      .insert(teamData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create holiday team: ${error.message}`)
    }

    return this.mapToHolidayTeam(data)
  }

  static async update(id: number, updates: Partial<HolidayTeam>): Promise<HolidayTeam> {
    const teamData: HolidayTeamUpdate = {}
    
    if (updates.teamName !== undefined) teamData.team_name = updates.teamName
    if (updates.worksOnHolidays !== undefined) teamData.works_on_holidays = updates.worksOnHolidays
    if (updates.holidayPayRate !== undefined) teamData.holiday_pay_rate = updates.holidayPayRate

    const { data, error } = await supabase
      .from('holiday_teams')
      .update(teamData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update holiday team: ${error.message}`)
    }

    return this.mapToHolidayTeam(data)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('holiday_teams')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete holiday team: ${error.message}`)
    }
  }

  static async getTeamsThatWorkOnHolidays(): Promise<string[]> {
    const { data, error } = await supabase
      .from('holiday_teams')
      .select('team_name')
      .eq('works_on_holidays', true)

    if (error) {
      throw new Error(`Failed to fetch working holiday teams: ${error.message}`)
    }

    return data.map(row => row.team_name)
  }

  private static mapToHolidayTeam(row: HolidayTeamRow): HolidayTeam {
    return {
      id: row.id,
      teamName: row.team_name,
      worksOnHolidays: row.works_on_holidays || false,
      holidayPayRate: Number(row.holiday_pay_rate) || 1.25,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
    }
  }
}