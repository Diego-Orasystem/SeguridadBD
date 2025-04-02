export interface MaskingRule {
  id: number;
  table_name: string;
  column_name: string;
  masking_type: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum MaskingType {
  FULL_MASK = 'FULL_MASK',
  PARTIAL_MASK = 'PARTIAL_MASK',
  EMAIL_MASK = 'EMAIL_MASK',
  CREDIT_CARD_MASK = 'CREDIT_CARD_MASK',
  RANDOM = 'RANDOM'
} 