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
          slug: string;
          description: string | null;
          logo: string | null;
          cover_image: string | null;
          rating: number;
          location: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo?: string | null;
          cover_image?: string | null;
          rating?: number;
          location?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo?: string | null;
          cover_image?: string | null;
          rating?: number;
          location?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
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
          description: string | null;
          price: number;
          image: string | null;
          is_available: boolean;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image?: string | null;
          is_available?: boolean;
          category_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
