export interface JapaneseHoliday {
  date: Date
  name: string
  isNationalHoliday: boolean
}

export class JapaneseHolidaysAPI {
  static async fetchHolidays(year?: number): Promise<JapaneseHoliday[]> {
    try {
      const response = await fetch('/api/holidays/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch holidays: ${response.statusText}`)
      }

      const holidays = await response.json()
      return holidays.map((holiday: any) => ({
        ...holiday,
        date: new Date(holiday.date)
      }))
    } catch (error) {
      console.error('Error fetching Japanese holidays:', error)
      throw error
    }
  }

  static filterByYear(holidays: JapaneseHoliday[], year: number): JapaneseHoliday[] {
    return holidays.filter(holiday => holiday.date.getFullYear() === year)
  }

  static getHolidayName(holidays: JapaneseHoliday[], date: Date): string | null {
    const dateStr = date.toISOString().split('T')[0]
    const holiday = holidays.find(h => 
      h.date.toISOString().split('T')[0] === dateStr
    )
    return holiday ? holiday.name : null
  }

  static isHoliday(holidays: JapaneseHoliday[], date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]
    return holidays.some(h => 
      h.date.toISOString().split('T')[0] === dateStr
    )
  }
}