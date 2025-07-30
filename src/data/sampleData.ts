import { Vehicle, Driver, PerformanceMetrics, MaintenanceReport, FinancialReport, VacationRequest, VacationQuota, VacationSettings, MonthlyVacationStats, VacationNotification, VehicleAssignmentChange, DriverVehicleNotification, VehicleInoperativePeriod, VehicleInoperativeNotification } from '@/types'

// 車両データ（空）
export const initialVehicles: Vehicle[] = []

// ドライバーデータ（空）
export const initialDrivers: Driver[] = []

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
    '配送センターチーム': 2,  // 配送センターチームは1日最大2人まで
    '常駐チーム': 2,  // 常駐チームは1日最大2人まで
    'Bチーム': 1     // Bチームは1日最大1人まで
  }
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