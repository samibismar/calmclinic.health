export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: number;
          slug: string;
          clinic_name: string;
          logo_url: string | null;
          brand_color: string | null;
          tone: string;
          languages: string[];
          prompt_instructions: string;
          doctor_name: string;
          specialty: string;
          example_questions: string[];
          has_completed_setup: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clinics"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["clinics"]["Row"]>;
      };
      chat_feedback: {
        Row: {
          id: number;
          created_at: string;
          feedback: string;
          rating: number;
          clinic_slug: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_feedback"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["chat_feedback"]["Row"]>;
      };
    };
  };
}
