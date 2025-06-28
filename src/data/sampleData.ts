import { Vehicle, Driver, PerformanceMetrics, MaintenanceReport, FinancialReport, VacationRequest, VacationQuota, VacationSettings, MonthlyVacationStats, VacationNotification, VehicleAssignmentChange, DriverVehicleNotification } from '@/types'

export const initialVehicles: Vehicle[] = [
  {
    id: 1,
    plateNumber: '品川 501 あ 1234',
    type: '回送車',
    model: 'トヨタ ハイエース',
    year: 2022,
    driver: '田中太郎',
    team: 'Aチーム',
    status: 'active',
    lastInspection: new Date('2024-12-01'),
    nextInspection: new Date('2025-06-01'),
    garage: '本社車庫',
    notes: '定期点検済み'
  },
  {
    id: 2,
    plateNumber: '品川 502 い 5678',
    type: '積載車',
    model: 'いすゞ エルフ',
    year: 2021,
    driver: '佐藤花子',
    team: 'Bチーム',
    status: 'inspection',
    lastInspection: new Date('2024-11-15'),
    nextInspection: new Date('2025-01-25'),
    garage: '西車庫',
    notes: '明日点検予定'
  },
  {
    id: 3,
    plateNumber: '品川 503 う 9012',
    type: '回送車',
    model: 'ニッサン NV200',
    year: 2020,
    driver: '鈴木一郎',
    team: 'Aチーム',
    status: 'repair',
    lastInspection: new Date('2024-10-20'),
    nextInspection: new Date('2025-04-20'),
    garage: '東車庫',
    notes: 'エンジン修理中'
  },
  {
    id: 4,
    plateNumber: '品川 504 え 3456',
    type: '積載車',
    model: 'いすゞ フォワード',
    year: 2023,
    team: 'Bチーム',
    status: 'active',
    lastInspection: new Date('2024-12-10'),
    nextInspection: new Date('2025-12-10'),
    garage: '本社車庫',
    notes: '新車'
  },
  {
    id: 5,
    plateNumber: '品川 505 か 7890',
    type: '回送車',
    model: 'トヨタ プロボックス',
    year: 2019,
    driver: '高橋二郎',
    team: 'Bチーム',
    status: 'repair',
    lastInspection: new Date('2024-09-15'),
    nextInspection: new Date('2025-03-15'),
    garage: '西車庫',
    notes: 'エンジントラブル発生'
  },
  {
    id: 6,
    plateNumber: '品川 506 か 1111',
    type: '回送車',
    model: 'トヨタ ハイエース',
    year: 2023,
    driver: '山田花子',
    team: 'Aチーム',
    status: 'active',
    lastInspection: new Date('2024-11-01'),
    nextInspection: new Date('2025-02-15'),
    garage: '東車庫',
    notes: '点検予定まで1ヶ月切り'
  }
]

export const initialDrivers: Driver[] = [
  {
    id: 1,
    name: '田中太郎',
    team: 'Aチーム',
    employeeId: '001001',
    status: 'working',
    assignedVehicle: '品川 501 あ 1234'
  },
  {
    id: 2,
    name: '佐藤花子',
    team: 'Bチーム',
    employeeId: '002001',
    status: 'working',
    assignedVehicle: '品川 502 い 5678'
  },
  {
    id: 3,
    name: '鈴木一郎',
    team: 'Aチーム',
    employeeId: '001002',
    status: 'vacation',
    assignedVehicle: '品川 503 う 9012'
  },
  {
    id: 4,
    name: '高橋二郎',
    team: 'Bチーム',
    employeeId: '002002',
    status: 'working',
    assignedVehicle: '品川 505 か 7890'
  },
  {
    id: 5,
    name: '山田三郎',
    team: 'Aチーム',
    employeeId: '001003',
    status: 'available'
  },
  {
    id: 6,
    name: '伊藤四郎',
    team: 'Bチーム',
    employeeId: '002003',
    status: 'available'
  },
  {
    id: 7,
    name: '山田花子',
    team: 'Aチーム',
    employeeId: '001004',
    status: 'working',
    assignedVehicle: '品川 506 か 1111'
  },
  // 外部ドライバー
  {
    id: 8,
    name: '外部太郎',
    team: 'Aチーム',
    employeeId: 'E001',
    status: 'available'
  },
  {
    id: 9,
    name: '外部花子',
    team: 'Bチーム',
    employeeId: 'E002',
    status: 'available'
  },
  {
    id: 10,
    name: '外部次郎',
    team: 'Aチーム',
    employeeId: 'E003',
    status: 'working'
  },
  {
    id: 11,
    name: '外部三郎',
    team: 'Bチーム',
    employeeId: 'E004',
    status: 'available'
  }
]

