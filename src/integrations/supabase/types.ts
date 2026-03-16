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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      job_alert_results: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          is_read: boolean
          is_saved: boolean
          job_data: Json
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          is_saved?: boolean
          job_data?: Json
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          is_saved?: boolean
          job_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_alert_results_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "job_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          created_at: string
          frequency: string
          id: string
          industries: string[] | null
          is_active: boolean
          keywords: string
          last_run_at: string | null
          location: string | null
          name: string
          resume_based: boolean
          resume_id: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: string[] | null
          sources: string[] | null
          updated_at: string
          user_id: string
          work_mode: string[] | null
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          industries?: string[] | null
          is_active?: boolean
          keywords: string
          last_run_at?: string | null
          location?: string | null
          name?: string
          resume_based?: boolean
          resume_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string[] | null
          sources?: string[] | null
          updated_at?: string
          user_id: string
          work_mode?: string[] | null
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          industries?: string[] | null
          is_active?: boolean
          keywords?: string
          last_run_at?: string | null
          location?: string | null
          name?: string
          resume_based?: boolean
          resume_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string[] | null
          sources?: string[] | null
          updated_at?: string
          user_id?: string
          work_mode?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_alerts_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "saved_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          is_public: boolean
          is_published: boolean
          og_image_url: string | null
          portfolio_data: Json
          published_at: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string | null
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          og_image_url?: string | null
          portfolio_data?: Json
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          template?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          og_image_url?: string | null
          portfolio_data?: Json
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiter_favorites: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          recruiter_data: Json
          recruiter_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_data?: Json
          recruiter_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_data?: Json
          recruiter_name?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          ats_analysis: Json | null
          content_analysis: Json | null
          created_at: string
          file_name: string
          file_size: number | null
          humanizer_analysis: Json | null
          id: string
          parsing_analysis: Json | null
          priorities: Json | null
          recruiter_analysis: Json | null
          red_flags: Json | null
          resume_id: string | null
          resume_text: string
          scores: Json
          strengths: Json | null
          structure_analysis: Json | null
          user_id: string | null
        }
        Insert: {
          ats_analysis?: Json | null
          content_analysis?: Json | null
          created_at?: string
          file_name: string
          file_size?: number | null
          humanizer_analysis?: Json | null
          id?: string
          parsing_analysis?: Json | null
          priorities?: Json | null
          recruiter_analysis?: Json | null
          red_flags?: Json | null
          resume_id?: string | null
          resume_text: string
          scores?: Json
          strengths?: Json | null
          structure_analysis?: Json | null
          user_id?: string | null
        }
        Update: {
          ats_analysis?: Json | null
          content_analysis?: Json | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          humanizer_analysis?: Json | null
          id?: string
          parsing_analysis?: Json | null
          priorities?: Json | null
          recruiter_analysis?: Json | null
          red_flags?: Json | null
          resume_id?: string | null
          resume_text?: string
          scores?: Json
          strengths?: Json | null
          structure_analysis?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "saved_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          application_deadline: string | null
          application_tips: string | null
          applied_at: string | null
          benefits: Json | null
          career_page_url: string | null
          company: string
          company_industry: string
          company_logo_letter: string | null
          company_size: string | null
          created_at: string
          employment_type: string | null
          id: string
          job_id: string
          key_requirements: Json
          location: string
          match_score: number
          matching_skills: Json
          missing_skills: Json | null
          notes: string | null
          posted_date: string | null
          reports_to: string | null
          salary_range: string
          seniority: string
          short_description: string
          status: string
          team_size: string | null
          tech_stack: Json | null
          title: string
          updated_at: string
          user_id: string
          why_good_fit: string | null
          work_mode: string
        }
        Insert: {
          application_deadline?: string | null
          application_tips?: string | null
          applied_at?: string | null
          benefits?: Json | null
          career_page_url?: string | null
          company: string
          company_industry: string
          company_logo_letter?: string | null
          company_size?: string | null
          created_at?: string
          employment_type?: string | null
          id?: string
          job_id: string
          key_requirements?: Json
          location: string
          match_score?: number
          matching_skills?: Json
          missing_skills?: Json | null
          notes?: string | null
          posted_date?: string | null
          reports_to?: string | null
          salary_range: string
          seniority: string
          short_description: string
          status?: string
          team_size?: string | null
          tech_stack?: Json | null
          title: string
          updated_at?: string
          user_id: string
          why_good_fit?: string | null
          work_mode?: string
        }
        Update: {
          application_deadline?: string | null
          application_tips?: string | null
          applied_at?: string | null
          benefits?: Json | null
          career_page_url?: string | null
          company?: string
          company_industry?: string
          company_logo_letter?: string | null
          company_size?: string | null
          created_at?: string
          employment_type?: string | null
          id?: string
          job_id?: string
          key_requirements?: Json
          location?: string
          match_score?: number
          matching_skills?: Json
          missing_skills?: Json | null
          notes?: string | null
          posted_date?: string | null
          reports_to?: string | null
          salary_range?: string
          seniority?: string
          short_description?: string
          status?: string
          team_size?: string | null
          tech_stack?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          why_good_fit?: string | null
          work_mode?: string
        }
        Relationships: []
      }
      saved_resumes: {
        Row: {
          alias: string | null
          created_at: string
          custom_slug: string | null
          id: string
          is_primary: boolean
          is_public: boolean
          notes: string | null
          parent_id: string | null
          resume_data: Json
          share_token: string | null
          source: string | null
          tags: string[] | null
          template: string
          title: string
          updated_at: string
          user_id: string | null
          version: number
        }
        Insert: {
          alias?: string | null
          created_at?: string
          custom_slug?: string | null
          id?: string
          is_primary?: boolean
          is_public?: boolean
          notes?: string | null
          parent_id?: string | null
          resume_data?: Json
          share_token?: string | null
          source?: string | null
          tags?: string[] | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Update: {
          alias?: string | null
          created_at?: string
          custom_slug?: string | null
          id?: string
          is_primary?: boolean
          is_public?: boolean
          notes?: string | null
          parent_id?: string | null
          resume_data?: Json
          share_token?: string | null
          source?: string | null
          tags?: string[] | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_resumes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saved_resumes"
            referencedColumns: ["id"]
          },
        ]
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
