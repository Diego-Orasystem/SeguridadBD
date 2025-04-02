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
        const ruleWithoutType = rule as Record<string, any>;
        ruleWithoutType['is_applied'] = true;
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
        const ruleWithoutType = rule as Record<string, any>;
        ruleWithoutType['is_applied'] = false;
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
        const ruleWithoutType = rule as Record<string, any>;
        ruleWithoutType['triggers'] = config.operations;
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
    const ruleWithoutType = rule as Record<string, any>;
    
    // Comentarios iniciales
    script += `-- Script para aplicar enmascaramiento a ${rule.column_name} en la tabla ${rule.table_name}\n`;
    script += `-- Tipo de enmascaramiento: ${this.formatMaskingType(rule.masking_type)}\n`;
    script += `-- Basado en técnica de respaldo de tabla y reemplazo\n\n`;
    
    // Expresión de enmascaramiento
    let maskingExpression = '';
    switch (rule.masking_type) {
      case 'FULL_MASK':
        maskingExpression = `'XXXX'`;
        break;
      
      case 'PARTIAL_MASK':
        const visibleChars = ruleWithoutType['visible_characters'] || 2;
        maskingExpression = `CASE
    WHEN LEN(${rule.column_name}) <= ${visibleChars} THEN ${rule.column_name}
    ELSE LEFT(${rule.column_name}, ${visibleChars}) + REPLICATE('X', LEN(${rule.column_name}) - ${visibleChars})
  END`;
        break;
      
      case 'EMAIL_MASK':
        maskingExpression = `CASE
    WHEN ${rule.column_name} NOT LIKE '%@%' THEN 'XXX@example.com'
    WHEN LEN(SUBSTRING(${rule.column_name}, 1, CHARINDEX('@', ${rule.column_name}) - 1)) <= 2 THEN ${rule.column_name}
    ELSE LEFT(SUBSTRING(${rule.column_name}, 1, CHARINDEX('@', ${rule.column_name}) - 1), 2) + 'XXX@' + SUBSTRING(${rule.column_name}, CHARINDEX('@', ${rule.column_name}) + 1, LEN(${rule.column_name}))
  END`;
        break;
      
      case 'CREDIT_CARD_MASK':
        maskingExpression = `CASE
    WHEN LEN(${rule.column_name}) < 4 THEN 'XXXX-XXXX-XXXX-XXXX'
    ELSE 'XXXX-XXXX-XXXX-' + RIGHT(${rule.column_name}, 4)
  END`;
        break;
      
      case 'RANDOM':
        maskingExpression = `'RANDOM_' + CAST(CAST(RAND() * 10000 AS INT) AS VARCHAR(10))`;
        break;
      
      default:
        maskingExpression = `'[MASKED]'`;
        break;
    }
    
    // Paso 1: Verificar si tenemos un respaldo de la tabla original
    script += `-- Paso 1: Verificar si existe respaldo de la tabla original\n`;
    script += `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${rule.table_name}_original')\n`;
    script += `BEGIN\n`;
    script += `  -- Aún no existe respaldo, así que respaldamos la tabla original\n`;
    script += `  PRINT 'Creando respaldo de la tabla original...'\n`;
    script += `  EXEC sp_rename '${rule.table_name}', '${rule.table_name}_original';\n`;
    script += `END\n`;
    script += `ELSE\n`;
    script += `BEGIN\n`;
    script += `  -- Ya existe un respaldo, verificar si existe la vista para eliminarla\n`;
    script += `  IF EXISTS (SELECT * FROM sys.views WHERE name = '${rule.table_name}')\n`;
    script += `  BEGIN\n`;
    script += `    PRINT 'Eliminando vista existente...';\n`;
    script += `    DROP VIEW ${rule.table_name};\n`;
    script += `  END\n`;
    script += `END\n`;
    script += `GO\n\n`;
    
    // Paso 2: Crear la vista con el nombre de la tabla original
    script += `-- Paso 2: Crear la vista con el mismo nombre que la tabla original\n`;
    script += `PRINT 'Creando vista enmascarada con el nombre de la tabla original...';\n`;
    script += `CREATE VIEW ${rule.table_name} AS\n`;
    script += `SELECT\n`;
    
    // Lista de columnas
    if (rule.table_name === 'usuarios') {
      script += `  id,\n`;
      script += `  username,\n`;
      script += `  password,\n`;
      
      // Aplicar enmascaramiento solo a la columna especificada
      if (rule.column_name === 'email') {
        script += `  ${maskingExpression} AS email,\n`;
      } else {
        script += `  email,\n`;
      }
      
      // Aplicar enmascaramiento a otras columnas si es necesario
      if (rule.column_name !== 'email') {
        script += `  ${maskingExpression} AS ${rule.column_name},\n`;
      }
      
      script += `  is_active,\n`;
      script += `  created_at,\n`;
      script += `  updated_at\n`;
    } else {
      script += `  id,\n`;
      
      // Aplicar enmascaramiento a la columna especificada
      script += `  ${maskingExpression} AS ${rule.column_name},\n`;
      
      script += `  -- IMPORTANTE: Añadir aquí todas las demás columnas excepto ${rule.column_name}\n`;
      script += `  -- Ejemplo: nombre, apellido, telefono, etc.\n`;
      script += `  created_at,\n`;
      script += `  updated_at\n`;
    }
    
    script += `FROM ${rule.table_name}_original;\n`;
    script += `GO\n\n`;
    
    // Paso 3: Verificar la vista
    script += `-- Paso 3: Verificar que la vista funciona correctamente\n`;
    script += `PRINT 'Verificando vista creada...';\n`;
    script += `SELECT TOP 5 * FROM ${rule.table_name};\n`;
    script += `GO\n\n`;
    
    // Instrucciones para revertir cambios
    script += `-- Para revertir los cambios (si es necesario):\n`;
    script += `--\n`;
    script += `-- -- Eliminar la vista\n`;
    script += `-- DROP VIEW ${rule.table_name};\n`;
    script += `-- -- Restaurar la tabla original\n`;
    script += `-- EXEC sp_rename '${rule.table_name}_original', '${rule.table_name}';\n`;
    script += `-- GO\n\n`;
    
    // Comentario final
    script += `-- IMPORTANTE: Este script implementa enmascaramiento mediante el siguiente proceso:\n`;
    script += `-- 1. Renombra la tabla original a '${rule.table_name}_original'\n`;
    script += `-- 2. Crea una vista con el nombre original de la tabla que enmascara los datos\n`;
    script += `-- 3. Todas las consultas seguirán funcionando pero ahora devolverán datos enmascarados\n`;
    
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