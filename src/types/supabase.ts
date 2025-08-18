export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          assigned_vehicle: string | null
          created_at: string
          employee_id: string
          id: number
          is_night_shift: boolean | null
          name: string
          status: string
          team: string
          updated_at: string
        }
        Insert: {
          assigned_vehicle?: string | null
          created_at?: string
          employee_id: string
          id?: number
          is_night_shift?: boolean | null
          name: string
          status?: string
          team: string
          updated_at?: string
        }
        Update: {
          assigned_vehicle?: string | null
          created_at?: string
          employee_id?: string
          id?: number
          is_night_shift?: boolean | null
          name?: string
          status?: string
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_schedules: {
        Row: {
          created_at: string
          date: string
          driver: string | null
          has_annual_crane_inspection: boolean | null
          id: number
          is_reservation_completed: boolean | null
          memo: string | null
          status: string
          team: string
          type: string
          updated_at: string
          vehicle_id: number
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          date: string
          driver?: string | null
          has_annual_crane_inspection?: boolean | null
          id?: number
          is_reservation_completed?: boolean | null
          memo?: string | null
          status?: string
          team: string
          type: string
          updated_at?: string
          vehicle_id: number
          vehicle_number: string
        }
        Update: {
          created_at?: string
          date?: string
          driver?: string | null
          has_annual_crane_inspection?: boolean | null
          id?: number
          is_reservation_completed?: boolean | null
          memo?: string | null
          status?: string
          team?: string
          type?: string
          updated_at?: string
          vehicle_id?: number
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          created_at: string
          display_name: string
          employee_id: string
          id: string
          last_login: string | null
          role: string
          team: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          employee_id: string
          id: string
          last_login?: string | null
          role: string
          team: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          employee_id?: string
          id?: string
          last_login?: string | null
          role?: string
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      vacation_notifications: {
        Row: {
          created_at: string
          date: string
          driver_id: number
          driver_name: string
          id: number
          is_read: boolean | null
          message: string
          priority: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          driver_id: number
          driver_name: string
          id?: number
          is_read?: boolean | null
          message: string
          priority?: string
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          driver_id?: number
          driver_name?: string
          id?: number
          is_read?: boolean | null
          message?: string
          priority?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_requests: {
        Row: {
          created_at: string
          date: string
          driver_id: number
          driver_name: string
          employee_id: string
          id: number
          is_external_driver: boolean
          is_off: boolean
          reason: string | null
          request_date: string
          status: string
          team: string
          type: string
          updated_at: string
          work_status: string
        }
        Insert: {
          created_at?: string
          date: string
          driver_id: number
          driver_name: string
          employee_id: string
          id?: number
          is_external_driver?: boolean
          is_off?: boolean
          reason?: string | null
          request_date: string
          status?: string
          team: string
          type: string
          updated_at?: string
          work_status: string
        }
        Update: {
          created_at?: string
          date?: string
          driver_id?: number
          driver_name?: string
          employee_id?: string
          id?: number
          is_external_driver?: boolean
          is_off?: boolean
          reason?: string | null
          request_date?: string
          status?: string
          team?: string
          type?: string
          updated_at?: string
          work_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_settings: {
        Row: {
          created_at: string
          id: number
          maximum_off_days_per_month: number
          minimum_off_days_per_month: number
          notification_date: number
          settings_data: Json
          specific_date_limits: Json
          team_monthly_weekday_limits: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          maximum_off_days_per_month?: number
          minimum_off_days_per_month?: number
          notification_date?: number
          settings_data?: Json
          specific_date_limits?: Json
          team_monthly_weekday_limits?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          maximum_off_days_per_month?: number
          minimum_off_days_per_month?: number
          notification_date?: number
          settings_data?: Json
          specific_date_limits?: Json
          team_monthly_weekday_limits?: Json
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          driver_name: string | null
          garage: string
          id: number
          inspection_date: string
          model: string
          notes: string | null
          plate_number: string
          status: string
          team: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          garage: string
          id?: number
          inspection_date: string
          model: string
          notes?: string | null
          plate_number: string
          status?: string
          team: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          garage?: string
          id?: number
          inspection_date?: string
          model?: string
          notes?: string | null
          plate_number?: string
          status?: string
          team?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const