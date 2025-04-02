import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/database.model';
import { MaskingRule, MaskingType, MaskingView, TriggerConfig } from '../models/masking.model';
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

  // Utilidades de enmascaramiento para uso en el cliente
  // ===================================================
  
  /**
   * Aplica el enmascaramiento según el tipo y configuración
   */
  applyMaskingPreview(value: any, maskingType: string | MaskingType, visibleChars: number = 0): string {
    if (value === null || value === undefined) return '';
    
    const strValue = String(value);
    
    switch (maskingType) {
      case MaskingType.CREDIT_CARD:
      case 'CREDIT_CARD':
        return this.maskCreditCard(strValue, visibleChars);
      
      case MaskingType.EMAIL:
      case 'EMAIL':
        return this.maskEmail(strValue);
      
      case MaskingType.PHONE:
      case 'PHONE':
        return this.maskPhone(strValue, visibleChars);
      
      case MaskingType.FULL_MASK:
      case 'FULL_MASK':
        return this.maskFull(strValue);
      
      case MaskingType.CUSTOM:
      case 'CUSTOM':
        return this.maskCustom(strValue, visibleChars);
      
      default:
        return strValue;
    }
  }

  /**
   * Enmascaramiento de tarjeta de crédito, mostrando solo los últimos dígitos
   */
  maskCreditCard(value: string, visibleChars: number): string {
    if (value.length <= visibleChars) return value;
    const visible = value.slice(-visibleChars);
    const masked = 'X'.repeat(value.length - visibleChars);
    return masked + visible;
  }

  /**
   * Enmascaramiento de correo electrónico, mostrando solo el primer carácter y el dominio
   */
  maskEmail(value: string): string {
    if (!value.includes('@')) return 'X'.repeat(value.length);
    
    const [username, domain] = value.split('@');
    if (username.length <= 1) return value;
    
    const maskedUsername = username[0] + 'X'.repeat(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Enmascaramiento de teléfono, mostrando solo los últimos dígitos
   */
  maskPhone(value: string, visibleChars: number): string {
    if (value.length <= visibleChars) return value;
    const visible = value.slice(-visibleChars);
    const masked = 'X'.repeat(value.length - visibleChars);
    return masked + visible;
  }

  /**
   * Enmascaramiento completo, sustituyendo todos los caracteres
   */
  maskFull(value: string): string {
    return 'X'.repeat(value.length);
  }

  /**
   * Enmascaramiento personalizado, mostrando solo los últimos caracteres
   */
  maskCustom(value: string, visibleChars: number): string {
    if (value.length <= visibleChars) return value;
    const visible = value.slice(-visibleChars);
    const masked = 'X'.repeat(value.length - visibleChars);
    return masked + visible;
  }
} 