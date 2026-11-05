
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "exports": {
                  Row: {
                    "created_at": string,"file_path": string | null,"finished_at": string | null,"id": string,"period_end": string,"period_start": string,"status": string,"token": string | null,"wallet": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_path"?: string | null,"finished_at"?: string | null,"id"?: string,"period_end": string,"period_start": string,"status"?: string,"token"?: string | null,"wallet": string
                  }
                  Update: {
                    "created_at"?: string,"file_path"?: string | null,"finished_at"?: string | null,"id"?: string,"period_end"?: string,"period_start"?: string,"status"?: string,"token"?: string | null,"wallet"?: string
                  }
                  Relationships: [
                    
                  ]
                },"indexer_state": {
                  Row: {
                    "chain_id": number,"last_block": number,"last_block_at": string,"last_block_hash": string | null,"lease_until": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chain_id": number,"last_block": number,"last_block_at": string,"last_block_hash"?: string | null,"lease_until"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "chain_id"?: number,"last_block"?: number,"last_block_at"?: string,"last_block_hash"?: string | null,"lease_until"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "id": boolean,"retention_days": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"retention_days": number
                  }
                  Update: {
                    "id"?: boolean,"retention_days"?: number
                  }
                  Relationships: [
                    
                  ]
                },"tokens": {
                  Row: {
                    "address": string,"chain_id": number,"decimals": number,"symbol": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"chain_id": number,"decimals": number,"symbol": string
                  }
                  Update: {
                    "address"?: string,"chain_id"?: number,"decimals"?: number,"symbol"?: string
                  }
                  Relationships: [
                    
                  ]
                },"transfers": {
                  Row: {
                    "amount": number,"block_hash": string,"block_number": number,"block_time": string,"chain_id": number,"from_address": string,"log_index": number,"to_address": string,"token": string,"tx_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"block_hash": string,"block_number": number,"block_time": string,"chain_id": number,"from_address": string,"log_index": number,"to_address": string,"token": string,"tx_hash": string
                  }
                  Update: {
                    "amount"?: number,"block_hash"?: string,"block_number"?: number,"block_time"?: string,"chain_id"?: number,"from_address"?: string,"log_index"?: number,"to_address"?: string,"token"?: string,"tx_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "transfers_chain_id_token_fkey"
      columns: ["chain_id","token"]
isOneToOne: false
      referencedRelation: "tokens"
      referencedColumns: ["chain_id","address"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "build_export_csv":
{ Args: { "p_export_id": string }; Returns: string
                           },
"call_scheduled_function":
{ Args: { "p_name": string }; Returns: undefined
                           },
"check_export_token":
{ Args: { "p_token": string }; Returns: undefined
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"delete_export_job":
{ Args: { "p_message_id": number }; Returns: boolean
                           },
"fit_export_period":
{ Args: { "p_period_end": string,"p_period_start": string }; Returns: Record<string, unknown>
                           },
"format_export_lines":
{ Args: { "p_export_id": string }; Returns: {
              "block_time": string,"line": string,"log_index": number
            }[]
                           },
"format_token_amount":
{ Args: { "p_amount": number,"p_decimals": number }; Returns: string
                           },
"insert_pending_export":
{ Args: { "p_period_end": string,"p_period_start": string,"p_token": string,"p_wallet": string }; Returns: string
                           },
"queue_export":
{ Args: { "p_export_id": string }; Returns: undefined
                           },
"quote_csv_text":
{ Args: { "p_value": string }; Returns: string
                           },
"read_export_jobs":
{ Args: { "p_count": number }; Returns: unknown[]
                          SetofOptions: {
        from: "*"
        to: "message_record"
        isOneToOne: false
        isSetofReturn: true
      } },
"request_export":
{ Args: { "p_period_end": string,"p_period_start": string,"p_token"?: string }; Returns: string
                           },
"require_signed_in_wallet":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"save_indexed_range":
{ Args: { "p_chain_id": number,"p_from_block": number,"p_to_block": number,"p_to_block_at": string,"p_to_block_hash"?: string,"p_transfers": Json }; Returns: undefined
                           },
"sync_unfinalized_range":
{ Args: { "p_chain_id": number,"p_finalized_block": number,"p_last_block": number,"p_new_block_at": string,"p_new_block_hash": string,"p_old_block_hash": string,"p_transfers": Json }; Returns: {
              "deleted_count": number,"inserted_count": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
