import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Schema, Table, Column, TableData } from '../models/database.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = `${environment.apiUrl}/database`;

  constructor(private http: HttpClient) { }

  // Obtener todos los esquemas disponibles
  getSchemas(): Observable<ApiResponse<Schema[]>> {
    return this.http.get<ApiResponse<Schema[]>>(`${this.apiUrl}/schemas`);
  }

  // Obtener todas las tablas de un esquema
  getTables(schema?: string): Observable<ApiResponse<Table[]>> {
    const url = schema ? `${this.apiUrl}/tables?schema=${schema}` : `${this.apiUrl}/tables`;
    return this.http.get<ApiResponse<Table[]>>(url);
  }

  // Obtener columnas de una tabla específica
  getTableColumns(tableName: string, schema?: string): Observable<ApiResponse<Column[]>> {
    const url = schema
      ? `${this.apiUrl}/tables/${tableName}/columns?schema=${schema}`
      : `${this.apiUrl}/tables/${tableName}/columns`;
    return this.http.get<ApiResponse<Column[]>>(url);
  }

  // Obtener datos de muestra de una tabla
  getTableData(tableName: string, schema?: string, limit: number = 10): Observable<ApiResponse<TableData[]>> {
    const url = schema
      ? `${this.apiUrl}/tables/${tableName}/data?schema=${schema}&limit=${limit}`
      : `${this.apiUrl}/tables/${tableName}/data?limit=${limit}`;
    return this.http.get<ApiResponse<TableData[]>>(url);
  }

  // Verificar la conexión a la base de datos
  testConnection(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/test-connection`);
  }
} 