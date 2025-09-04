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
      daily_vehicle_swaps: {
        Row: {
          created_at: string
          driver_id: number
          driver_name: string
          id: number
          new_plate_number: string
          new_vehicle_id: number
          original_plate_number: string
          original_vehicle_id: number
          reason: string
          status: string | null
          swap_time: string
        }
        Insert: {
          created_at?: string
          driver_id: number
          driver_name: string
          id?: number
          new_plate_number: string
          new_vehicle_id: number
          original_plate_number: string
          original_vehicle_id: number
          reason: string
          status?: string | null
          swap_time?: string
        }
        Update: {
          created_at?: string
          driver_id?: number
          driver_name?: string
          id?: number
          new_plate_number?: string
          new_vehicle_id?: number
          original_plate_number?: string
          original_vehicle_id?: number
          reason?: string
          status?: string | null
          swap_time?: string
        }
        Relationships: []
      }
      departure_times: {
        Row: {
          created_at: string
          departure_date: string
          departure_time: string
          driver_id: number
          driver_name: string
          employee_id: string
          id: number
          updated_at: string
          vehicle_id: number | null
          vehicle_plate_number: string | null
        }
        Insert: {
          created_at?: string
          departure_date: string
          departure_time: string
          driver_id: number
          driver_name: string
          employee_id: string
          id?: number
          updated_at?: string
          vehicle_id?: number | null
          vehicle_plate_number?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string
          departure_time?: string
          driver_id?: number
          driver_name?: string
          employee_id?: string
          id?: number
          updated_at?: string
          vehicle_id?: number | null
          vehicle_plate_number?: string | null
        }
        Relationships: []
      }
      dispatch_schedules: {
        Row: {
          cargo_count: number | null
          cargo_notes: string | null
          cargo_type: string | null
          client_contact: string | null
          client_name: string | null
          client_notes: string | null
          created_at: string
          date: string
          driver_id: number
          driver_name: string
          id: number
          notes: string | null
          priority: string | null
          route_destination: string
          route_origin: string
          route_waypoints: Json | null
          status: string | null
          team: string
          time_end: string
          time_start: string
          updated_at: string
          vehicle_id: number
          vehicle_number: string
        }
        Insert: {
          cargo_count?: number | null
          cargo_notes?: string | null
          cargo_type?: string | null
          client_contact?: string | null
          client_name?: string | null
          client_notes?: string | null
          created_at?: string
          date: string
          driver_id: number
          driver_name: string
          id?: number
          notes?: string | null
          priority?: string | null
          route_destination: string
          route_origin: string
          route_waypoints?: Json | null
          status?: string | null
          team: string
          time_end: string
          time_start: string
          updated_at?: string
          vehicle_id: number
          vehicle_number: string
        }
        Update: {
          cargo_count?: number | null
          cargo_notes?: string | null
          cargo_type?: string | null
          client_contact?: string | null
          client_name?: string | null
          client_notes?: string | null
          created_at?: string
          date?: string
          driver_id?: number
          driver_name?: string
          id?: number
          notes?: string | null
          priority?: string | null
          route_destination?: string
          route_origin?: string
          route_waypoints?: Json | null
          status?: string | null
          team?: string
          time_end?: string
          time_start?: string
          updated_at?: string
          vehicle_id?: number
          vehicle_number?: string
        }
        Relationships: []
      }
      driver_notifications: {
        Row: {
          action_required: boolean
          created_at: string | null
          driver_id: number
          driver_name: string
          employee_id: string
          id: number
          is_read: boolean
          message: string
          priority: string
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean
          created_at?: string | null
          driver_id: number
          driver_name?: string
          employee_id?: string
          id?: number
          is_read?: boolean
          message: string
          priority?: string
          scheduled_for?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean
          created_at?: string | null
          driver_id?: number
          driver_name?: string
          employee_id?: string
          id?: number
          is_read?: boolean
          message?: string
          priority?: string
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      driver_vehicle_notifications: {
        Row: {
          assignment_date: string
          created_at: string
          driver_id: number
          driver_name: string
          end_date: string | null
          id: number
          is_read: boolean | null
          message: string
          plate_number: string
          priority: string | null
          sent_at: string
          type: string
          updated_at: string
          vehicle_id: number
        }
        Insert: {
          assignment_date: string
          created_at?: string
          driver_id: number
          driver_name: string
          end_date?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          plate_number: string
          priority?: string | null
          sent_at?: string
          type: string
          updated_at?: string
          vehicle_id: number
        }
        Update: {
          assignment_date?: string
          created_at?: string
          driver_id?: number
          driver_name?: string
          end_date?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          plate_number?: string
          priority?: string | null
          sent_at?: string
          type?: string
          updated_at?: string
          vehicle_id?: number
        }
        Relationships: []
      }
      drivers: {
        Row: {
          address: string | null
          assigned_vehicle: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          hire_date: string | null
          holiday_teams: Json | null
          id: number
          is_night_shift: boolean | null
          license_class: string | null
          license_expiry_date: string | null
          license_number: string | null
          name: string
          notes: string | null
          password: string | null
          phone: string | null
          status: string
          team: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_vehicle?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          hire_date?: string | null
          holiday_teams?: Json | null
          id?: number
          is_night_shift?: boolean | null
          license_class?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          name: string
          notes?: string | null
          password?: string | null
          phone?: string | null
          status?: string
          team: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_vehicle?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          hire_date?: string | null
          holiday_teams?: Json | null
          id?: number
          is_night_shift?: boolean | null
          license_class?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          name?: string
          notes?: string | null
          password?: string | null
          phone?: string | null
          status?: string
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      holiday_teams: {
        Row: {
          created_at: string | null
          holiday_pay_rate: number | null
          id: number
          team_name: string
          updated_at: string | null
          works_on_holidays: boolean | null
        }
        Insert: {
          created_at?: string | null
          holiday_pay_rate?: number | null
          id?: number
          team_name: string
          updated_at?: string | null
          works_on_holidays?: boolean | null
        }
        Update: {
          created_at?: string | null
          holiday_pay_rate?: number | null
          id?: number
          team_name?: string
          updated_at?: string | null
          works_on_holidays?: boolean | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: number
          is_national_holiday: boolean | null
          is_recurring: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          is_national_holiday?: boolean | null
          is_recurring?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          is_national_holiday?: boolean | null
          is_recurring?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_reservations: {
        Row: {
          created_at: string | null
          deadline_date: string
          driver_id: number | null
          driver_name: string | null
          id: number
          inspection_type: string
          memo: string | null
          reserved_by: string
          scheduled_date: string
          status: string
          updated_at: string | null
          vehicle_id: number
          vehicle_plate_number: string
        }
        Insert: {
          created_at?: string | null
          deadline_date: string
          driver_id?: number | null
          driver_name?: string | null
          id?: number
          inspection_type?: string
          memo?: string | null
          reserved_by?: string
          scheduled_date: string
          status?: string
          updated_at?: string | null
          vehicle_id: number
          vehicle_plate_number: string
        }
        Update: {
          created_at?: string | null
          deadline_date?: string
          driver_id?: number | null
          driver_name?: string | null
          id?: number
          inspection_type?: string
          memo?: string | null
          reserved_by?: string
          scheduled_date?: string
          status?: string
          updated_at?: string | null
          vehicle_id?: number
          vehicle_plate_number?: string
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
      vehicle_assignment_changes: {
        Row: {
          created_at: string
          created_by: string
          date: string
          end_date: string | null
          id: number
          is_temporary: boolean | null
          new_driver_id: number
          new_driver_name: string
          original_driver_id: number
          original_driver_name: string
          plate_number: string
          reason: string
          updated_at: string
          vehicle_id: number
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          end_date?: string | null
          id?: number
          is_temporary?: boolean | null
          new_driver_id: number
          new_driver_name: string
          original_driver_id: number
          original_driver_name: string
          plate_number: string
          reason: string
          updated_at?: string
          vehicle_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          end_date?: string | null
          id?: number
          is_temporary?: boolean | null
          new_driver_id?: number
          new_driver_name?: string
          original_driver_id?: number
          original_driver_name?: string
          plate_number?: string
          reason?: string
          updated_at?: string
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignment_changes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inoperative_notifications: {
        Row: {
          created_at: string
          driver_id: number
          driver_name: string
          end_date: string | null
          id: number
          is_read: boolean | null
          message: string
          plate_number: string
          priority: string | null
          sent_at: string
          start_date: string
          temp_plate_number: string | null
          temp_vehicle_id: number | null
          type: string
          updated_at: string
          vehicle_id: number
          vehicle_inoperative_period_id: number
        }
        Insert: {
          created_at?: string
          driver_id: number
          driver_name: string
          end_date?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          plate_number: string
          priority?: string | null
          sent_at?: string
          start_date: string
          temp_plate_number?: string | null
          temp_vehicle_id?: number | null
          type: string
          updated_at?: string
          vehicle_id: number
          vehicle_inoperative_period_id: number
        }
        Update: {
          created_at?: string
          driver_id?: number
          driver_name?: string
          end_date?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          plate_number?: string
          priority?: string | null
          sent_at?: string
          start_date?: string
          temp_plate_number?: string | null
          temp_vehicle_id?: number | null
          type?: string
          updated_at?: string
          vehicle_id?: number
          vehicle_inoperative_period_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inoperative_notificat_vehicle_inoperative_period_i_fkey"
            columns: ["vehicle_inoperative_period_id"]
            isOneToOne: false
            referencedRelation: "vehicle_inoperative_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inoperative_periods: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: number
          notes: string | null
          original_driver_id: number | null
          original_driver_name: string | null
          plate_number: string
          reason: string
          start_date: string
          status: string | null
          temp_assignment_driver_id: number | null
          temp_assignment_vehicle_id: number | null
          type: string
          updated_at: string
          vehicle_id: number
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: number
          notes?: string | null
          original_driver_id?: number | null
          original_driver_name?: string | null
          plate_number: string
          reason: string
          start_date: string
          status?: string | null
          temp_assignment_driver_id?: number | null
          temp_assignment_vehicle_id?: number | null
          type: string
          updated_at?: string
          vehicle_id: number
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: number
          notes?: string | null
          original_driver_id?: number | null
          original_driver_name?: string | null
          plate_number?: string
          reason?: string
          start_date?: string
          status?: string | null
          temp_assignment_driver_id?: number | null
          temp_assignment_vehicle_id?: number | null
          type?: string
          updated_at?: string
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inoperative_periods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          driver_name: string | null
          garage: string
          id: number
          inspection_date: string
          crane_annual_inspection_date: string | null
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
          crane_annual_inspection_date?: string | null
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
          crane_annual_inspection_date?: string | null
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
      temporary_assignments: {
        Row: {
          id: number
          driver_id: number
          driver_name: string
          vehicle_id: number
          plate_number: string
          start_date: string
          end_date: string
          created_at: string
          created_by: string
          original_driver_name: string | null
        }
        Insert: {
          id?: number
          driver_id: number
          driver_name: string
          vehicle_id: number
          plate_number: string
          start_date: string
          end_date: string
          created_at?: string
          created_by?: string
          original_driver_name?: string | null
        }
        Update: {
          id?: number
          driver_id?: number
          driver_name?: string
          vehicle_id?: number
          plate_number?: string
          start_date?: string
          end_date?: string
          created_at?: string
          created_by?: string
          original_driver_name?: string | null
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