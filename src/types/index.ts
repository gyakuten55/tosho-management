export interface Vehicle {
  id: number
  plateNumber: string // 車両番号（6桁程度）
  type: string
  model: string
  year: number
  driver?: string
  team: string
  status: 'active' | 'inspection' | 'repair' // 稼働中 | 点検中 | 修理中
  lastInspection: Date
  nextInspection: Date
  garage: string // 車庫情報（新規追加）
  notes?: string
}

export interface Driver {
  id: number
  name: string
  team: string
  employeeId: string
  status: 'working' | 'vacation' | 'sick' | 'available'
  assignedVehicle?: string
}

export interface InspectionSchedule {
  id: number
  vehicleId: number
  vehicleNumber: string
  type: string
  date: Date
  status: 'urgent' | 'warning' | 'normal'
  driver?: string
  team: string
}

// 休暇管理システムの型定義（東翔運輸仕様）
export interface VacationRequest {
  id: number
  driverId: number
  driverName: string
  team: string
  employeeId: string
  date: Date  // 単日のみ（開始日・終了日は廃止）
  isOff: boolean  // 休みかどうか（true: 休み, false: 出勤）
  requestedAt: Date
  isExternalDriver: boolean  // 外部ドライバーかどうか
}

export interface MonthlyVacationStats {
  driverId: number
  driverName: string
  team: string
  employeeId: string  // 社員番号を追加
  year: number
  month: number
  totalOffDays: number  // その月の休暇日数
  requiredMinimumDays: number  // 月の最低必要休暇日数（9日）
  remainingRequiredDays: number  // 残り必要休暇日数
  maxAllowedDays: number  // 月の上限休暇日数
}

export interface VacationSettings {
  minimumOffDaysPerMonth: number  // 月の最低休暇日数（デフォルト9日）
  maximumOffDaysPerMonth: number  // 月の最大休暇日数
  notificationDate: number  // 通知日（月の何日に通知するか、デフォルト25日）
  maxDriversOffPerDay: {
    [team: string]: number  // チームごとの1日の最大休暇取得者数
  }
  globalMaxDriversOffPerDay: number  // 全体の1日最大休暇人数
  blackoutDates: Date[]  // 休暇取得不可日
  holidayDates: Date[]  // 祝日
}

export interface VacationNotification {
  id: number
  driverId: number
  driverName: string
  team: string
  type: 'insufficient_vacation' | 'vacation_reminder' | 'blackout_date'
  message: string
  targetMonth: string  // 'YYYY-MM'形式
  remainingDays: number
  sentAt: Date
  isRead: boolean
  pushNotificationSent: boolean  // スマホ通知送信済みかどうか
}

export interface DailyVacationInfo {
  date: Date
  vacations: {
    driverId: number
    driverName: string
    team: string
    isExternalDriver: boolean
  }[]
  totalOffCount: number
  internalDriverOffCount: number  // 正社員の休暇数
  externalDriverOffCount: number  // 外部ドライバーの休暇数
}

// 認証システムの型定義
export interface User {
  id: number
  employeeId: string
  name: string
  team: string
  role: 'admin' | 'driver'
  hashedPassword?: string
  isActive: boolean
  lastLogin?: Date
}

export interface AuthState {
  isAuthenticated: boolean
  user?: User
  token?: string
}

// 運転手専用通知の型定義
export interface DriverNotification {
  id: number
  driverId: number
  type: 'vehicle_inspection' | 'vehicle_swap' | 'schedule_change' | 'emergency' | 'vacation_status'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  scheduledFor?: Date
  actionRequired: boolean
  actionUrl?: string
}

// 運転手ダッシュボード用の型定義
export interface DriverDashboardData {
  assignedVehicle?: Vehicle
  upcomingInspections: InspectionSchedule[]
  pendingVacationRequests: VacationRequest[]
  notifications: DriverNotification[]
  vacationQuota?: VacationQuota
}

