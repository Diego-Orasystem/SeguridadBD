import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/database.model';
import { MaskingRule, MaskingView, TriggerConfig } from '../models/masking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaskingService {
  private apiUrl = `${environment.apiUrl}/masking`;

  constructor(private http: HttpClient) { }

  // Crear una nueva regla de enmascaramiento
  createMaskingRule(rule: MaskingRule): Observable<ApiResponse<MaskingRule>> {
    return this.http.post<ApiResponse<MaskingRule>>(`${this.apiUrl}/rules`, rule);
  }

  // Obtener todas las reglas de enmascaramiento
  getMaskingRules(): Observable<ApiResponse<MaskingRule[]>> {
    return this.http.get<ApiResponse<MaskingRule[]>>(`${this.apiUrl}/rules`);
  }

  // Obtener una regla de enmascaramiento por ID
  getMaskingRuleById(id: number): Observable<ApiResponse<MaskingRule>> {
    return this.http.get<ApiResponse<MaskingRule>>(`${this.apiUrl}/rules/${id}`);
  }

  // Actualizar una regla de enmascaramiento
  updateMaskingRule(id: number, rule: Partial<MaskingRule>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/rules/${id}`, rule);
  }

  // Eliminar una regla de enmascaramiento
  deleteMaskingRule(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/rules/${id}`);
  }

  // Aplicar enmascaramiento a una tabla
  applyMasking(ruleId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/apply`, { ruleId });
  }

  // Eliminar enmascaramiento de una tabla
  removeMasking(ruleId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/remove`, { ruleId });
  }

  // Obtener vistas de enmascaramiento
  getMaskingViews(schema?: string): Observable<ApiResponse<MaskingView[]>> {
    const url = schema ? `${this.apiUrl}/views?schema=${schema}` : `${this.apiUrl}/views`;
    return this.http.get<ApiResponse<MaskingView[]>>(url);
  }

  // Configurar triggers para una vista enmascarada
  configureTriggers(config: TriggerConfig): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/triggers`, config);
  }
} 