// レポートサンプルデータ
export const samplePerformanceMetrics: PerformanceMetrics = {
  period: '2024年12月',
  totalJobs: 156,
  completedJobs: 145,
  cancelledJobs: 8,
  urgentJobs: 23,
  completionRate: 93.0,
  onTimeRate: 89.7,
  averageJobDuration: 4.2,
  totalRevenue: 12450000,
  averageRevenuePerJob: 79808,
  teamPerformance: {
    'Aチーム': {
      jobs: 78,
      completion: 94.9,
      revenue: 6240000
    },
    'Bチーム': {
      jobs: 78,
      completion: 91.0,
      revenue: 6210000
    }
  },
  driverPerformance: {
    '1': { name: '田中太郎', jobs: 28, completion: 96.4, onTime: 92.9, rating: 4.8 },
    '2': { name: '佐藤花子', jobs: 26, completion: 88.5, onTime: 84.6, rating: 4.3 },
    '3': { name: '鈴木一郎', jobs: 24, completion: 95.8, onTime: 91.7, rating: 4.7 },
    '4': { name: '高橋二郎', jobs: 30, completion: 90.0, onTime: 86.7, rating: 4.4 },
    '5': { name: '山田三郎', jobs: 25, completion: 92.0, onTime: 88.0, rating: 4.5 },
    '6': { name: '伊藤四郎', jobs: 23, completion: 91.3, onTime: 87.0, rating: 4.2 }
  },
  vehicleUtilization: {
    '1': { plateNumber: '品川 501 あ 1234', utilizationRate: 87.5, maintenanceDays: 2, mileage: 45000 },
    '2': { plateNumber: '品川 502 い 5678', utilizationRate: 82.3, maintenanceDays: 4, mileage: 62000 },
    '3': { plateNumber: '品川 503 う 9012', utilizationRate: 75.1, maintenanceDays: 6, mileage: 78000 },
    '4': { plateNumber: '品川 504 え 3456', utilizationRate: 91.2, maintenanceDays: 1, mileage: 25000 },
    '5': { plateNumber: '品川 505 か 7890', utilizationRate: 68.9, maintenanceDays: 8, mileage: 92000 }
  }
}

export const sampleMaintenanceReport: MaintenanceReport = {
  period: '2024年12月',
  totalInspections: 45,
  completedInspections: 38,
  overdueInspections: 3,
  maintenanceCost: 1850000,
  downtime: 127,
  vehicleStatus: {
    active: 3,
    maintenance: 1,
    inspection: 1,
    breakdown: 0
  },
  upcomingInspections: 12,
  maintenanceByType: {
    '定期点検': { count: 18, cost: 720000, averageDuration: 2.5 },
    '車検': { count: 8, cost: 560000, averageDuration: 4.0 },
    '故障修理': { count: 12, cost: 450000, averageDuration: 3.2 },
    'オイル交換': { count: 7, cost: 120000, averageDuration: 0.5 }
  }
}

export const sampleFinancialReport: FinancialReport = {
  period: '2024年12月',
  totalRevenue: 12450000,
  totalCost: 8975000,
  netProfit: 3475000,
  profitMargin: 27.9,
  revenueByTeam: {
    'Aチーム': 6240000,
    'Bチーム': 6210000
  },
  revenueByServiceType: {
    '中古車回送': 4680000,
    'レンタカー回送': 3120000,
    '建設機械運送': 2850000,
    'オークション車両': 1800000
  },
  costBreakdown: {
    fuel: 2690000,
    maintenance: 1850000,
    labor: 3200000,
    insurance: 850000,
    other: 385000
  },
  monthlyTrend: [
    { month: '2024-08', revenue: 11200000, cost: 8100000, profit: 3100000 },
    { month: '2024-09', revenue: 11800000, cost: 8450000, profit: 3350000 },
    { month: '2024-10', revenue: 12100000, cost: 8750000, profit: 3350000 },
    { month: '2024-11', revenue: 12300000, cost: 8900000, profit: 3400000 },
    { month: '2024-12', revenue: 12450000, cost: 8975000, profit: 3475000 }
  ]
}

// 新しい休暇申請サンプルデータ（東翔運輸仕様）
export const initialVacationRequests: VacationRequest[] = [
  {
    id: 1,
    driverId: 1,
    driverName: '田中太郎',
    team: 'Aチーム',
    employeeId: '001001',
    date: new Date('2025-01-15'),
    isOff: true,
    requestedAt: new Date('2025-01-10'),
    isExternalDriver: false
  },
  {
    id: 2,
    driverId: 2,
    driverName: '佐藤花子',
    team: 'Bチーム',
    employeeId: '002001',
    date: new Date('2025-01-16'),
    isOff: true,
    requestedAt: new Date('2025-01-12'),
    isExternalDriver: false
  },
  {
    id: 3,
    driverId: 1,
    driverName: '田中太郎',
    team: 'Aチーム',
    employeeId: '001001',
    date: new Date('2025-01-22'),
    isOff: true,
    requestedAt: new Date('2025-01-18'),
    isExternalDriver: false
  }
]

