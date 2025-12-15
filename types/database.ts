export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          role: 'reporter' | 'cleaner' | 'ngo_admin';
          avatar_url: string | null;
          points: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          role: 'reporter' | 'cleaner' | 'ngo_admin';
          avatar_url?: string | null;
          points?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          role?: 'reporter' | 'cleaner' | 'ngo_admin';
          avatar_url?: string | null;
          points?: number | null;
          created_at?: string | null;
        };
      };
      lakes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          lat: number | null;
          lng: number | null;
          region: string | null;
          photo_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          region?: string | null;
          photo_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          lat?: number | null;
          lng?: number | null;
          region?: string | null;
          photo_url?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          lake_id: string | null;
          lake_name: string | null;
          description: string | null;
          category: 'trash' | 'oil' | 'plastic' | 'vegetation' | 'animal' | 'other' | null;
          severity: number | null;
          photos: string[] | null;
          video_url: string | null;
          lat: number;
          lng: number;
          status: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned' | 'closed' | 'rejected' | null;
          priority_score: number | null;
          assigned_cleaner_id: string | null;
          volunteer_proof_photos: string[] | null;
          volunteer_completed_at: string | null;
          volunteer_notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          lake_id?: string | null;
          lake_name?: string | null;
          description?: string | null;
          category?: 'trash' | 'oil' | 'plastic' | 'vegetation' | 'animal' | 'other' | null;
          severity?: number | null;
          photos?: string[] | null;
          video_url?: string | null;
          lat: number;
          lng: number;
          status?: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned' | 'closed' | 'rejected' | null;
          priority_score?: number | null;
          assigned_cleaner_id?: string | null;
          volunteer_proof_photos?: string[] | null;
          volunteer_completed_at?: string | null;
          volunteer_notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          lake_id?: string | null;
          description?: string | null;
          category?: 'trash' | 'oil' | 'plastic' | 'vegetation' | 'animal' | 'other' | null;
          severity?: number | null;
          photos?: string[] | null;
          video_url?: string | null;
          lat?: number;
          lng?: number;
          status?: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'cleaned' | 'closed' | 'rejected' | null;
          priority_score?: number | null;
          assigned_cleaner_id?: string | null;
          volunteer_proof_photos?: string[] | null;
          volunteer_completed_at?: string | null;
          volunteer_notes?: string | null;
          created_at?: string | null;
        };
      };
      cleanups: {
        Row: {
          id: string;
          report_id: string | null;
          cleaner_id: string | null;
          before_photos: string[] | null;
          after_photos: string[] | null;
          notes: string | null;
          start_time: string | null;
          end_time: string | null;
          verified_by_admin_id: string | null;
          points_awarded: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          cleaner_id?: string | null;
          before_photos?: string[] | null;
          after_photos?: string[] | null;
          notes?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          verified_by_admin_id?: string | null;
          points_awarded?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          cleaner_id?: string | null;
          before_photos?: string[] | null;
          after_photos?: string[] | null;
          notes?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          verified_by_admin_id?: string | null;
          points_awarded?: number | null;
          created_at?: string | null;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon_url?: string | null;
        };
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          awarded_at: string | null;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          awarded_at?: string | null;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          awarded_at?: string | null;
        };
      };
      points_log: {
        Row: {
          id: string;
          user_id: string | null;
          change: number | null;
          reason: string | null;
          balance_snapshot: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          change?: number | null;
          reason?: string | null;
          balance_snapshot?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          change?: number | null;
          reason?: string | null;
          balance_snapshot?: number | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string | null;
          payload: Json | null;
          read: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          payload?: Json | null;
          read?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          payload?: Json | null;
          read?: boolean | null;
          created_at?: string | null;
        };
      };
      moderation_queue: {
        Row: {
          id: string;
          target_type: string | null;
          target_id: string | null;
          reason: string | null;
          reporter_id: string | null;
          action_taken: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          target_type?: string | null;
          target_id?: string | null;
          reason?: string | null;
          reporter_id?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          target_type?: string | null;
          target_id?: string | null;
          reason?: string | null;
          reporter_id?: string | null;
          action_taken?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}

// Helper types
export type User = Database['public']['Tables']['users']['Row'];
export type Lake = Database['public']['Tables']['lakes']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type Cleanup = Database['public']['Tables']['cleanups']['Row'];
export type Badge = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type PointsLog = Database['public']['Tables']['points_log']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export type ReportWithLake = Report & { lake: Lake | null };
export type UserWithBadges = User & { badges: Badge[] };
