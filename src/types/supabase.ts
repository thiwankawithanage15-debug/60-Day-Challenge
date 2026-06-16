export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_color: string | null
          freeze_tokens: number | null
        }
        Insert: {
          id: string
          display_name: string
          avatar_color?: string | null
          freeze_tokens?: number | null
        }
        Update: {
          id?: string
          display_name?: string
          avatar_color?: string | null
          freeze_tokens?: number | null
        }
      }
      challenges: {
        Row: {
          id: string
          name: string
          description: string | null
          tier: number
          points: number
          penalty: number
          scope: string
          owner_id: string | null
          active: boolean | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          tier?: number
          points?: number
          penalty?: number
          scope?: string
          owner_id?: string | null
          active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          tier?: number
          points?: number
          penalty?: number
          scope?: string
          owner_id?: string | null
          active?: boolean | null
          sort_order?: number | null
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          log_date: string
          completed: boolean
        }
        Insert: {
          id?: string
          user_id?: string
          challenge_id?: string
          log_date: string
          completed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          log_date?: string
          completed?: boolean
        }
      }
      challenge_config: {
        Row: {
          id: number
          start_date: string | null
          total_days: number | null
          stakes_text: string | null
        }
        Insert: {
          id?: number
          start_date?: string | null
          total_days?: number | null
          stakes_text?: string | null
        }
        Update: {
          id?: number
          start_date?: string | null
          total_days?: number | null
          stakes_text?: string | null
        }
      }
    }
  }
}
