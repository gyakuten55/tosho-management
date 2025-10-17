# 東翔運輸管理システム 技術仕様書

## 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [システム機能](#システム機能)
4. [データベース設計](#データベース設計)
5. [認証・セキュリティ](#認証セキュリティ)
6. [アーキテクチャ](#アーキテクチャ)
7. [API設計](#api設計)
8. [UI/UX設計](#uiux設計)
9. [運用要件](#運用要件)
10. [開発環境](#開発環境)

## システム概要

### プロジェクト名
東翔運輸管理システム (tokyorikuso-management-system)

### システムの目的
東翔運輸株式会社向けの総合運輸管理システム。車両、ドライバー、勤務状態、車検・点検、出庫時間を統合的に管理し、業務効率化を図る。

### 主要機能
- 車両管理（車両情報、車検管理、車庫管理）
- ドライバー管理（社員情報、勤務状態、車両割当）
- 休暇・勤務状態管理（申請、上限設定、統計）
- 車両点検予約システム
- 出庫時間記録・管理
- 通知システム
- 認証・権限管理

### 対象ユーザー
- **管理者**: 全機能へのアクセス権限を持つ管理職
- **ドライバー**: 自身の情報閲覧・更新権限を持つ運転手

## 技術スタック

### フロントエンド
- **Next.js**: 15.3.4
- **React**: 18.x
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.4.1
- **Lucide React**: 0.263.1 (アイコン)
- **date-fns**: 2.30.0 (日付操作)
- **Papa Parse**: 5.5.3 (CSV処理)

### バックエンド・データベース
- **Supabase**: PostgreSQL 17.4.1
- **@supabase/supabase-js**: 2.55.0
- **bcryptjs**: 3.0.2 (パスワード暗号化)

### 開発・ビルドツール
- **Node.js**: 22.x
- **ESLint**: 8.x
- **PostCSS**: 8.x
- **ts-node**: 10.9.2

### UI/UXライブラリ
- **@headlessui/react**: 1.7.17 (アクセシブルUI)
- **clsx**: 2.0.0 (条件付きクラス)

### 外部API連携
- **内閣府祝日API**: https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv
- **iconv-lite**: 7.0.0 (文字エンコーディング変換)

## システム機能

### 1. 車両管理機能

#### 車両情報管理
- **車両登録**: 車両番号、車種、年式、チーム、車庫情報
- **車両編集**: 既存車両情報の更新
- **車両削除**: 不要車両の削除
- **車両検索**: 車両番号、車種、ドライバー名、車庫での検索

#### 車検・点検管理
- **車検日管理**: 車検基準日から次回車検日を自動計算（3ヶ月ごと）
- **クレーン年次点検**: クレーン車両の年次点検管理
- **点検アラート**: 期限7日前（緊急）、30日前（警告）の通知
- **点検予約**: 点検業者への予約管理

#### 車両ステータス管理
- **稼働状態**: 正常、点検中、修理中、点検期限
- **車庫管理**: 車両の保管場所管理
- **ドライバー割当**: 車両への運転手割り当て

### 2. ドライバー管理機能

#### 社員情報管理
- **基本情報**: 社員番号、氏名、チーム、連絡先
- **免許情報**: 免許番号、免許区分、有効期限
- **緊急連絡先**: 緊急時連絡先情報
- **雇用情報**: 入社日、生年月日

#### 勤務状態管理
- **勤務ステータス**: 出勤、休暇、病欠、利用可能、夜勤
- **車両割当**: 担当車両の管理
- **夜勤フラグ**: 夜勤勤務の管理
- **外注管理**: 配送センター外注ドライバーの区別

#### 認証機能
- **パスワード認証**: bcryptハッシュ化によるセキュアな認証
- **ロール管理**: 管理者とドライバーの権限分離

### 3. 休暇・勤務状態管理機能

#### 休暇申請システム
- **勤務状態設定**: 出勤、休暇、夜勤の3つの状態
- **単日申請**: 1日単位での勤務状態申請
- **特記事項**: 各申請への備考追加
- **申請履歴**: 過去の申請履歴管理

#### 休暇上限管理
- **基本設定**: 月最低休暇日数（デフォルト9日）
- **特定日付設定**: 特定日のチーム別上限人数
- **月別曜日設定**: 月+曜日の組み合わせでの上限
- **期間設定**: 特定期間での休暇制限
- **チーム別制限**: チーム単位での同時休暇者数制限

#### 統計・レポート機能
- **月別統計**: ドライバー別の月間休暇取得状況
- **チーム統計**: チーム別の休暇取得傾向
- **カレンダー表示**: 月間カレンダーでの休暇状況可視化
- **CSV出力**: 統計データのCSVエクスポート

#### 祝日連携
- **自動取得**: 内閣府CSVデータからの祝日自動取得
- **文字コード変換**: Shift-JISからUTF-8への変換処理
- **祝日表示**: カレンダーでの祝日ハイライト

### 4. 点検予約システム

#### 予約管理
- **予約登録**: 車両、日程、点検種別の予約
- **予約状況**: 予定、完了、キャンセルのステータス管理
- **デッドライン管理**: 点検期限の管理
- **メモ機能**: 予約への備考追加

#### 通知機能
- **予約完了通知**: ドライバーへの予約完了通知
- **期限通知**: 点検期限近接時の自動通知
- **ステータス更新**: 点検状況の自動更新

### 5. 出庫時間管理機能

#### 出庫記録
- **時間記録**: ドライバー別の出庫時間記録
- **車両情報**: 使用車両の記録
- **備考機能**: 出庫時の特記事項
- **履歴管理**: 過去の出庫記録管理

#### 統計・分析
- **日別統計**: 日別の出庫時間分析
- **ドライバー別分析**: 個人の出庫パターン分析
- **CSV出力**: 出庫データのエクスポート
- **ソート機能**: 日付、時間、ドライバー別ソート

### 6. 通知システム

#### ドライバー通知
- **車検通知**: 車検期限の事前通知
- **予約通知**: 点検予約の完了通知
- **車両割当通知**: 車両変更時の通知
- **スケジュール変更**: 勤務スケジュール変更通知
- **緊急通知**: 緊急時の一斉通知

#### 通知管理
- **優先度設定**: 低、中、高、緊急の4段階
- **既読管理**: 通知の既読/未読状態
- **アクション要求**: 対応が必要な通知の区別
- **予約配信**: 指定日時での通知配信

### 7. 車両稼働管理

#### 一時的車両割当
- **期間限定割当**: 一時的な車両変更
- **元ドライバー復元**: 期間終了時の自動復元
- **履歴管理**: 割当変更の履歴記録
- **通知連携**: 変更時の関係者通知

#### 稼働不可期間管理
- **不稼働期間**: 修理、メンテナンスでの稼働停止期間
- **代替車両**: 一時的な代替車両割当
- **ステータス管理**: 稼働停止理由の管理

## データベース設計

### ERD概要
システムは5つの主要テーブルで構成され、Supabase PostgreSQL上で動作する。

### テーブル設計

#### 1. vacation_requests（休暇申請）
```sql
CREATE TABLE vacation_requests (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    driver_name TEXT NOT NULL,
    team TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    date DATE NOT NULL,
    work_status TEXT NOT NULL CHECK (work_status IN ('working', 'day_off', 'night_shift')),
    type TEXT NOT NULL CHECK (type IN ('day_off', 'night_shift', 'working')),
    special_note TEXT,
    is_off BOOLEAN DEFAULT false,
    reason TEXT DEFAULT '',
    status TEXT DEFAULT 'approved' CHECK (status = 'approved'),
    request_date TIMESTAMPTZ DEFAULT now(),
    is_external_driver BOOLEAN DEFAULT false,
    has_special_note BOOLEAN DEFAULT false,
    registered_by TEXT DEFAULT 'admin' CHECK (registered_by IN ('driver', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**主要フィールド説明:**
- `work_status`: 勤務状態（出勤、休暇、夜勤）
- `is_external_driver`: 配送センター外注フラグ
- `has_special_note`: 特記事項存在フラグ
- `registered_by`: 登録者（管理者・ドライバー区別）

#### 2. driver_notifications（ドライバー通知）
```sql
CREATE TABLE driver_notifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    driver_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vehicle_inspection', 'inspection_reserved', 'vehicle_assignment', 'schedule_change', 'emergency', 'vacation_status', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    action_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**通知タイプ:**
- `vehicle_inspection`: 車検通知
- `inspection_reserved`: 予約完了通知
- `vehicle_assignment`: 車両割当通知
- `schedule_change`: スケジュール変更
- `emergency`: 緊急通知
- `vacation_status`: 休暇状況通知
- `general`: 一般通知

#### 3. inspection_reservations（点検予約）
```sql
CREATE TABLE inspection_reservations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    vehicle_plate_number TEXT NOT NULL,
    driver_id INTEGER,
    driver_name TEXT,
    scheduled_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    memo TEXT,
    inspection_type TEXT DEFAULT '定期点検',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    reserved_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. departure_times（出庫時間）
```sql
CREATE TABLE departure_times (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    driver_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    vehicle_id INTEGER,
    vehicle_plate_number TEXT,
    departure_date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. temporary_assignments（一時的車両割当）
```sql
CREATE TABLE temporary_assignments (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    driver_name TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    plate_number TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    original_driver_name VARCHAR
);
```

### インデックス戦略
- 日付での検索頻度が高いため、date フィールドにインデックス
- ドライバーIDでの検索のため、driver_id フィールドにインデックス
- 複合検索のため、(driver_id, date) の複合インデックス

### データ整合性
- CHECK制約による値の検証
- NOT NULL制約による必須フィールドの保証
- DEFAULT値による初期値設定
- TIMESTAMPTZ型による正確な時刻管理

## 認証・セキュリティ

### 認証システム

#### 認証方式
- **管理者**: 固定アカウント (admin@tosho-management.com / admin12345)
- **ドライバー**: driversテーブルでのパスワード認証

#### パスワードセキュリティ
```typescript
// bcryptjsによるハッシュ化
import bcrypt from 'bcryptjs'

const saltRounds = 10
const hashedPassword = await bcrypt.hash(password, saltRounds)
const isValid = await bcrypt.compare(password, hashedPassword)
```

#### セッション管理
- **ストレージ**: localStorage（クライアントサイド）
- **セッション持続**: ブラウザ閉じるまで
- **自動ログアウト**: 明示的なログアウトのみ

### 権限管理

#### ロールベース権限
```typescript
interface UserProfile {
  uid: string
  employeeId: string
  displayName: string
  role: 'admin' | 'driver'
  team: string
}
```

#### 機能別アクセス権限
- **管理者**: 全機能へのフルアクセス
- **ドライバー**: 閲覧権限 + 自身の情報更新権限

### セキュリティ対策

#### Supabaseセキュリティ設定
```typescript
// キャッシュ無効化設定
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate',
      'pragma': 'no-cache',
      'expires': '0'
    }
  },
  auth: {
    persistSession: false  // セッション永続化無効
  }
})
```

#### 環境変数管理
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
```

## アーキテクチャ

### システム構成

#### フロントエンド構成
```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # メインページ
│   ├── layout.tsx      # レイアウト
│   └── api/            # API Routes
├── components/         # React コンポーネント
├── services/          # ビジネスロジック
├── contexts/          # React Context
├── hooks/             # カスタムフック
├── types/             # TypeScript型定義
├── utils/             # ユーティリティ関数
└── lib/               # ライブラリ設定
```

#### コンポーネント設計パターン

**1. プレゼンテーション・コンテナパターン**
```typescript
// Container Component
export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  // ビジネスロジック

  return <VehicleList vehicles={vehicles} onEdit={handleEdit} />
}

// Presentation Component
interface VehicleListProps {
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
}

export function VehicleList({ vehicles, onEdit }: VehicleListProps) {
  // UIロジックのみ
}
```

**2. サービス層パターン**
```typescript
export class VehicleService {
  static async getAll(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')

    if (error) throw new Error(error.message)
    return data.map(this.mapToVehicle)
  }

  private static mapToVehicle(row: VehicleRow): Vehicle {
    // データマッピングロジック
  }
}
```

#### 状態管理

**React Context Pattern**
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  const signIn = async (employeeId: string, password: string) => {
    // 認証ロジック
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### データフロー

#### 1. 認証フロー
```
Login Page → AuthContext → DriverService.authenticate() → Supabase → User Profile
```

#### 2. データ取得フロー
```
Component → Service Layer → Supabase → Data Mapping → State Update → UI Render
```

#### 3. CRUD操作フロー
```
User Action → Event Handler → Service Method → Supabase → Success/Error Handling → UI Update
```

### エラーハンドリング

#### サービス層エラーハンドリング
```typescript
try {
  const { data, error } = await supabase.from('table').select('*')
  if (error) throw new Error(`Database error: ${error.message}`)
  return data
} catch (dbError) {
  console.error('Service error:', dbError)
  throw dbError
}
```

#### UI層エラーハンドリング
```typescript
const [error, setError] = useState<string | null>(null)

const handleOperation = async () => {
  try {
    setError(null)
    await someService.operation()
  } catch (err) {
    setError('操作に失敗しました')
    console.error(err)
  }
}
```

## API設計

### 内部API（Service Layer）

#### RESTful API パターン
```typescript
// CRUD操作の標準インターフェース
interface ServiceInterface<T> {
  getAll(): Promise<T[]>
  getById(id: number): Promise<T | null>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: number, data: Partial<T>): Promise<T>
  delete(id: number): Promise<void>
}
```

#### 特殊検索メソッド
```typescript
class VacationService {
  static async getByDateRange(startDate: Date, endDate: Date): Promise<VacationRequest[]>
  static async getByDriverAndMonth(driverId: number, year: number, month: number): Promise<VacationRequest[]>
  static async getOffRequestsByDate(date: Date): Promise<VacationRequest[]>
}
```

### 外部API連携

#### 祝日データAPI
```typescript
// /src/app/api/holidays/fetch/route.ts
export async function POST(request: NextRequest) {
  const { year } = await request.json()

  // 内閣府CSVデータ取得
  const csvUrl = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv'
  const response = await fetch(csvUrl)

  // Shift-JIS → UTF-8 変換
  const buffer = Buffer.from(await response.arrayBuffer())
  const csvText = iconv.decode(buffer, 'shift-jis')

  // CSV解析とレスポンス
  const holidays = parseCSV(csvText)
  return NextResponse.json(holidays)
}
```

### データ変換・バリデーション

#### 日付処理ユーティリティ
```typescript
export const formatDateForDB = (date: Date): string => {
  return date.toISOString().split('T')[0]  // YYYY-MM-DD
}

export const parseDBDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00.000Z')
}
```

#### TypeScript型安全性
```typescript
// Supabase生成型との型マッピング
type VacationRequestRow = Database['public']['Tables']['vacation_requests']['Row']
type VacationRequestInsert = Database['public']['Tables']['vacation_requests']['Insert']

// ドメインモデルへの変換
private static mapToVacationRequest(row: VacationRequestRow): VacationRequest {
  return {
    id: row.id,
    driverId: row.driver_id,
    date: parseDBDate(row.date),
    workStatus: row.work_status as VacationRequest['workStatus']
  }
}
```

## UI/UX設計

### デザインシステム

#### カラーパレット
```css
/* Tailwind CSS設定 */
:root {
  --primary-50: #eff6ff;
  --primary-600: #2563eb;
  --primary-900: #1e3a8a;
  --gray-50: #f9fafb;
  --gray-900: #111827;
}
```

#### コンポーネントライブラリ
- **Headless UI**: アクセシブルなベースコンポーネント
- **Lucide React**: 一貫性のあるアイコンセット
- **Tailwind CSS**: ユーティリティファーストのスタイリング

### レスポンシブデザイン

#### ブレークポイント戦略
```css
/* Tailwindデフォルト */
sm: 640px   /* スマートフォン横 */
md: 768px   /* タブレット */
lg: 1024px  /* デスクトップ */
xl: 1280px  /* 大画面 */
```

#### モバイルファースト設計
```jsx
<div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
  {/* モバイル: 縦積み、デスクトップ: 横並び */}
</div>
```

### アクセシビリティ

#### セマンティックHTML
```jsx
<main className="flex-1 overflow-auto">
  <nav aria-label="メインナビゲーション">
    <button aria-expanded={isOpen} aria-controls="menu">
      メニュー
    </button>
  </nav>
</main>
```

#### キーボードナビゲーション
```typescript
// ESCキーでモーダル閉じる
const useEscapeKey = (callback: () => void) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callback()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [callback])
}
```

### ユーザーエクスペリエンス

#### ローディング状態
```jsx
{loading ? (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    <p className="mt-4 text-gray-600">読み込み中...</p>
  </div>
) : (
  <ContentComponent />
)}
```

#### エラー表示
```jsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <AlertTriangle className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    </div>
  </div>
)}
```

#### 成功フィードバック
```jsx
const [showSuccess, setShowSuccess] = useState(false)

const handleSave = async () => {
  try {
    await saveData()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  } catch (error) {
    // エラーハンドリング
  }
}
```

## 運用要件

### 必要環境

#### Node.js環境
```json
{
  "engines": {
    "node": "22.x"
  }
}
```

#### Supabaseプロジェクト
- **プロジェクトID**: jifdsnasdrtnafqgzkvw
- **リージョン**: ap-northeast-1
- **PostgreSQL**: 17.4.1

### 環境変数設定

#### 必須環境変数
```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://jifdsnasdrtnafqgzkvw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### ビルド・デプロイ

#### ビルドコマンド
```bash
# 開発環境
npm run dev

# 本番ビルド
npm run build
npm run start

# 静的エクスポート
npm run export
```

#### Supabaseデータベース設定
```sql
-- RLS (Row Level Security) 設定
ALTER TABLE vacation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE departure_times DISABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_assignments ENABLE ROW LEVEL SECURITY;
```

### 運用監視

#### データベース監視ポイント
- テーブルサイズの増加傾向
- インデックス使用率
- 長時間実行クエリの検出

#### アプリケーション監視
- ページ読み込み時間
- API レスポンス時間
- エラー発生率

### バックアップ戦略

#### Supabaseバックアップ
- 自動バックアップ: 日次
- 手動バックアップ: 重要な変更前
- 復旧手順: Supabaseコンソールから実行

## 開発環境

### 環境構築手順

#### 1. 前提条件
```bash
node --version  # v22.x
npm --version   # v10.x
```

#### 2. プロジェクトセットアップ
```bash
git clone <repository_url>
cd tosho-management
npm install
```

#### 3. 環境変数設定
```bash
cp .env.example .env.local
# .env.localにSupabase認証情報を設定
```

#### 4. 開発サーバー起動
```bash
npm run dev
# http://localhost:3000 でアクセス
```

### 開発ガイドライン

#### コードスタイル
```bash
# ESLintチェック
npm run lint

# TypeScriptチェック
npm run type-check
```

#### ファイル構成規則
```
src/
├── components/     # Reactコンポーネント（UpperCamelCase）
├── services/      # ビジネスロジック（UpperCamelCase）
├── types/         # 型定義（camelCase）
├── utils/         # ユーティリティ（camelCase）
└── hooks/         # カスタムフック（use + PascalCase）
```

#### 命名規則
- **コンポーネント**: PascalCase (VehicleManagement)
- **関数・変数**: camelCase (getUserData)
- **定数**: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
- **ファイル**: kebab-case またはPascalCase

### デバッグ・トラブルシューティング

#### よくある問題

**1. Supabase接続エラー**
```typescript
// コンソール確認
console.log('Supabase client initialized:', {
  url: supabaseUrl,
  keyPresent: !!supabaseKey
})

// 接続テスト
const { data, error } = await supabase.from('vacation_requests').select('count', { count: 'exact', head: true })
```

**2. 認証問題**
```typescript
// ローカルストレージ確認
console.log('Stored user:', localStorage.getItem('currentUser'))

// 認証状態リセット
localStorage.removeItem('currentUser')
```

**3. 日付関連問題**
```typescript
// タイムゾーン確認
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)

// 日付フォーマット確認
console.log('Date format:', formatDateForDB(new Date()))
```

### テスト戦略

#### 単体テスト
```bash
# テストフレームワーク（未実装）
npm test
```

#### 統合テスト
- Supabaseデータベース接続テスト
- 認証フローテスト
- CRUD操作テスト

#### E2Eテスト
- ユーザーログインフロー
- 休暇申請フロー
- 車両管理フロー

## まとめ

東翔運輸管理システムは、Next.js + Supabase を基盤とした現代的なWebアプリケーションです。TypeScriptによる型安全性、React + Tailwind CSSによる効率的なUI開発、Supabase PostgreSQLによるリアルタイムデータ管理を実現しています。

システムは運輸業界特有の要件（車検管理、運転手管理、勤務状態管理）を満たしながら、拡張性とメンテナンス性を両立した設計となっています。セキュリティ、パフォーマンス、ユーザビリティの各面でベストプラクティスを採用し、実運用に耐える品質を確保しています。

---

*最終更新: 2025年9月22日*