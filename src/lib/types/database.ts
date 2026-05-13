export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = "admin" | "explorer" | "msme";
export type TenderStatus = "active" | "closed" | "draft";

export type RequirementsJson = {
  mandatory_docs: string[];
  min_turnover_lakhs: number;
  min_years: number;
  certifications: string[];
  emd_lakhs: number;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: Role;
          created_at?: string;
        };
        Relationships: [];
      };
      msme_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          domain_category: string;
          turnover_lakhs: number;
          years_in_business: number;
          certifications: string[];
          gst_number: string | null;
          pan_number: string | null;
          udyam_number: string | null;
          phone: string | null;
          state: string | null;
          city: string | null;
          pincode: string | null;
          employee_count: number | null;
          authorized_name: string | null;
          authorized_designation: string | null;
          bank_name: string | null;
          bank_branch: string | null;
          past_projects: Json[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          domain_category: string;
          turnover_lakhs: number;
          years_in_business: number;
          certifications?: string[];
          gst_number?: string | null;
          pan_number?: string | null;
          udyam_number?: string | null;
          phone?: string | null;
          state?: string | null;
          city?: string | null;
          pincode?: string | null;
          employee_count?: number | null;
          authorized_name?: string | null;
          authorized_designation?: string | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          past_projects?: Json[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          domain_category?: string;
          turnover_lakhs?: number;
          years_in_business?: number;
          certifications?: string[];
          gst_number?: string | null;
          pan_number?: string | null;
          udyam_number?: string | null;
          phone?: string | null;
          state?: string | null;
          city?: string | null;
          pincode?: string | null;
          employee_count?: number | null;
          authorized_name?: string | null;
          authorized_designation?: string | null;
          bank_name?: string | null;
          bank_branch?: string | null;
          past_projects?: Json[];
          created_at?: string;
        };
        Relationships: [];
      };
      tenders: {
        Row: {
          id: string;
          title: string;
          domain: string;
          estimated_value_lakhs: number;
          startup_exemption: boolean;
          deadline: string;
          issuer: string;
          summary: string;
          nit_number: string | null;
          requirements_json: RequirementsJson;
          status: TenderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          domain: string;
          estimated_value_lakhs: number;
          startup_exemption?: boolean;
          deadline: string;
          issuer: string;
          summary: string;
          nit_number?: string | null;
          requirements_json: RequirementsJson;
          status?: TenderStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          domain?: string;
          estimated_value_lakhs?: number;
          startup_exemption?: boolean;
          deadline?: string;
          issuer?: string;
          summary?: string;
          nit_number?: string | null;
          requirements_json?: RequirementsJson;
          status?: TenderStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          tender_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tender_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tender_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
      tender_status: TenderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
