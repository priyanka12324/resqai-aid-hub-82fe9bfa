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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      facilities: {
        Row: {
          amenities: string[]
          beds_available: number
          capacity: number
          code: string
          contact: string | null
          created_at: string
          icu_available: number
          id: string
          kind: Database["public"]["Enums"]["facility_kind"]
          lat: number
          lng: number
          location_name: string
          name: string
          occupied: number
          status: string
          triage_load: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          beds_available?: number
          capacity?: number
          code: string
          contact?: string | null
          created_at?: string
          icu_available?: number
          id?: string
          kind: Database["public"]["Enums"]["facility_kind"]
          lat: number
          lng: number
          location_name: string
          name: string
          occupied?: number
          status?: string
          triage_load?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          beds_available?: number
          capacity?: number
          code?: string
          contact?: string | null
          created_at?: string
          icu_available?: number
          id?: string
          kind?: Database["public"]["Enums"]["facility_kind"]
          lat?: number
          lng?: number
          location_name?: string
          name?: string
          occupied?: number
          status?: string
          triage_load?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          ai_actions: string[]
          ai_affected_area: string | null
          ai_confidence: number
          ai_hazards: string[]
          ai_priority_score: number
          ai_recommended_action: string | null
          ai_risk_level: string | null
          ai_simulated: boolean
          ai_summary: string | null
          code: string
          created_at: string
          description: string
          district: string
          id: string
          image_url: string | null
          immediate_danger: string
          lat: number
          lng: number
          location_name: string
          people_affected: number
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          type: Database["public"]["Enums"]["disaster_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_actions?: string[]
          ai_affected_area?: string | null
          ai_confidence?: number
          ai_hazards?: string[]
          ai_priority_score?: number
          ai_recommended_action?: string | null
          ai_risk_level?: string | null
          ai_simulated?: boolean
          ai_summary?: string | null
          code?: string
          created_at?: string
          description: string
          district?: string
          id?: string
          image_url?: string | null
          immediate_danger?: string
          lat: number
          lng: number
          location_name: string
          people_affected?: number
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          type: Database["public"]["Enums"]["disaster_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_actions?: string[]
          ai_affected_area?: string | null
          ai_confidence?: number
          ai_hazards?: string[]
          ai_priority_score?: number
          ai_recommended_action?: string | null
          ai_risk_level?: string | null
          ai_simulated?: boolean
          ai_summary?: string | null
          code?: string
          created_at?: string
          description?: string
          district?: string
          id?: string
          image_url?: string | null
          immediate_danger?: string
          lat?: number
          lng?: number
          location_name?: string
          people_affected?: number
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          type?: Database["public"]["Enums"]["disaster_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          accuracy_m: number | null
          created_at: string
          emergency_type: string
          id: string
          lat: number | null
          lng: number | null
          message: string | null
          status: Database["public"]["Enums"]["sos_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          emergency_type: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          emergency_type?: string
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_operator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "citizen" | "responder" | "admin"
      disaster_type: "flood" | "earthquake" | "landslide" | "fire" | "cyclone"
      facility_kind: "shelter" | "relief-camp" | "hospital"
      report_status: "new" | "verified" | "dispatched" | "resolved"
      severity_level: "critical" | "high" | "moderate" | "low"
      sos_status: "pending" | "acknowledged" | "dispatched" | "resolved"
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
    Enums: {
      app_role: ["citizen", "responder", "admin"],
      disaster_type: ["flood", "earthquake", "landslide", "fire", "cyclone"],
      facility_kind: ["shelter", "relief-camp", "hospital"],
      report_status: ["new", "verified", "dispatched", "resolved"],
      severity_level: ["critical", "high", "moderate", "low"],
      sos_status: ["pending", "acknowledged", "dispatched", "resolved"],
    },
  },
} as const
