export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Canonical RBAC roles — matches public.profile_role enum. */
export type ProfileRole = "developer" | "admin" | "user";

/** JSON config shapes stored on the single `site_settings` row. */
export type AnnouncementType = "info" | "alert" | "event";

export type AnnouncementBanner = {
  enabled: boolean;
  message: string;
  link_url: string;
  type: AnnouncementType;
};

export type LodgeInfo = {
  phone: string;
  address: string;
  hours: string;
  meeting_schedule: string;
  social_facebook: string;
  social_instagram: string;
};

export type HeroConfig = {
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  bg_image_url: string;
};

export type FeatureFlags = {
  allow_inquiries: boolean;
  allow_rsvps: boolean;
  show_interactive_map: boolean;
};

export type InquiryStatus = "new" | "replied" | "archived";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          full_name: string | null;
          role: ProfileRole;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          full_name?: string | null;
          role?: ProfileRole;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          full_name?: string | null;
          role?: ProfileRole;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          date: string;
          label: string;
          payment_url: string | null;
          image_url: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          map_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          date: string;
          label?: string;
          payment_url?: string | null;
          image_url?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          map_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          date?: string;
          label?: string;
          payment_url?: string | null;
          image_url?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          map_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plaques: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          map_url: string | null;
          date_placed: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          image_url?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          map_url?: string | null;
          date_placed?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          map_url?: string | null;
          date_placed?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          announcement_banner: AnnouncementBanner;
          lodge_info: LodgeInfo;
          hero_config: HeroConfig;
          feature_flags: FeatureFlags;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          announcement_banner?: AnnouncementBanner;
          lodge_info?: LodgeInfo;
          hero_config?: HeroConfig;
          feature_flags?: FeatureFlags;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          announcement_banner?: AnnouncementBanner;
          lodge_info?: LodgeInfo;
          hero_config?: HeroConfig;
          feature_flags?: FeatureFlags;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      site_content_sections: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          content?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          display_order: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question?: string;
          answer?: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          status: InquiryStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string;
          message?: string;
          status?: InquiryStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string;
          message?: string;
          status?: InquiryStatus;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      public_documents: {
        Row: {
          id: string;
          title: string;
          category: string;
          file_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          category?: string;
          file_url?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          file_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_role: {
        Args: Record<string, never>;
        Returns: ProfileRole;
      };
      can_manage_content: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_exec_sql: {
        Args: { query: string };
        Returns: Json;
      };
    };
    Enums: {
      profile_role: ProfileRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type PlaqueRow = Database["public"]["Tables"]["plaques"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
export type PlaqueInsert = Database["public"]["Tables"]["plaques"]["Insert"];
export type PlaqueUpdate = Database["public"]["Tables"]["plaques"]["Update"];

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSettingsUpdate =
  Database["public"]["Tables"]["site_settings"]["Update"];
export type SiteContentSection =
  Database["public"]["Tables"]["site_content_sections"]["Row"];
export type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
export type FaqInsert = Database["public"]["Tables"]["faqs"]["Insert"];
export type FaqUpdate = Database["public"]["Tables"]["faqs"]["Update"];
export type InquiryRow = Database["public"]["Tables"]["inquiries"]["Row"];
export type PublicDocument =
  Database["public"]["Tables"]["public_documents"]["Row"];

export const CONTENT_MANAGER_ROLES: readonly ProfileRole[] = [
  "admin",
  "developer",
] as const;

export function canManageContent(role: ProfileRole | null | undefined): boolean {
  return role === "admin" || role === "developer";
}

export function isDeveloperRole(role: ProfileRole | null | undefined): boolean {
  return role === "developer";
}

export function isStaffRole(role: ProfileRole | null | undefined): boolean {
  return canManageContent(role);
}

/** Payment URL + destructive deletes are staff-only (not standard user). */
export function canManageSensitiveContent(
  role: ProfileRole | null | undefined
): boolean {
  return canManageContent(role);
}

/** Roles an actor may assign when inviting stewards. */
export function assignableRolesFor(
  actorRole: ProfileRole
): readonly ProfileRole[] {
  if (isDeveloperRole(actorRole)) {
    return ["admin", "developer", "user"] as const;
  }
  if (actorRole === "admin") {
    return ["admin", "user"] as const;
  }
  return [] as const;
}

export function canAssignRole(
  actorRole: ProfileRole,
  targetRole: ProfileRole
): boolean {
  return (assignableRolesFor(actorRole) as readonly ProfileRole[]).includes(
    targetRole
  );
}
