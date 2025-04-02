import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/database.model';
import { MaskingRule } from '../models/masking-rule.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaskingService {
  private apiUrl = `${environment.apiUrl}/masking`;

  constructor(private http: HttpClient) { }

  // Crear una nueva regla de enmascaramiento
  createMaskingRule(rule: MaskingRule): Observable<ApiResponse<MaskingRule>> {
    // Si estamos en modo desarrollo y no hay conexión con el backend,
    // simular una respuesta exitosa
    if (environment.simulateApi) {
      const newRule = { ...rule, id: Date.now(), is_active: true };
      // Guardar en localStorage para simular persistencia
      const existingRules = this.getLocalRules();
      existingRules.push(newRule);
      localStorage.setItem('maskingRules', JSON.stringify(existingRules));
      
      return of({
        success: true,
        data: newRule,
        message: 'Regla creada correctamente'
      });
    }
    return this.http.post<ApiResponse<MaskingRule>>(`${this.apiUrl}/rules`, rule);
  }

  // Obtener todas las reglas de enmascaramiento
  getMaskingRules(): Observable<ApiResponse<MaskingRule[]>> {
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      return of({
        success: true,
        data: rules,
        message: 'Reglas obtenidas correctamente'
      });
    }
    return this.http.get<ApiResponse<MaskingRule[]>>(`${this.apiUrl}/rules`);
  }

  // Obtener una regla de enmascaramiento por ID
  getMaskingRuleById(id: number): Observable<ApiResponse<MaskingRule>> {
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const rule = rules.find(r => r.id === id);
      if (rule) {
        return of({
          success: true,
          data: rule,
          message: 'Regla obtenida correctamente'
        });
      } else {
        return of({
          success: false,
          data: undefined,
          message: 'Regla no encontrada'
        });
      }
    }
    return this.http.get<ApiResponse<MaskingRule>>(`${this.apiUrl}/rules/${id}`);
  }

  // Actualizar una regla de enmascaramiento
  updateMaskingRule(id: number, rule: Partial<MaskingRule>): Observable<ApiResponse<any>> {
    // Si estamos en modo desarrollo y no hay conexión con el backend,
    // simular una respuesta exitosa
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const index = rules.findIndex(r => r.id === id);
      if (index !== -1) {
        rules[index] = { ...rules[index], ...rule };
        localStorage.setItem('maskingRules', JSON.stringify(rules));
      }
      return of({
        success: true,
        data: rules[index],
        message: 'Regla actualizada correctamente'
      });
    }
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/rules/${id}`, rule);
  }

  // Eliminar una regla de enmascaramiento
  deleteMaskingRule(id: number): Observable<ApiResponse<any>> {
    // Si estamos en modo desarrollo y no hay conexión con el backend,
    // simular una respuesta exitosa
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const filteredRules = rules.filter(r => r.id !== id);
      localStorage.setItem('maskingRules', JSON.stringify(filteredRules));
      return of({
        success: true,
        message: 'Regla eliminada correctamente'
      });
    }
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/rules/${id}`);
  }

  // Aplicar enmascaramiento a una columna
  applyMasking(ruleId: number): Observable<ApiResponse<any>> {
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        // Marcar la regla como aplicada
        rule.is_applied = true;
        localStorage.setItem('maskingRules', JSON.stringify(rules));
        return of({
          success: true,
          message: 'Enmascaramiento aplicado correctamente'
        });
      }
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/apply`, { ruleId });
  }

  // Eliminar enmascaramiento de una columna
  removeMasking(ruleId: number): Observable<ApiResponse<any>> {
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        // Marcar la regla como no aplicada
        rule.is_applied = false;
        localStorage.setItem('maskingRules', JSON.stringify(rules));
        return of({
          success: true,
          message: 'Enmascaramiento eliminado correctamente'
        });
      }
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/remove`, { ruleId });
  }

  // Configurar triggers para una regla
  configureTriggers(config: { ruleId: number; operations: string[] }): Observable<ApiResponse<any>> {
    // Si estamos en modo desarrollo y no hay conexión con el backend,
    // simular una respuesta exitosa
    if (environment.simulateApi) {
      const rules = this.getLocalRules();
      const rule = rules.find(r => r.id === config.ruleId);
      if (rule) {
        rule.triggers = config.operations;
        localStorage.setItem('maskingRules', JSON.stringify(rules));
      }
      return of({
        success: true,
        message: 'Triggers configurados correctamente'
      });
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/triggers`, config);
  }

  // Aplicar enmascaramiento para vista previa
  applyMaskingPreview(value: any, maskingType: string, visibleChars: number = 2): string {
    if (value === null || value === undefined) {
      return '';
    }

    value = String(value);

    switch (maskingType) {
      case 'FULL_MASK':
        return 'XXXX';
      
      case 'PARTIAL_MASK':
        if (value.length <= visibleChars) {
          return value;
        }
        return value.substring(0, visibleChars) + 'X'.repeat(value.length - visibleChars);
      
      case 'EMAIL_MASK':
        if (!value.includes('@')) {
          return 'XXX@example.com';
        }
        const parts = value.split('@');
        if (parts[0].length <= 2) {
          return parts[0] + '@' + parts[1];
        }
        return parts[0].substring(0, 2) + 'XXX@' + parts[1];
      
      case 'CREDIT_CARD_MASK':
        if (value.length < 4) {
          return 'XXXX-XXXX-XXXX-XXXX';
        }
        return 'XXXX-XXXX-XXXX-' + value.substring(value.length - 4);
      
      case 'RANDOM':
        return 'RANDOM_VALUE';
      
      default:
        return 'MASKED';
    }
  }

  // Generar script SQL para enmascarar datos
  generateMaskingScript(rule: MaskingRule): string {
    if (!rule || !rule.table_name || !rule.column_name) {
      return '';
    }

    let script = '';
    
    // Comentarios iniciales
    script += `-- Script para aplicar enmascaramiento a ${rule.column_name} en la tabla ${rule.table_name}\n`;
    script += `-- Tipo de enmascaramiento: ${this.formatMaskingType(rule.masking_type)}\n\n`;
    
    // Función de enmascaramiento
    switch (rule.masking_type) {
      case 'FULL_MASK':
        script += `-- Actualización para aplicar enmascaramiento completo\n`;
        script += `UPDATE ${rule.table_name}\n`;
        script += `SET ${rule.column_name} = 'XXXX'\n`;
        script += `WHERE ${rule.column_name} IS NOT NULL;\n\n`;
        break;
      
      case 'PARTIAL_MASK':
        const visibleChars = rule.visible_characters || 2;
        script += `-- Actualización para aplicar enmascaramiento parcial (primeros ${visibleChars} caracteres visibles)\n`;
        script += `UPDATE ${rule.table_name}\n`;
        script += `SET ${rule.column_name} = CASE\n`;
        script += `    WHEN LENGTH(${rule.column_name}) <= ${visibleChars} THEN ${rule.column_name}\n`;
        script += `    ELSE CONCAT(SUBSTRING(${rule.column_name}, 1, ${visibleChars}), REPEAT('X', LENGTH(${rule.column_name}) - ${visibleChars}))\n`;
        script += `END\n`;
        script += `WHERE ${rule.column_name} IS NOT NULL;\n\n`;
        break;
      
      case 'EMAIL_MASK':
        script += `-- Actualización para aplicar enmascaramiento de correo electrónico\n`;
        script += `UPDATE ${rule.table_name}\n`;
        script += `SET ${rule.column_name} = CASE\n`;
        script += `    WHEN ${rule.column_name} NOT LIKE '%@%' THEN 'XXX@example.com'\n`;
        script += `    WHEN LENGTH(SUBSTRING_INDEX(${rule.column_name}, '@', 1)) <= 2 THEN ${rule.column_name}\n`;
        script += `    ELSE CONCAT(LEFT(SUBSTRING_INDEX(${rule.column_name}, '@', 1), 2), 'XXX@', SUBSTRING_INDEX(${rule.column_name}, '@', -1))\n`;
        script += `END\n`;
        script += `WHERE ${rule.column_name} IS NOT NULL;\n\n`;
        break;
      
      case 'CREDIT_CARD_MASK':
        script += `-- Actualización para aplicar enmascaramiento de tarjeta de crédito\n`;
        script += `UPDATE ${rule.table_name}\n`;
        script += `SET ${rule.column_name} = CASE\n`;
        script += `    WHEN LENGTH(${rule.column_name}) < 4 THEN 'XXXX-XXXX-XXXX-XXXX'\n`;
        script += `    ELSE CONCAT('XXXX-XXXX-XXXX-', RIGHT(${rule.column_name}, 4))\n`;
        script += `END\n`;
        script += `WHERE ${rule.column_name} IS NOT NULL;\n\n`;
        break;
      
      case 'RANDOM':
        script += `-- Actualización para aplicar valores aleatorios\n`;
        script += `UPDATE ${rule.table_name}\n`;
        script += `SET ${rule.column_name} = CONCAT('RANDOM_', FLOOR(RAND() * 10000))\n`;
        script += `WHERE ${rule.column_name} IS NOT NULL;\n\n`;
        break;
      
      default:
        script += `-- No se pudo generar un script para el tipo de enmascaramiento: ${rule.masking_type}\n`;
        break;
    }
    
    // Agregar comentario final
    script += `-- Fin del script de enmascaramiento para ${rule.column_name}\n`;
    
    return script;
  }

  // Formatear el tipo de enmascaramiento para mostrar
  formatMaskingType(type: string): string {
    switch (type) {
      case 'FULL_MASK':
        return 'Enmascaramiento completo';
      case 'PARTIAL_MASK':
        return 'Enmascaramiento parcial';
      case 'EMAIL_MASK':
        return 'Correo electrónico';
      case 'CREDIT_CARD_MASK':
        return 'Tarjeta de crédito';
      case 'RANDOM':
        return 'Valor aleatorio';
      default:
        return type;
    }
  }

  // Método auxiliar para obtener reglas del localStorage
  private getLocalRules(): MaskingRule[] {
    const rulesJson = localStorage.getItem('maskingRules');
    return rulesJson ? JSON.parse(rulesJson) : [];
  }
} 