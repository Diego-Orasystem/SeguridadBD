export interface Schema {
  OWNER: string;
}

export interface Table {
  TABLE_NAME: string;
}

export interface Column {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  DATA_LENGTH: number;
  NULLABLE: string;
}

export interface TableData {
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
} 