// パフォーマンス指標の型定義
export interface PerformanceMetrics {
  period: string
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  urgentJobs: number
  completionRate: number
  onTimeRate: number
  averageJobDuration: number
  totalRevenue: number
  averageRevenuePerJob: number
  teamPerformance: {
    [teamName: string]: {
      jobs: number
      completion: number
      revenue: number
    }
  }
  driverPerformance: {
    [driverId: string]: {
      name: string
      jobs: number
      completion: number
      onTime: number
      rating: number
    }
  }
  vehicleUtilization: {
    [vehicleId: string]: {
      plateNumber: string
      utilizationRate: number
      maintenanceDays: number
      mileage: number
    }
  }
}

// メンテナンスレポートの型定義
export interface MaintenanceReport {
  period: string
  totalInspections: number
  completedInspections: number
  overdueInspections: number
  maintenanceCost: number
  downtime: number
  vehicleStatus: {
    active: number
    maintenance: number
    inspection: number
    breakdown: number
  }
  upcomingInspections: number
  maintenanceByType: {
    [type: string]: {
      count: number
      cost: number
      averageDuration: number
    }
  }
}

// 財務レポートの型定義
export interface FinancialReport {
  period: string
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  revenueByTeam: {
    [teamName: string]: number
  }
  revenueByServiceType: {
    [serviceType: string]: number
  }
  costBreakdown: {
    fuel: number
    maintenance: number
    labor: number
    insurance: number
    other: number
  }
  monthlyTrend: Array<{
    month: string
    revenue: number
    cost: number
    profit: number
  }>
}

// 車両関連情報表示用の型定義
export interface VehicleInformation {
  vehicle: Vehicle
  upcomingInspections: InspectionSchedule[]
  recentMaintenanceHistory: MaintenanceReport[]
  currentDriver?: Driver
  nextDriverRotation?: {
    date: Date
    nextDriver: Driver
  }
}

export interface VacationQuota {
  id: number
  driverId: number
  year: number
  totalDays: number
  usedDays: number
  remainingDays: number
  carryOverDays: number
}

export interface VacationCalendar {
  date: Date
  requests: VacationRequest[]
  availableSlots: {
    [team: string]: number
  }
  isBlackout: boolean
  isHoliday: boolean
}

// 車両稼働管理システムの型定義
export interface VehicleOperationStatus {
  vehicleId: number
  plateNumber: string
  date: Date
  status: 'active' | 'inactive_vacation' | 'inactive_inspection' | 'inactive_repair' | 'reassigned'
  assignedDriverId?: number
  assignedDriverName?: string
  reason: string  // 未稼働の理由
  originalDriverId?: number  // 元のドライバー（割り当て変更の場合）
  originalDriverName?: string
}

export interface VehicleAssignmentChange {
  id: number
  vehicleId: number
  plateNumber: string
  date: Date
  originalDriverId: number
  originalDriverName: string
  newDriverId: number
  newDriverName: string
  reason: string
  createdAt: Date
  createdBy: string  // 管理者名
  isTemporary: boolean  // 一時的な変更かどうか
  endDate?: Date  // 一時的変更の場合の終了日
}

export interface DriverVehicleNotification {
  id: number
  driverId: number
  driverName: string
  type: 'vehicle_assignment' | 'vehicle_change' | 'vehicle_return'
  vehicleId: number
  plateNumber: string
  assignmentDate: Date
  endDate?: Date
  message: string
  isRead: boolean
  sentAt: Date
  priority: 'low' | 'medium' | 'high'
}

export interface VehicleOperationCalendarDay {
  date: Date
  vehicles: {
    vehicleId: number
    plateNumber: string
    status: 'active' | 'inactive_vacation' | 'inactive_inspection' | 'inactive_repair' | 'reassigned'
    assignedDriverName?: string
    reason?: string
    isTemporary?: boolean
  }[]
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
}

 