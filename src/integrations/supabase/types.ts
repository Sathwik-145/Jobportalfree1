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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_login_approvals: {
        Row: {
          created_at: string
          decided_at: string | null
          email: string
          expires_at: string
          id: string
          session_id: string
          status: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          email: string
          expires_at: string
          id?: string
          session_id: string
          status?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          session_id?: string
          status?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          expires_at: string | null
          id: string
          message: string | null
          target: string | null
          target_student_ids: Json | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          target?: string | null
          target_student_ids?: Json | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          target?: string | null
          target_student_ids?: Json | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          device: string | null
          email: string | null
          ended_at: string | null
          id: string
          last_seen: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          email?: string | null
          ended_at?: string | null
          id?: string
          last_seen?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          email?: string | null
          ended_at?: string | null
          id?: string
          last_seen?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      application_notes: {
        Row: {
          admin_id: string
          application_id: string
          created_at: string
          id: string
          note: string | null
          rating: number | null
        }
        Insert: {
          admin_id: string
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          rating?: number | null
        }
        Update: {
          admin_id?: string
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      codexam_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          replied_at: string | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          replied_at?: string | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          replied_at?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          exam_id: string | null
          id: string
          rating: number | null
          student_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          rating?: number | null
          student_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          rating?: number | null
          student_id?: string | null
        }
        Relationships: []
      }
      exam_recordings: {
        Row: {
          created_at: string
          ended_at: string
          exam_title: string | null
          id: string
          kind: string
          path: string
          size_bytes: number | null
          started_at: string
          student_email: string | null
          student_id: string
          student_name: string | null
        }
        Insert: {
          created_at?: string
          ended_at: string
          exam_title?: string | null
          id?: string
          kind: string
          path: string
          size_bytes?: number | null
          started_at: string
          student_email?: string | null
          student_id: string
          student_name?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string
          exam_title?: string | null
          id?: string
          kind?: string
          path?: string
          size_bytes?: number | null
          started_at?: string
          student_email?: string | null
          student_id?: string
          student_name?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          allow_copy_paste: boolean | null
          assigned_student_ids: Json | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          exam_duration_minutes: number | null
          fib_ids: Json | null
          id: string
          is_timed: boolean | null
          mcq_ids: Json | null
          question_ids: Json | null
          scheduled_at: string | null
          section_names: Json | null
          start_buffer_minutes: number | null
          started_at: string | null
          status: string | null
          title: string | null
          writing_ids: Json | null
        }
        Insert: {
          allow_copy_paste?: boolean | null
          assigned_student_ids?: Json | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          exam_duration_minutes?: number | null
          fib_ids?: Json | null
          id: string
          is_timed?: boolean | null
          mcq_ids?: Json | null
          question_ids?: Json | null
          scheduled_at?: string | null
          section_names?: Json | null
          start_buffer_minutes?: number | null
          started_at?: string | null
          status?: string | null
          title?: string | null
          writing_ids?: Json | null
        }
        Update: {
          allow_copy_paste?: boolean | null
          assigned_student_ids?: Json | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          exam_duration_minutes?: number | null
          fib_ids?: Json | null
          id?: string
          is_timed?: boolean | null
          mcq_ids?: Json | null
          question_ids?: Json | null
          scheduled_at?: string | null
          section_names?: Json | null
          start_buffer_minutes?: number | null
          started_at?: string | null
          status?: string | null
          title?: string | null
          writing_ids?: Json | null
        }
        Relationships: []
      }
      fib_questions: {
        Row: {
          answers: Json | null
          case_sensitive: boolean | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          marks: number | null
          sentence: string | null
        }
        Insert: {
          answers?: Json | null
          case_sensitive?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id: string
          marks?: number | null
          sentence?: string | null
        }
        Update: {
          answers?: Json | null
          case_sensitive?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          marks?: number | null
          sentence?: string | null
        }
        Relationships: []
      }
      fib_submissions: {
        Row: {
          answers: Json | null
          exam_id: string | null
          fib_id: string | null
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          max_marks: number | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          answers?: Json | null
          exam_id?: string | null
          fib_id?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          max_marks?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          answers?: Json | null
          exam_id?: string | null
          fib_id?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          max_marks?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      headlines: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          text: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          text: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          text?: string
        }
        Relationships: []
      }
      interview_prep: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          tips: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tips?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tips?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_preferences: {
        Row: {
          admin_paused: boolean
          created_at: string
          id: string
          is_active: boolean
          preferred_job_types: string[] | null
          preferred_locations: string[] | null
          preferred_skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_paused?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          preferred_skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_paused?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          preferred_job_types?: string[] | null
          preferred_locations?: string[] | null
          preferred_skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string | null
          created_at: string
          deadline: string | null
          description: string | null
          experience_level: string | null
          id: string
          is_active: boolean
          job_type: string | null
          location: string | null
          posted_by: string | null
          salary_range: string | null
          scheduled_publish_at: string | null
          scraped_content: string | null
          skills_required: string[] | null
          source_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location?: string | null
          posted_by?: string | null
          salary_range?: string | null
          scheduled_publish_at?: string | null
          scraped_content?: string | null
          skills_required?: string[] | null
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location?: string | null
          posted_by?: string | null
          salary_range?: string | null
          scheduled_publish_at?: string | null
          scraped_content?: string | null
          skills_required?: string[] | null
          source_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mcq_questions: {
        Row: {
          category: string | null
          correct_index: number | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          marks: number | null
          options: Json | null
          question: string | null
        }
        Insert: {
          category?: string | null
          correct_index?: number | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id: string
          marks?: number | null
          options?: Json | null
          question?: string | null
        }
        Update: {
          category?: string | null
          correct_index?: number | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          marks?: number | null
          options?: Json | null
          question?: string | null
        }
        Relationships: []
      }
      mcq_submissions: {
        Row: {
          exam_id: string | null
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          mcq_id: string | null
          selected_index: number | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          exam_id?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          mcq_id?: string | null
          selected_index?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          exam_id?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          mcq_id?: string | null
          selected_index?: number | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          college: string | null
          created_at: string
          degree: string | null
          email: string | null
          email_verified: boolean
          full_name: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          verify_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          verify_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          verify_token?: string | null
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          created_at: string
          icon_type: string
          id: string
          is_active: boolean
          link_url: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string | null
          default_private_count: number | null
          default_public_count: number | null
          description: string | null
          difficulty: string | null
          id: string
          languages: Json | null
          max_marks: number | null
          private_test_cases: Json | null
          public_test_cases: Json | null
          sample_count: number | null
          sort_order: number | null
          time_limit: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          default_private_count?: number | null
          default_public_count?: number | null
          description?: string | null
          difficulty?: string | null
          id: string
          languages?: Json | null
          max_marks?: number | null
          private_test_cases?: Json | null
          public_test_cases?: Json | null
          sample_count?: number | null
          sort_order?: number | null
          time_limit?: number | null
          title?: string
        }
        Update: {
          created_at?: string | null
          default_private_count?: number | null
          default_public_count?: number | null
          description?: string | null
          difficulty?: string | null
          id?: string
          languages?: Json | null
          max_marks?: number | null
          private_test_cases?: Json | null
          public_test_cases?: Json | null
          sample_count?: number | null
          sort_order?: number | null
          time_limit?: number | null
          title?: string
        }
        Relationships: []
      }
      reevaluation_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          exam_id: string | null
          id: string
          question_id: string | null
          question_type: string | null
          reason: string | null
          resolved_at: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          question_id?: string | null
          question_type?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          question_id?: string | null
          question_type?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          answers: Json | null
          approved_at: string | null
          approved_student_id: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          link_id: string | null
          link_title: string | null
          name: string | null
          notes: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          answers?: Json | null
          approved_at?: string | null
          approved_student_id?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          link_id?: string | null
          link_title?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          answers?: Json | null
          approved_at?: string | null
          approved_student_id?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          link_id?: string | null
          link_title?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      resume_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          download_url: string
          id: string
          is_active: boolean
          name: string
          preview_url: string | null
          source_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          download_url?: string
          id?: string
          is_active?: boolean
          name: string
          preview_url?: string | null
          source_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          download_url?: string
          id?: string
          is_active?: boolean
          name?: string
          preview_url?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      server_access: {
        Row: {
          created_at: string
          key_hash: string
          label: string
        }
        Insert: {
          created_at?: string
          key_hash: string
          label?: string
        }
        Update: {
          created_at?: string
          key_hash?: string
          label?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      student_credentials: {
        Row: {
          password: string
          student_id: string
          updated_at: string
        }
        Insert: {
          password?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          password?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_credentials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          assigned_questions: Json | null
          created_at: string | null
          email: string
          exam_status: string | null
          id: string
          is_blocked: boolean | null
          max_tab_switches: number | null
          name: string | null
          retake_exam_ids: Json | null
          show_results: string | null
          tab_switch_count: number | null
        }
        Insert: {
          assigned_questions?: Json | null
          created_at?: string | null
          email: string
          exam_status?: string | null
          id: string
          is_blocked?: boolean | null
          max_tab_switches?: number | null
          name?: string | null
          retake_exam_ids?: Json | null
          show_results?: string | null
          tab_switch_count?: number | null
        }
        Update: {
          assigned_questions?: Json | null
          created_at?: string | null
          email?: string
          exam_status?: string | null
          id?: string
          is_blocked?: boolean | null
          max_tab_switches?: number | null
          name?: string | null
          retake_exam_ids?: Json | null
          show_results?: string | null
          tab_switch_count?: number | null
        }
        Relationships: []
      }
      subadmin_permissions: {
        Row: {
          can_manage_banners: boolean
          can_manage_headlines: boolean
          can_manage_jobs: boolean
          can_manage_templates: boolean
          can_view_analytics: boolean
          can_view_applications: boolean
          can_view_messages: boolean
          can_view_users: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_banners?: boolean
          can_manage_headlines?: boolean
          can_manage_jobs?: boolean
          can_manage_templates?: boolean
          can_view_analytics?: boolean
          can_view_applications?: boolean
          can_view_messages?: boolean
          can_view_users?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_banners?: boolean
          can_manage_headlines?: boolean
          can_manage_jobs?: boolean
          can_manage_templates?: boolean
          can_view_analytics?: boolean
          can_view_applications?: boolean
          can_view_messages?: boolean
          can_view_users?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subadmin_requests: {
        Row: {
          created_at: string
          id: string
          purpose: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purpose?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purpose?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subadmin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      submissions: {
        Row: {
          code: string | null
          id: string
          language: string | null
          marks: number | null
          max_marks: number | null
          passed_private: number | null
          passed_public: number | null
          private_results: Json | null
          public_results: Json | null
          question_id: string
          student_id: string
          submitted_at: string | null
          total_private: number | null
          total_public: number | null
        }
        Insert: {
          code?: string | null
          id?: string
          language?: string | null
          marks?: number | null
          max_marks?: number | null
          passed_private?: number | null
          passed_public?: number | null
          private_results?: Json | null
          public_results?: Json | null
          question_id: string
          student_id: string
          submitted_at?: string | null
          total_private?: number | null
          total_public?: number | null
        }
        Update: {
          code?: string | null
          id?: string
          language?: string | null
          marks?: number | null
          max_marks?: number | null
          passed_private?: number | null
          passed_public?: number | null
          private_results?: Json | null
          public_results?: Json | null
          question_id?: string
          student_id?: string
          submitted_at?: string | null
          total_private?: number | null
          total_public?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      writing_questions: {
        Row: {
          created_at: string | null
          id: string
          marks: number | null
          max_words: number | null
          min_words: number | null
          prompt: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          marks?: number | null
          max_words?: number | null
          min_words?: number | null
          prompt?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marks?: number | null
          max_words?: number | null
          min_words?: number | null
          prompt?: string | null
          title?: string | null
        }
        Relationships: []
      }
      writing_submissions: {
        Row: {
          answer_text: string | null
          exam_id: string | null
          id: string
          marks_awarded: number | null
          max_marks: number | null
          student_id: string | null
          submitted_at: string | null
          word_count: number | null
          writing_id: string | null
        }
        Insert: {
          answer_text?: string | null
          exam_id?: string | null
          id?: string
          marks_awarded?: number | null
          max_marks?: number | null
          student_id?: string | null
          submitted_at?: string | null
          word_count?: number | null
          writing_id?: string | null
        }
        Update: {
          answer_text?: string | null
          exam_id?: string | null
          id?: string
          marks_awarded?: number | null
          max_marks?: number | null
          student_id?: string | null
          submitted_at?: string | null
          word_count?: number | null
          writing_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approval_identity: { Args: never; Returns: boolean }
      admin_session_is_approved: { Args: never; Returns: boolean }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      pending_verify_token: {
        Args: { _email: string; _secret?: string }
        Returns: string
      }
      register_server_key: {
        Args: { _hash: string; _label?: string }
        Returns: boolean
      }
      server_request: { Args: never; Returns: boolean }
      verify_email_token: { Args: { _token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "subadmin" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "subadmin", "student"],
    },
  },
} as const
