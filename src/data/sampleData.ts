import { Vehicle, Driver, PerformanceMetrics, MaintenanceReport, FinancialReport, VacationRequest, VacationQuota, VacationSettings, MonthlyVacationStats, VacationNotification, VehicleAssignmentChange, DriverVehicleNotification, VehicleInoperativePeriod, VehicleInoperativeNotification } from '@/types'

// 車両データ（テスト用）
export const initialVehicles: Vehicle[] = [
  {
    id: 1,
    plateNumber: '品川 500 あ 1234',
    model: 'トヨタ ハイエース',
    year: 2023,
    driver: '田中太郎',
    team: '配送センターチーム',
    status: 'normal',
    inspectionDate: new Date('2025-08-15'), // 来月中旬に点検期限
    garage: '本社車庫',
    notes: ''
  },
  {
    id: 2,
    plateNumber: '品川 500 あ 5678',
    model: 'いすゞ エルフクレーン',
    year: 2022,
    driver: '佐藤次郎',
    team: '常駐チーム',
    status: 'normal',
    inspectionDate: new Date('2025-09-20'), // 翌々月に点検期限
    garage: '東車庫',
    notes: ''
  },
  {
    id: 3,
    plateNumber: '品川 500 あ 9012',
    model: '日産 キャラバン',
    year: 2021,
    driver: undefined,
    team: 'Bチーム',
    status: 'normal',
    inspectionDate: new Date('2025-08-05'), // 来月初旬に点検期限
    garage: '西車庫',
    notes: ''
  }
]

// ドライバーデータ（テスト用）
export const initialDrivers: Driver[] = [
  {
    id: 1,
    name: '田中太郎',
    employeeId: 'D001',
    team: '配送センターチーム',
    status: 'working',
    assignedVehicle: '品川 500 あ 1234'
  },
  {
    id: 2,
    name: '佐藤次郎',
    employeeId: 'D002',
    team: '常駐チーム',
    status: 'working',
    assignedVehicle: '品川 500 あ 5678'
  },
  {
    id: 3,
    name: '鈴木三郎',
    employeeId: 'D003',
    team: 'Bチーム',
    status: 'available',
    assignedVehicle: undefined
  }
]

// レポートサンプルデータ（空）
export const samplePerformanceMetrics: PerformanceMetrics = {
  period: '',
  totalJobs: 0,
  completedJobs: 0,
  cancelledJobs: 0,
  urgentJobs: 0,
  completionRate: 0,
  onTimeRate: 0,
  averageJobDuration: 0,
  totalRevenue: 0,
  averageRevenuePerJob: 0,
  teamPerformance: {},
  driverPerformance: {},
  vehicleUtilization: {}
}

export const sampleMaintenanceReport: MaintenanceReport = {
  period: '',
  totalInspections: 0,
  completedInspections: 0,
  overdueInspections: 0,
  maintenanceCost: 0,
  downtime: 0,
  vehicleStatus: {
    active: 0,
    maintenance: 0,
    inspection: 0,
    breakdown: 0
  },
  upcomingInspections: 0,
  maintenanceByType: {}
}

export const sampleFinancialReport: FinancialReport = {
  period: '',
  totalRevenue: 0,
  totalCost: 0,
  netProfit: 0,
  profitMargin: 0,
  revenueByTeam: {},
  revenueByServiceType: {},
  costBreakdown: {
    fuel: 0,
    maintenance: 0,
    labor: 0,
    insurance: 0,
    other: 0
  },
  monthlyTrend: []
}

// 休暇申請データ（空）
export const initialVacationRequests: VacationRequest[] = []

// 月別休暇統計データ（空）
export const initialMonthlyVacationStats: MonthlyVacationStats[] = []

