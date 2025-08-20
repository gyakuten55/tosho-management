export interface Vehicle {
  id: number
  plateNumber: string // 車両番号（6桁程度）
  model: string
  year: number
  driver?: string
  team: string
  status: 'normal' | 'inspection' | 'repair' | 'maintenance_due' | 'breakdown' // 正常 | 点検中 | 修理中 | 点検期限
  inspectionDate: Date // 点検日（3ヶ月ごとの点検基準日、車検・クレーン年次点検も含む）
  garage: string // 車庫情報
  notes?: string
}

export interface Driver {
  id: number
  name: string
  team: string
  employeeId: string
  status: 'working' | 'vacation' | 'sick' | 'available' | 'night_shift'
  assignedVehicle?: string
  isNightShift?: boolean
  password?: string  // ログイン用パスワード（ハッシュ化済み）
  phone?: string
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  licenseNumber?: string
  licenseClass?: string
  licenseExpiryDate?: Date
  hireDate?: Date
  birthDate?: Date
  notes?: string
  holidayTeams?: string[]  // 祝日チーム（複数選択可）
}

export interface Holiday {
  id: number
  name: string
  date: Date
  isNationalHoliday: boolean
  isRecurring: boolean
  createdAt: Date
  updatedAt: Date
}

export interface HolidayTeam {
  id: number
  teamName: string
  worksOnHolidays: boolean
  holidayPayRate: number
  createdAt: Date
  updatedAt: Date
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
  isReservationCompleted?: boolean  // 予約完了フラグ
  memo?: string  // メモ
  hasAnnualCraneInspection?: boolean  // クレーン年次点検フラグ
}

// 勤務状態管理システムの型定義（東翔運輸仕様）
export interface VacationRequest {
  id: number
  driverId: number
  driverName: string
  team: string
  employeeId: string
  date: Date  // 単日のみ（開始日・終了日は廃止）
  workStatus: 'working' | 'day_off' | 'night_shift'  // 勤務状態（出勤、休暇、夜勤）
  isOff: boolean  // 休みかどうか（workStatus === 'day_off'）
  type: 'day_off' | 'night_shift' | 'working'  // 勤務タイプ
  reason: string  // 理由（使用しないが互換性のため保持）
  status: 'approved'  // 承認機能なしなので常に承認済み
  requestDate: Date  // 申請日
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

// 期間設定の型定義
export interface PeriodLimit {
  id: string                      // 期間識別子
  name: string                    // 期間名（例: "夏期休暇期間"）
  startDate: string              // 開始日（MM-DD形式）
  endDate: string                // 終了日（MM-DD形式）
  limit: number                  // その期間の上限人数
  description?: string           // 説明文
  isActive: boolean              // 有効/無効フラグ
}

// 休暇上限設定の優先順位
export enum VacationLimitPriority {
  SPECIFIC_DATE = 1,       // 特定日付設定 (最優先)
  MONTHLY_WEEKLY = 2,      // 月+曜日組み合わせ設定
  PERIOD = 3,              // 期間設定
  MONTHLY = 4,             // 月別設定  
  WEEKLY = 5,              // 曜日設定
  GLOBAL_DEFAULT = 6       // 基本設定 (最下位)
}

// 月別曜日上限設定の型定義
export interface MonthlyWeekdayLimits {
  [month: number]: {  // 月（1-12）
    [weekday: number]: number  // 曜日（0-6）ごとの上限人数
  }
}

// 新しい統一された休暇設定インターフェース
export interface VacationSettings {
  minimumOffDaysPerMonth: number  // 月の最低休暇日数（デフォルト9日）
  maximumOffDaysPerMonth: number  // 月の最大休暇日数
  notificationDate: number  // 通知日（月の何日に通知するか、デフォルト25日）
  
  // 統一された休暇上限設定
  teamMonthlyWeekdayLimits: TeamMonthlyWeekdayLimits  // チーム別月別曜日上限設定
  specificDateLimits: { [dateString: string]: number }  // 特定日付設定（YYYY-MM-DD形式）
  
