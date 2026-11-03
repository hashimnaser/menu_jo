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
          name_en: string | null;
          slug: string;
          description: string | null;
          description_en: string | null;
          logo: string | null;
          cover_image: string | null;
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
          name_en?: string | null;
          slug: string;
          description?: string | null;
          description_en?: string | null;
          logo?: string | null;
          cover_image?: string | null;
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
          name_en?: string | null;
          slug?: string;
          description?: string | null;
          description_en?: string | null;
          logo?: string | null;
          cover_image?: string | null;
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
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          restaurant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          restaurant_id?: string;
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
