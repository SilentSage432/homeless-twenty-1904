export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Canonical RBAC roles — matches public.profile_role enum. */
export type ProfileRole = "developer" | "admin" | "user";

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
