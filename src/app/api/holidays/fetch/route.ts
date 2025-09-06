import { NextRequest, NextResponse } from 'next/server'
import { parse as parseCSV } from 'papaparse'
import * as iconv from 'iconv-lite'

interface JapaneseHoliday {
  date: Date
  name: string
  isNationalHoliday: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { year } = await request.json()
    
    // Fetch CSV directly from server-side
    const csvUrl = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv'
    const response = await fetch(csvUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get CSV data as buffer and convert from Shift-JIS to UTF-8
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const csvText = iconv.decode(buffer, 'shift-jis')

    // Parse CSV
    const holidays: JapaneseHoliday[] = []
    
    const parseResult = parseCSV(csvText, {
      header: false,
      skipEmptyLines: true,
    })

    // Skip header row and process data
    for (let i = 1; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as string[]
      if (row.length >= 2 && row[0] && row[1]) {
        const dateStr = row[0].trim()
        const name = row[1].trim()
        
        // Parse date (format: YYYY/MM/DD)
        const dateParts = dateStr.split('/')
        if (dateParts.length === 3) {
          const holidayYear = parseInt(dateParts[0], 10)
          const month = parseInt(dateParts[1], 10) - 1 // Month is 0-based
          const day = parseInt(dateParts[2], 10)
          
          const date = new Date(holidayYear, month, day)
          
          if (!isNaN(date.getTime())) {
            holidays.push({
              date,
              name,
              isNationalHoliday: true
            })
          }
        }
      }
    }
    
    // Filter by year if specified
    const filteredHolidays = year 
      ? holidays.filter(holiday => holiday.date.getFullYear() === year)
      : holidays

    // Convert dates to ISO strings for JSON serialization
    const serializedHolidays = filteredHolidays.map(holiday => ({
      ...holiday,
      date: holiday.date.toISOString().split('T')[0]
    }))

    return NextResponse.json(serializedHolidays)
  } catch (error) {
    console.error('Error in holidays API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch holidays', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}