// 月別休暇統計サンプルデータ
export const initialMonthlyVacationStats: MonthlyVacationStats[] = [
  {
    driverId: 1,
    driverName: '田中太郎',
    team: 'Aチーム',
    employeeId: '001001',
    year: 2025,
    month: 1,
    totalOffDays: 8,
    requiredMinimumDays: 9,
    remainingRequiredDays: 1,
    maxAllowedDays: 12
  },
  {
    driverId: 2,
    driverName: '佐藤花子',
    team: 'Bチーム',
    employeeId: '002001',
    year: 2025,
    month: 1,
    totalOffDays: 5,
    requiredMinimumDays: 9,
    remainingRequiredDays: 4,
    maxAllowedDays: 12
  }
]

// 休暇設定サンプルデータ（東翔運輸仕様）
export const initialVacationSettings: VacationSettings = {
  minimumOffDaysPerMonth: 9,
  maximumOffDaysPerMonth: 12,
  notificationDate: 25,
  maxDriversOffPerDay: {
    'Aチーム': 2,
    'Bチーム': 2
  },
  globalMaxDriversOffPerDay: 3,  // 全体で1日最大3人まで休暇可能
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
  ]
}

// 通知サンプルデータ
export const initialVacationNotifications: VacationNotification[] = [
  {
    id: 1,
    driverId: 2,
    driverName: '佐藤花子',
    team: 'Bチーム',
    type: 'insufficient_vacation',
    message: '1月の休暇申請が不足しています。あと4日休暇を申請してください。',
    targetMonth: '2025-01',
    remainingDays: 4,
    sentAt: new Date('2025-01-25'),
    isRead: false,
    pushNotificationSent: true
  }
]

export const initialVacationQuotas: VacationQuota[] = [
  {
    id: 1,
    driverId: 1,
    year: 2025,
    totalDays: 20,
    usedDays: 5,
    remainingDays: 15,
    carryOverDays: 2
  },
  {
    id: 2,
    driverId: 2,
    year: 2025,
    totalDays: 18,
    usedDays: 3,
    remainingDays: 15,
    carryOverDays: 0
  },
  {
    id: 3,
    driverId: 3,
    year: 2025,
    totalDays: 20,
    usedDays: 4,
    remainingDays: 16,
    carryOverDays: 1
  },
  {
    id: 4,
    driverId: 4,
    year: 2025,
    totalDays: 15,
    usedDays: 2,
    remainingDays: 13,
    carryOverDays: 0
  }
]

// 車両割り当て変更履歴サンプルデータ
export const initialVehicleAssignmentChanges: VehicleAssignmentChange[] = [
  {
    id: 1,
    vehicleId: 1,
    plateNumber: '品川 501 あ 1234',
    date: new Date('2025-01-15'),
    originalDriverId: 1,
    originalDriverName: '田中太郎',
    newDriverId: 5,
    newDriverName: '山田三郎',
    reason: '田中太郎の休暇に伴う一時的な変更',
    createdAt: new Date('2025-01-14'),
    createdBy: '管理者',
    isTemporary: true,
    endDate: new Date('2025-01-15')
  },
  {
    id: 2,
    vehicleId: 3,
    plateNumber: '品川 503 う 9012',
    date: new Date('2025-01-10'),
    originalDriverId: 3,
    originalDriverName: '鈴木一郎',
    newDriverId: 6,
    newDriverName: '伊藤四郎',
    reason: '車両修理完了に伴う恒久的な割り当て変更',
    createdAt: new Date('2025-01-09'),
    createdBy: '管理者',
    isTemporary: false
  }
]

// ドライバー車両通知サンプルデータ
export const initialDriverVehicleNotifications: DriverVehicleNotification[] = [
  {
    id: 1,
    driverId: 5,
    driverName: '山田三郎',
    type: 'vehicle_assignment',
    vehicleId: 1,
    plateNumber: '品川 501 あ 1234',
    assignmentDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-15'),
    message: '車両 品川 501 あ 1234 が 2025年01月15日 から一時的に割り当てられました。理由: 田中太郎の休暇に伴う一時的な変更',
    isRead: false,
    sentAt: new Date('2025-01-14'),
    priority: 'medium'
  },
  {
    id: 2,
    driverId: 6,
    driverName: '伊藤四郎',
    type: 'vehicle_assignment',
    vehicleId: 3,
    plateNumber: '品川 503 う 9012',
    assignmentDate: new Date('2025-01-10'),
    message: '車両 品川 503 う 9012 が 2025年01月10日 から恒久的に割り当てられました。理由: 車両修理完了に伴う恒久的な割り当て変更',
    isRead: true,
    sentAt: new Date('2025-01-09'),
    priority: 'high'
  },
  {
    id: 3,
    driverId: 1,
    driverName: '田中太郎',
    type: 'vehicle_return',
    vehicleId: 1,
    plateNumber: '品川 501 あ 1234',
    assignmentDate: new Date('2025-01-16'),
    message: '車両 品川 501 あ 1234 が休暇終了に伴い 2025年01月16日 から再度割り当てられました。',
    isRead: false,
    sentAt: new Date('2025-01-15'),
    priority: 'medium'
  }
] 