// 休暇設定データ（システム動作に必要なため維持）
export const initialVacationSettings: VacationSettings = {
  minimumOffDaysPerMonth: 9,
  maximumOffDaysPerMonth: 12,
  notificationDate: 25,
  
  // 新しい統一された休暇上限設定
  teamMonthlyWeekdayLimits: {
    '配送センターチーム': {
      1: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 1月
      2: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 2月
      3: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 3月
      4: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 4月
      5: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 5月
      6: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 6月
      7: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 7月（夏期繁忙期）
      8: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 8月（夏期繁忙期）
      9: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 9月
      10: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 }, // 10月
      11: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 }, // 11月
      12: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }  // 12月（年末繁忙期）
    },
    '常駐チーム': {
      1: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 1月
      2: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 2月
      3: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 3月
      4: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 4月
      5: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 5月
      6: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 6月
      7: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },  // 7月（夏期繁忙期）
      8: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },  // 8月（夏期繁忙期）
      9: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 9月
      10: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 }, // 10月
      11: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 }, // 11月
      12: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }  // 12月（年末繁忙期）
    },
    'Bチーム': {
      1: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 1月
      2: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 2月
      3: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 3月
      4: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 4月
      5: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 5月
      6: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 6月
      7: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 7月（夏期繁忙期）
      8: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1 },  // 8月（夏期繁忙期）
      9: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },  // 9月
      10: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 }, // 10月
      11: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 }, // 11月
      12: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }  // 12月（年末繁忙期）
    }
  },
  
  specificDateLimits: {},

  // 後方互換性のために残しておく（削除予定）
  blackoutDates: [
    new Date('2025-01-01'),  // 元日
    new Date('2025-12-31')   // 大晦日
  ],
  holidayDates: [
    new Date('2025-01-01'),  // 元日
    new Date('2025-01-13'),  // 成人の日
    new Date('2025-02-11'),  // 建国記念の日
    new Date('2025-03-20'),  // 春分の日
    new Date('2025-04-29'),  // 昭和の日
    new Date('2025-05-03'),  // 憲法記念日
    new Date('2025-05-04'),  // みどりの日
    new Date('2025-05-05'),  // こどもの日
    new Date('2025-07-21'),  // 海の日
    new Date('2025-08-11'),  // 山の日
    new Date('2025-09-15'),  // 敬老の日
    new Date('2025-09-23'),  // 秋分の日
    new Date('2025-10-13'),  // スポーツの日
    new Date('2025-11-03'),  // 文化の日
    new Date('2025-11-23'),  // 勤労感謝の日
  ],
  maxDriversOffPerDay: {
    '配送センターチーム': 2,
    '常駐チーム': 2,
    'Bチーム': 1
  },
  globalMaxDriversOffPerDay: 5,
  monthlyWeekdayLimits: {
    1: { 0: 4, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4 },
    2: { 0: 3, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 3 },
    3: { 0: 3, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3 },
    4: { 0: 4, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4 },
    5: { 0: 3, 1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 3 },
    6: { 0: 3, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 3 },
    7: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },
    8: { 0: 2, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2 },
    9: { 0: 4, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4 },
    10: { 0: 4, 1: 5, 2: 5, 3: 5, 4: 5, 5: 4, 6: 4 },
    11: { 0: 3, 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3 },
    12: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 2 }
  },
  periodLimits: [],
  monthlyLimits: {},
  weeklyLimits: {}
}

// 通知データ（空）
export const initialVacationNotifications: VacationNotification[] = []

// 休暇割当データ（空）
export const initialVacationQuotas: VacationQuota[] = []

// 車両割り当て変更履歴（空）
export const initialVehicleAssignmentChanges: VehicleAssignmentChange[] = []

// ドライバー車両通知データ（空）
export const initialDriverVehicleNotifications: DriverVehicleNotification[] = []

// 車両稼働不可期間データ（空）
export const initialVehicleInoperativePeriods: VehicleInoperativePeriod[] = []

// 車両稼働不可通知データ（空）
export const initialVehicleInoperativeNotifications: VehicleInoperativeNotification[] = [] 