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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accao: string
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          registo_id: string | null
          resumo: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          accao: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registo_id?: string | null
          resumo?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          accao?: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registo_id?: string | null
          resumo?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          estado: string
          id: string
          mensagem: string | null
          storage_path: string | null
          tabelas: string[] | null
          tipo: string
          total_registos: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          mensagem?: string | null
          storage_path?: string | null
          tabelas?: string[] | null
          tipo?: string
          total_registos?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          mensagem?: string | null
          storage_path?: string | null
          tabelas?: string[] | null
          tipo?: string
          total_registos?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          parent_id: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          parent_id?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados: {
        Row: {
          created_at: string
          data_emissao: string
          emitido_por: string | null
          id: string
          numero: string
          observacoes: string | null
          peca_id: string
          storage_path: string | null
          updated_at: string
          user_id: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          emitido_por?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          peca_id: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          data_emissao?: string
          emitido_por?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          peca_id?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificados_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      dossies: {
        Row: {
          conteudo: string | null
          created_at: string
          id: string
          peca_id: string | null
          projeto_id: string | null
          storage_path: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          id?: string
          peca_id?: string | null
          projeto_id?: string | null
          storage_path?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          id?: string
          peca_id?: string | null
          projeto_id?: string | null
          storage_path?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossies_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossies_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      fotografias: {
        Row: {
          created_at: string
          id: string
          legenda: string | null
          ordem: number
          peca_id: string
          principal: boolean
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          peca_id: string
          principal?: boolean
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          peca_id?: string
          principal?: boolean
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotografias_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      peca_documentos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          peca_id: string
          storage_path: string
          tamanho: number | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          peca_id: string
          storage_path: string
          tamanho?: number | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          peca_id?: string
          storage_path?: string
          tamanho?: number | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peca_documentos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          altura_cm: number | null
          ano_fim: number | null
          ano_inicio: number | null
          autenticidade: string
          autor: string | null
          bibliografia: string | null
          categoria_id: string | null
          created_at: string
          data_aquisicao: string | null
          datacao: string | null
          descricao: string | null
          dimensoes: string | null
          escola: string | null
          estado: string
          ficha_tecnica: string | null
          ficha_tecnica_ficheiros: Json
          ficha_tecnica_nome: string | null
          ficha_tecnica_path: string | null
          historico: string | null
          id: string
          inventario: string | null
          largura_cm: number | null
          localizacao: string | null
          materiais: string | null
          moeda: string
          notas_privadas: string | null
          periodo: string | null
          peso_g: number | null
          profundidade_cm: number | null
          proveniencia: string | null
          publico: boolean
          raridade: string
          slug: string
          slug_publico: string | null
          tecnica: string | null
          titulo: string
          updated_at: string
          user_id: string
          valor_estimado: number | null
        }
        Insert: {
          altura_cm?: number | null
          ano_fim?: number | null
          ano_inicio?: number | null
          autenticidade?: string
          autor?: string | null
          bibliografia?: string | null
          categoria_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          datacao?: string | null
          descricao?: string | null
          dimensoes?: string | null
          escola?: string | null
          estado?: string
          ficha_tecnica?: string | null
          ficha_tecnica_ficheiros?: Json
          ficha_tecnica_nome?: string | null
          ficha_tecnica_path?: string | null
          historico?: string | null
          id?: string
          inventario?: string | null
          largura_cm?: number | null
          localizacao?: string | null
          materiais?: string | null
          moeda?: string
          notas_privadas?: string | null
          periodo?: string | null
          peso_g?: number | null
          profundidade_cm?: number | null
          proveniencia?: string | null
          publico?: boolean
          raridade?: string
          slug: string
          slug_publico?: string | null
          tecnica?: string | null
          titulo: string
          updated_at?: string
          user_id: string
          valor_estimado?: number | null
        }
        Update: {
          altura_cm?: number | null
          ano_fim?: number | null
          ano_inicio?: number | null
          autenticidade?: string
          autor?: string | null
          bibliografia?: string | null
          categoria_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          datacao?: string | null
          descricao?: string | null
          dimensoes?: string | null
          escola?: string | null
          estado?: string
          ficha_tecnica?: string | null
          ficha_tecnica_ficheiros?: Json
          ficha_tecnica_nome?: string | null
          ficha_tecnica_path?: string | null
          historico?: string | null
          id?: string
          inventario?: string | null
          largura_cm?: number | null
          localizacao?: string | null
          materiais?: string | null
          moeda?: string
          notas_privadas?: string | null
          periodo?: string | null
          peso_g?: number | null
          profundidade_cm?: number | null
          proveniencia?: string | null
          publico?: boolean
          raridade?: string
          slug?: string
          slug_publico?: string | null
          tecnica?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pecas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apelido: string | null
          avatar_url: string | null
          created_at: string
          id: string
          instituicao: string | null
          nome: string | null
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          avatar_url?: string | null
          created_at?: string
          id: string
          instituicao?: string | null
          nome?: string | null
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          instituicao?: string | null
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projeto_pecas: {
        Row: {
          created_at: string
          id: string
          nota: string | null
          ordem: number
          peca_id: string
          projeto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nota?: string | null
          ordem?: number
          peca_id: string
          projeto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nota?: string | null
          ordem?: number
          peca_id?: string
          projeto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_pecas_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_pecas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          estado: string
          id: string
          local: string | null
          slug: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          estado?: string
          id?: string
          local?: string | null
          slug: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          estado?: string
          id?: string
          local?: string | null
          slug?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restauros: {
        Row: {
          created_at: string
          custo: number | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          estado_antes: string | null
          estado_depois: string | null
          id: string
          materiais_usados: string | null
          moeda: string
          oficina: string | null
          peca_id: string
          responsavel: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          estado_antes?: string | null
          estado_depois?: string | null
          id?: string
          materiais_usados?: string | null
          moeda?: string
          oficina?: string | null
          peca_id: string
          responsavel?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          estado_antes?: string | null
          estado_depois?: string | null
          id?: string
          materiais_usados?: string | null
          moeda?: string
          oficina?: string | null
          peca_id?: string
          responsavel?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restauros_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "curador" | "visitante"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "curador", "visitante"],
    },
  },
} as const
