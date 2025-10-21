export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          id: string
          username: string
          role: Database["public"]["Enums"]["user_role"]
          logged_at: string
        }
        Insert: {
          id?: string
          username: string
          role: Database["public"]["Enums"]["user_role"]
          logged_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: Database["public"]["Enums"]["user_role"]
          logged_at?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          id: string
          username: string
          password: string
          full_name: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          full_name?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          full_name?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidate_data: {
        Row: {
          id: string
          nombre: string
          experiencia_medica_en: string | null
          experiencia_medica_no: string | null
          experiencia_no_medica_en: string | null
          experiencia_no_medica_no: string | null
          formacion_en: string | null
          formacion_no: string | null
          profesion_en: string | null
          profesion_no: string | null
          idiomas_en: string
          idiomas_no: string
          carta_resumen_en: string | null
          carta_en: string | null
          carta_resumen_no: string | null
          carta_no: string | null
          estado: string
          anio_nacimiento: number
          correo: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          experiencia_medica_en?: string | null
          experiencia_medica_no?: string | null
          experiencia_no_medica_en?: string | null
          experiencia_no_medica_no?: string | null
          formacion_en?: string | null
          formacion_no?: string | null
          profesion_en?: string | null
          profesion_no?: string | null
          idiomas_en?: string
          idiomas_no?: string
          carta_resumen_en?: string | null
          carta_en?: string | null
          carta_resumen_no?: string | null
          carta_no?: string | null
          estado?: string
          anio_nacimiento: number
          correo: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          experiencia_medica_en?: string | null
          experiencia_medica_no?: string | null
          experiencia_no_medica_en?: string | null
          experiencia_no_medica_no?: string | null
          formacion_en?: string | null
          formacion_no?: string | null
          profesion_en?: string | null
          profesion_no?: string | null
          idiomas_en?: string
          idiomas_no?: string
          carta_resumen_en?: string | null
          carta_en?: string | null
          carta_resumen_no?: string | null
          carta_no?: string | null
          estado?: string
          anio_nacimiento?: number
          correo?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidate_view_logs: {
        Row: {
          id: string
          employer_id: string
          employer_username: string
          candidate_id: string
          candidate_name: string
          viewed_at: string
        }
        Insert: {
          id?: string
          employer_id?: string
          employer_username: string
          candidate_id: string
          candidate_name: string
          viewed_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          employer_username?: string
          candidate_id?: string
          candidate_name?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_view_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_data"
            referencedColumns: ["id"]
          }
        ]
      }
      employer_interactions: {
        Row: {
          id: string
          employer_id: string
          employer_username: string
          interaction_type: string
          context: Json
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          employer_id?: string
          employer_username: string
          interaction_type: string
          context?: Json
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          employer_username?: string
          interaction_type?: string
          context?: Json
          occurred_at?: string
          created_at?: string
        }
        Relationships: []
      }
      employer_search_logs: {
        Row: {
          id: string
          employer_username: string
          query: string
          candidate_names: string[]
          searched_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_username: string
          query: string
          candidate_names?: string[]
          searched_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_username?: string
          query?: string
          candidate_names?: string[]
          searched_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_requests: {
        Row: {
          id: string
          employer_id: string
          employer_username: string
          employer_email: string
          employer_name: string | null
          candidate_id: string
          candidate_name: string
          candidate_email: string
          availability: string
          requested_at: string
        }
        Insert: {
          id?: string
          employer_id?: string
          employer_username: string
          employer_email: string
          employer_name?: string | null
          candidate_id: string
          candidate_name: string
          candidate_email: string
          availability: string
          requested_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          employer_username?: string
          employer_email?: string
          employer_name?: string | null
          candidate_id?: string
          candidate_name?: string
          candidate_email?: string
          availability?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_data"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_app_user: {
        Args: {
          p_username: string
          p_password: string
          p_full_name?: string | null
          p_email?: string | null
        }
        Returns: Database["public"]["Tables"]["app_users"]["Row"]
      }
      admin_list_access_logs: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["access_logs"]["Row"]
      }
      admin_list_app_users: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["app_users"]["Row"]
      }
      admin_list_candidate_view_logs: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["candidate_view_logs"]["Row"]
      }
      admin_list_employer_interactions: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["employer_interactions"]["Row"]
      }
      admin_list_employer_search_logs: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["employer_search_logs"]["Row"]
      }
      admin_list_schedule_requests: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["schedule_requests"]["Row"]
      }
      admin_toggle_app_user_status: {
        Args: {
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["app_users"]["Row"]
      }
      authenticate_app_user: {
        Args: {
          p_identifier: string
          p_password: string
        }
        Returns: Database["public"]["Tables"]["app_users"]["Row"] | null
      }
      log_employer_search: {
        Args: {
          p_employer_username: string
          p_query: string
          p_candidate_names?: string[] | null
        }
        Returns: Database["public"]["Tables"]["employer_search_logs"]["Row"]
      }
      log_employer_interaction: {
        Args: {
          p_employer_username: string
          p_interaction_type: string
          p_context?: Json | null
        }
        Returns: Database["public"]["Tables"]["employer_interactions"]["Row"]
      }
    }
    Enums: {
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Update"]

export type Enums<EnumName extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][EnumName]

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user"]
    }
  }
} as const