  // 後方互換性のために残しておく（削除予定）
  blackoutDates: Date[]  // 休暇取得不可日
  holidayDates: Date[]  // 祝日
  maxDriversOffPerDay: { [teamName: string]: number }  // チーム別の1日の最大休暇者数
  globalMaxDriversOffPerDay: number  // 全体の1日の最大休暇者数
  monthlyWeekdayLimits: MonthlyWeekdayLimits  // 月別曜日上限設定
  periodLimits: PeriodLimit[]  // 期間設定
  monthlyLimits: { [month: number]: number }  // 月別上限設定
  weeklyLimits: { [weekday: number]: number }  // 曜日別上限設定
}

// チーム別月別曜日上限設定の型定義
export interface TeamMonthlyWeekdayLimits {
  [teamName: string]: {  // チーム名
    [month: number]: {   // 月（1-12）
      [weekday: number]: number  // 曜日（0-6）ごとの上限人数
    }
  }
}

// 休暇上限計算結果
export interface VacationLimitResult {
  limit: number                    // 適用される上限人数
  appliedRule: VacationLimitPriority  // 適用されたルールの優先順位
  ruleName: string                // 適用されたルール名
  ruleDetails: string            // ルールの詳細説明
}

export interface VacationNotification {
  id: number
  driverId: number
  driverName: string
  type: 'vacation_reminder' | 'blackout_date' | 'schedule_change'
  message: string
  date: Date
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
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
  type: 'vehicle_inspection' | 'inspection_reserved' | 'vehicle_assignment' | 'schedule_change' | 'emergency' | 'vacation_status' | 'general'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  scheduledFor?: Date
  actionRequired: boolean
  actionUrl?: string
}

// 点検予約の型定義
export interface InspectionReservation {
  id: number
  vehicleId: number
  vehiclePlateNumber: string
  driverId?: number
  driverName?: string
  inspectionType: string
  scheduledDate: Date
  deadlineDate: Date
  status: 'scheduled' | 'completed' | 'cancelled'
  memo?: string
  reservedBy: string
  createdAt: Date
  updatedAt: Date
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
  inspectionVehicles: {
    vehicleId: number
    plateNumber: string
    inspectionType: string
    model: string
    driver?: string
    team: string
  }[]
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
  totalInspectionCount: number
}

// 配車スケジュール管理システムの型定義
export interface DispatchSchedule {
  id: number
  driverId: number
  vehicleId: number
  driverName: string
  vehicleNumber: string
  date: Date
  timeSlot: {
    start: string
    end: string
  }
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  team: string
  route: {
    origin: string
    destination: string
    waypoints?: string[]
  }
  clientInfo?: {
    name: string
    contact?: string
    notes?: string
  }
  cargoInfo?: {
    type: string
    count: number
    notes?: string
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface VehicleSwap {
  id: number
  originalVehicleId: number
  newVehicleId: number
  status: 'pending' | 'approved' | 'completed'
  swapTime: Date
  reason: string
  approvedBy?: string
}

// 車両稼働不可期間管理の型定義
export interface VehicleInoperativePeriod {
  id: number
  vehicleId: number
  plateNumber: string
  startDate: Date
  endDate: Date
  reason: string
  type: 'repair' | 'maintenance' | 'breakdown' | 'other'
  originalDriverId?: number
  originalDriverName?: string
  tempAssignmentDriverId?: number  // 一時的に別車両に割り当てられたドライバー
  tempAssignmentVehicleId?: number  // 一時的に割り当てられた車両
  status: 'active' | 'completed' | 'cancelled'
  createdAt: Date
  createdBy: string
  notes?: string
}

// 車両稼働不可通知の型定義
export interface VehicleInoperativeNotification {
  id: number
  vehicleInoperativePeriodId: number
  driverId: number
  driverName: string
  vehicleId: number
  plateNumber: string
  type: 'period_start' | 'period_end' | 'temp_assignment' | 'return_assignment'
  message: string
  startDate: Date
  endDate?: Date
  tempVehicleInfo?: {
    vehicleId: number
    plateNumber: string
  }
  isRead: boolean
  sentAt: Date
  priority: 'low' | 'medium' | 'high'
}

// 車検通知用
export interface VehicleInspectionNotification {
  id: number
  vehicleId: number
  plateNumber: string
  inspectionType: 'vehicle_inspection'  // 車検
  inspectionDate: Date
  notificationDate: Date  // 通知日（3ヶ月前）
  isRead: boolean
  priority: 'high'
  message: string
}

// 1日途中での車両乗り換え記録（履歴は保存しない）
export interface DailyVehicleSwap {
  id: number
  driverId: number
  driverName: string
  originalVehicleId: number
  originalPlateNumber: string
  newVehicleId: number
  newPlateNumber: string
  swapTime: Date
  reason: string
  status: 'active' | 'completed'
}

 