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
    script += `-- Basado en técnica de vistas y triggers para enmascaramiento de datos\n\n`;
    
    // Paso 1: Crear la vista con enmascaramiento (SQL Server)
    script += `-- Paso 1: Crear la vista con enmascaramiento\n`;
    script += `IF EXISTS (SELECT * FROM sys.views WHERE name = '${rule.table_name}_v')\n`;
    script += `  DROP VIEW ${rule.table_name}_v;\nGO\n\n`;
    script += `CREATE VIEW ${rule.table_name}_v AS\n`;
    script += `SELECT\n`;
    
    // Generar la expresión de enmascaramiento para la columna específica (SQL Server)
    let maskingExpression = '';
    switch (rule.masking_type) {
      case 'FULL_MASK':
        maskingExpression = `'XXXX' AS ${rule.column_name}`;
        break;
      
      case 'PARTIAL_MASK':
        const visibleChars = ruleWithoutType['visible_characters'] || 2;
        maskingExpression = `CASE\n`;
        maskingExpression += `    WHEN LEN(${rule.column_name}) <= ${visibleChars} THEN ${rule.column_name}\n`;
        maskingExpression += `    ELSE LEFT(${rule.column_name}, ${visibleChars}) + REPLICATE('X', LEN(${rule.column_name}) - ${visibleChars})\n`;
        maskingExpression += `  END AS ${rule.column_name}`;
        break;
      
      case 'EMAIL_MASK':
        maskingExpression = `CASE\n`;
        maskingExpression += `    WHEN ${rule.column_name} NOT LIKE '%@%' THEN 'XXX@example.com'\n`;
        maskingExpression += `    WHEN LEN(SUBSTRING(${rule.column_name}, 1, CHARINDEX('@', ${rule.column_name}) - 1)) <= 2 THEN ${rule.column_name}\n`;
        maskingExpression += `    ELSE LEFT(SUBSTRING(${rule.column_name}, 1, CHARINDEX('@', ${rule.column_name}) - 1), 2) + 'XXX@' + SUBSTRING(${rule.column_name}, CHARINDEX('@', ${rule.column_name}) + 1, LEN(${rule.column_name}))\n`;
        maskingExpression += `  END AS ${rule.column_name}`;
        break;
      
      case 'CREDIT_CARD_MASK':
        maskingExpression = `CASE\n`;
        maskingExpression += `    WHEN LEN(${rule.column_name}) < 4 THEN 'XXXX-XXXX-XXXX-XXXX'\n`;
        maskingExpression += `    ELSE 'XXXX-XXXX-XXXX-' + RIGHT(${rule.column_name}, 4)\n`;
        maskingExpression += `  END AS ${rule.column_name}`;
        break;
      
      case 'RANDOM':
        maskingExpression = `'RANDOM_' + CAST(CAST(RAND() * 10000 AS INT) AS VARCHAR(10)) AS ${rule.column_name}`;
        break;
      
      default:
        maskingExpression = `'[MASKED]' AS ${rule.column_name}`;
        break;
    }
    
    // Incluir la columna modificada y todas las demás columnas (excepto la que se enmascara)
    script += `  ${maskingExpression}`;
    
    // Seleccionar todas las columnas excepto la que estamos enmascarando
    script += `,\n  -- Seleccionar todas las demás columnas excepto la que se está enmascarando\n`;
    script += `  t.id\n`;
    script += `  -- Aquí deben incluirse todas las demás columnas de la tabla excepto ${rule.column_name}\n`;
    script += `  -- Ejemplo: , t.nombre, t.apellido, t.telefono, etc.\n`;
    script += `FROM ${rule.table_name} t;\nGO\n\n`;
    
    // Paso 2: Crear trigger para INSERT (SQL Server)
    script += `-- Paso 2: Crear trigger para permitir INSERT a través de la vista\n`;
    script += `IF EXISTS (SELECT * FROM sys.triggers WHERE name = '${rule.table_name}_v_insert')\n`;
    script += `  DROP TRIGGER ${rule.table_name}_v_insert;\nGO\n\n`;
    script += `CREATE TRIGGER ${rule.table_name}_v_insert\n`;
    script += `ON ${rule.table_name}_v\n`;
    script += `INSTEAD OF INSERT\n`;
    script += `AS\n`;
    script += `BEGIN\n`;
    script += `  SET NOCOUNT ON;\n`;
    script += `  INSERT INTO ${rule.table_name} (${rule.column_name}, id)\n`;
    script += `  SELECT ${rule.column_name}, id FROM inserted;\n`;
    script += `  -- Ampliar SELECT con las columnas necesarias para su tabla\n`;
    script += `END;\nGO\n\n`;
    
    // Paso 3: Crear trigger para UPDATE (SQL Server)
    script += `-- Paso 3: Crear trigger para permitir UPDATE a través de la vista\n`;
    script += `IF EXISTS (SELECT * FROM sys.triggers WHERE name = '${rule.table_name}_v_update')\n`;
    script += `  DROP TRIGGER ${rule.table_name}_v_update;\nGO\n\n`;
    script += `CREATE TRIGGER ${rule.table_name}_v_update\n`;
    script += `ON ${rule.table_name}_v\n`;
    script += `INSTEAD OF UPDATE\n`;
    script += `AS\n`;
    script += `BEGIN\n`;
    script += `  SET NOCOUNT ON;\n`;
    script += `  UPDATE t SET\n`;
    script += `    t.${rule.column_name} = i.${rule.column_name}\n`;
    script += `    -- Añada otras columnas con: , t.columna = i.columna\n`;
    script += `  FROM ${rule.table_name} t\n`;
    script += `  INNER JOIN inserted i ON t.id = i.id; -- Asumiendo que 'id' es la clave primaria\n`;
    script += `END;\nGO\n\n`;
    
    // Paso 4: Instrucciones para renombrar objetos (SQL Server)
    script += `-- Paso 4: Renombrar objetos (ejecutar cuando esté listo para aplicar el enmascaramiento)\n`;
    script += `-- EXEC sp_rename '${rule.table_name}', '${rule.table_name}_tbl';\n`;
    script += `-- EXEC sp_rename '${rule.table_name}_v', '${rule.table_name}';\n\n`;
    
    // Instrucciones para revertir cambios (SQL Server)
    script += `-- Para revertir los cambios (si es necesario):\n`;
    script += `-- DROP VIEW ${rule.table_name};\n`;
    script += `-- EXEC sp_rename '${rule.table_name}_tbl', '${rule.table_name}';\n\n`;
    
    // Comentario final importante
    script += `-- IMPORTANTE: Este script es una plantilla que debe ser adaptada.\n`;
    script += `-- 1. Debe incluir todas las columnas de la tabla excepto la que se está enmascarando.\n`;
    script += `-- 2. Asegúrese de usar la clave primaria correcta en los triggers (actualmente asume 'id').\n`;
    script += `-- 3. Modifique el script según la estructura específica de su tabla antes de ejecutarlo.\n`;
    
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