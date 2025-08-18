import { supabase } from '@/lib/supabase'
import { Holiday, HolidayTeam } from '@/types'

export class HolidayService {
  static async getAll(): Promise<Holiday[]> {
    // Mock data for holidays until database table is created
    return [
      {
        id: 1,
        name: '元日',
        date: new Date('2025-01-01'),
        isNationalHoliday: true,
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'こどもの日',
        date: new Date('2025-05-05'),
        isNationalHoliday: true,
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  static async getByYear(year: number): Promise<Holiday[]> {
    const allHolidays = await this.getAll()
    return allHolidays.filter(holiday => holiday.date.getFullYear() === year)
  }

  static async create(holiday: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<Holiday> {
    // Mock implementation - would normally save to database
    const newHoliday: Holiday = {
      id: Math.floor(Math.random() * 1000),
      ...holiday,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return newHoliday
  }

  static async update(id: number, updates: Partial<Holiday>): Promise<Holiday> {
    // Mock implementation - would normally update in database
    const existingHolidays = await this.getAll()
    const holiday = existingHolidays.find(h => h.id === id)
    if (!holiday) {
      throw new Error('Holiday not found')
    }
    
    return {
      ...holiday,
      ...updates,
      updatedAt: new Date()
    }
  }

  static async delete(id: number): Promise<void> {
    // Mock implementation - would normally delete from database
    console.log(`Holiday ${id} deleted`)
  }

  static async isHoliday(date: Date): Promise<boolean> {
    const holidays = await this.getAll()
    return holidays.some(holiday => 
      holiday.date.toDateString() === date.toDateString()
    )
  }
}

export class HolidayTeamService {
  static async getAll(): Promise<HolidayTeam[]> {
    // Mock data for holiday teams until database table is created
    return [
      {
        id: 1,
        teamName: 'Aチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        teamName: 'Bチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        teamName: 'Cチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        teamName: 'Dチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        teamName: 'Eチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        teamName: 'Fチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        teamName: 'Gチーム',
        worksOnHolidays: true,
        holidayPayRate: 1.5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  static async update(id: number, updates: Partial<HolidayTeam>): Promise<HolidayTeam> {
    // Mock implementation - would normally update in database
    const teams = await this.getAll()
    const team = teams.find(t => t.id === id)
    if (!team) {
      throw new Error('Holiday team not found')
    }
    
    return {
      ...team,
      ...updates,
      updatedAt: new Date()
    }
  }

  static async getTeamsThatWorkOnHolidays(): Promise<string[]> {
    const teams = await this.getAll()
    return teams
      .filter(team => team.worksOnHolidays)
      .map(team => team.teamName)
  }
}