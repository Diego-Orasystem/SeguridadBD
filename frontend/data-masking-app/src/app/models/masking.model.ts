export interface MaskingRule {
  id?: number;
  table_name: string;
  column_name: string;
  masking_type: MaskingType;
  visible_chars?: number;
  schema_name?: string;
  is_applied?: string;
  created_by_user?: string;
  created_at?: string;
  updated_at?: string;
  trigger_operations?: string;
}

export enum MaskingType {
  CREDIT_CARD = 'CREDIT_CARD',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  FULL_MASK = 'FULL_MASK',
  CUSTOM = 'CUSTOM'
}

export interface MaskingView {
  VIEW_NAME: string;
  TEXT: string;
}

export interface TriggerConfig {
  ruleId: number;
  operations: string[];
} 