export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          name_en: string | null;
          slug: string;
          description: string | null;
          description_en: string | null;
          logo: string | null;
          logo_url: string | null;
          cover_image: string | null;
          cover_url: string | null;
          rating: number;
          location: string | null;
          location_en: string | null;
          latitude: number | null;
          longitude: number | null;
          google_maps_url: string | null;
          phone: string | null;
          whatsapp: string | null;
          cuisine: string | null;
          cuisine_en: string | null;
          price_level: number | null;
          working_hours: Json;
          is_open_now: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string | null;
          name_en?: string | null;
          slug: string;
          description?: string | null;
          description_en?: string | null;
          logo?: string | null;
          logo_url?: string | null;
          cover_image?: string | null;
          cover_url?: string | null;
          rating?: number;
          location?: string | null;
          location_en?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          google_maps_url?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          cuisine?: string | null;
          cuisine_en?: string | null;
          price_level?: number | null;
          working_hours?: Json;
          is_open_now?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string | null;
          name_en?: string | null;
          slug?: string;
          description?: string | null;
          description_en?: string | null;
          logo?: string | null;
          logo_url?: string | null;
          cover_image?: string | null;
          cover_url?: string | null;
          rating?: number;
          location?: string | null;
          location_en?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          google_maps_url?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          cuisine?: string | null;
          cuisine_en?: string | null;
          price_level?: number | null;
          working_hours?: Json;
          is_open_now?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["restaurant_id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          restaurant_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          restaurant_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          restaurant_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_category_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["category_id"];
          },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          description_en: string | null;
          price: number;
          image: string | null;
          tags: string[];
          meal_type: string;
          is_available: boolean;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          price: number;
          image?: string | null;
          tags?: string[];
          meal_type?: string;
          is_available?: boolean;
          category_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          description?: string | null;
          description_en?: string | null;
          price?: number;
          image?: string | null;
          tags?: string[];
          meal_type?: string;
          is_available?: boolean;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: { id: string; name_ar: string; name_en: string | null; slug: string; created_at: string };
        Insert: { id?: string; name_ar: string; name_en?: string | null; slug: string; created_at?: string };
        Update: { id?: string; name_ar?: string; name_en?: string | null; slug?: string; created_at?: string };
        Relationships: [];
      };
      areas: {
        Row: { id: string; city_id: string; name_ar: string; name_en: string | null; slug: string; created_at: string };
        Insert: { id?: string; city_id: string; name_ar: string; name_en?: string | null; slug: string; created_at?: string };
        Update: { id?: string; city_id?: string; name_ar?: string; name_en?: string | null; slug?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          id: string; restaurant_id: string; area_id: string; branch_name_ar: string; branch_name_en: string | null;
          address_ar: string | null; address_en: string | null; google_maps_url: string | null;
          latitude: number | null; longitude: number | null; phone: string | null; whatsapp: string | null;
          working_hours: Json; is_open: boolean; created_at: string;
        };
        Insert: {
          id?: string; restaurant_id: string; area_id: string; branch_name_ar: string; branch_name_en?: string | null;
          address_ar?: string | null; address_en?: string | null; google_maps_url?: string | null;
          latitude?: number | null; longitude?: number | null; phone?: string | null; whatsapp?: string | null;
          working_hours?: Json; is_open?: boolean; created_at?: string;
        };
        Update: {
          id?: string; restaurant_id?: string; area_id?: string; branch_name_ar?: string; branch_name_en?: string | null;
          address_ar?: string | null; address_en?: string | null; google_maps_url?: string | null;
          latitude?: number | null; longitude?: number | null; phone?: string | null; whatsapp?: string | null;
          working_hours?: Json; is_open?: boolean; created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
      items: {
        Row: {
          id: string; category_id: string; name_ar: string; name_en: string | null; price: number;
          image_url: string | null; tags: string[]; description_ar: string | null; description_en: string | null;
          meal_type: string; is_available: boolean; created_at: string;
        };
        Insert: {
          id?: string; category_id: string; name_ar: string; name_en?: string | null; price: number;
          image_url?: string | null; tags?: string[]; description_ar?: string | null; description_en?: string | null;
          meal_type: string; is_available?: boolean; created_at?: string;
        };
        Update: {
          id?: string; category_id?: string; name_ar?: string; name_en?: string | null; price?: number;
          image_url?: string | null; tags?: string[]; description_ar?: string | null; description_en?: string | null;
          meal_type?: string; is_available?: boolean; created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          author_name: string | null;
          author_avatar: string | null;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          author_name?: string | null;
          author_avatar?: string | null;
          rating: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          author_name?: string | null;
          author_avatar?: string | null;
          rating?: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_analytics: {
        Row: {
          id: string;
          restaurant_id: string;
          event_type: "call" | "whatsapp" | "share" | "page_view";
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          event_type: "call" | "whatsapp" | "share" | "page_view";
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          event_type?: "call" | "whatsapp" | "share" | "page_view";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_analytics_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
