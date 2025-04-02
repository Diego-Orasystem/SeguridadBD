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
    
    // Paso 1: Crear una tabla temporal para almacenar los datos originales
    script += `-- Paso 1: Crear una tabla temporal para almacenar los datos originales\n`;
    script += `IF EXISTS (SELECT * FROM sys.views WHERE name = '${rule.table_name}_masked')\n`;
    script += `  DROP VIEW ${rule.table_name}_masked;\nGO\n\n`;
    
    script += `IF EXISTS (SELECT * FROM sys.triggers WHERE name = '${rule.table_name}_masked_insert')\n`;
    script += `  DROP TRIGGER ${rule.table_name}_masked_insert;\nGO\n\n`;
    
    script += `IF EXISTS (SELECT * FROM sys.triggers WHERE name = '${rule.table_name}_masked_update')\n`;
    script += `  DROP TRIGGER ${rule.table_name}_masked_update;\nGO\n\n`;
    
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
    
    // Paso 2: Crear la vista con datos enmascarados
    script += `-- Paso 2: Crear la vista con datos enmascarados\n`;
    script += `CREATE VIEW ${rule.table_name}_masked AS\n`;
    script += `SELECT\n`;
    script += `  ${maskingExpression},\n`;
    
    // Incorporar las columnas más comunes para una tabla de usuarios
    if (rule.table_name === 'usuarios') {
      script += `  t.id,\n`;
      script += `  t.username,\n`;
      script += `  t.password,\n`;
      if (rule.column_name !== 'email') {
        script += `  t.email,\n`;
      }
      script += `  t.is_active,\n`;
      script += `  t.created_at,\n`;
      script += `  t.updated_at\n`;
    } else {
      script += `  t.id,\n`;
      script += `  -- IMPORTANTE: Añadir aquí todas las demás columnas excepto ${rule.column_name}\n`;
      script += `  -- Ejemplo: t.nombre, t.apellido, t.telefono, etc.\n`;
      script += `  t.created_at,\n`;
      script += `  t.updated_at\n`;
    }
    
    script += `FROM ${rule.table_name} t;\nGO\n\n`;
    
    // Paso 3: Crear trigger INSERT
    script += `-- Paso 3: Crear trigger para INSERT\n`;
    script += `CREATE TRIGGER ${rule.table_name}_masked_insert\n`;
    script += `ON ${rule.table_name}_masked\n`;
    script += `INSTEAD OF INSERT\n`;
    script += `AS\n`;
    script += `BEGIN\n`;
    script += `  SET NOCOUNT ON;\n\n`;
    
    script += `  INSERT INTO ${rule.table_name} (\n`;
    
    // Lista de columnas para INSERT
    if (rule.table_name === 'usuarios') {
      script += `    ${rule.column_name},\n`;
      script += `    id,\n`;
      script += `    username,\n`;
      script += `    password,\n`;
      if (rule.column_name !== 'email') {
        script += `    email,\n`;
      }
      script += `    is_active,\n`;
      script += `    created_at,\n`;
      script += `    updated_at\n`;
      script += `  )\n`;
      script += `  SELECT\n`;
      script += `    ${rule.column_name},\n`;
      script += `    id,\n`;
      script += `    username,\n`;
      script += `    password,\n`;
      if (rule.column_name !== 'email') {
        script += `    email,\n`;
      }
      script += `    is_active,\n`;
      script += `    created_at,\n`;
      script += `    updated_at\n`;
    } else {
      script += `    ${rule.column_name},\n`;
      script += `    id,\n`;
      script += `    -- IMPORTANTE: Añadir aquí todas las demás columnas excepto ${rule.column_name}\n`;
      script += `    -- Ejemplo: nombre, apellido, telefono, etc.\n`;
      script += `    created_at,\n`;
      script += `    updated_at\n`;
      script += `  )\n`;
      script += `  SELECT\n`;
      script += `    ${rule.column_name},\n`;
      script += `    id,\n`;
      script += `    -- IMPORTANTE: Añadir aquí todas las demás columnas excepto ${rule.column_name}\n`;
      script += `    -- Ejemplo: nombre, apellido, telefono, etc.\n`;
      script += `    created_at,\n`;
      script += `    updated_at\n`;
    }
    
    script += `  FROM inserted;\n`;
    script += `END;\nGO\n\n`;
    
    // Paso 4: Crear trigger UPDATE
    script += `-- Paso 4: Crear trigger para UPDATE\n`;
    script += `CREATE TRIGGER ${rule.table_name}_masked_update\n`;
    script += `ON ${rule.table_name}_masked\n`;
    script += `INSTEAD OF UPDATE\n`;
    script += `AS\n`;
    script += `BEGIN\n`;
    script += `  SET NOCOUNT ON;\n\n`;
    
    script += `  UPDATE t SET\n`;
    
    // Lista de columnas para UPDATE
    if (rule.table_name === 'usuarios') {
      script += `    t.${rule.column_name} = i.${rule.column_name},\n`;
      script += `    t.username = i.username,\n`;
      script += `    t.password = i.password,\n`;
      if (rule.column_name !== 'email') {
        script += `    t.email = i.email,\n`;
      }
      script += `    t.is_active = i.is_active,\n`;
      script += `    t.created_at = i.created_at,\n`;
      script += `    t.updated_at = i.updated_at\n`;
    } else {
      script += `    t.${rule.column_name} = i.${rule.column_name},\n`;
      script += `    -- IMPORTANTE: Añadir aquí todas las demás columnas excepto ${rule.column_name}\n`;
      script += `    -- Ejemplo: t.nombre = i.nombre, t.apellido = i.apellido, etc.\n`;
      script += `    t.created_at = i.created_at,\n`;
      script += `    t.updated_at = i.updated_at\n`;
    }
    
    script += `  FROM ${rule.table_name} t\n`;
    script += `  INNER JOIN inserted i ON t.id = i.id;\n`;
    script += `END;\nGO\n\n`;
    
    // Paso 5: Verificar la vista
    script += `-- Paso 5: Verificar la vista - mostrar primeros 5 registros con datos enmascarados\n`;
    script += `SELECT TOP 5 * FROM ${rule.table_name}_masked;\n`;
    script += `GO\n\n`;
    
    // Instrucciones para implementación en producción
    script += `-- INSTRUCCIONES PARA IMPLEMENTACIÓN EN PRODUCCIÓN\n\n`;
    
    // Paso 6: Guardar tabla original (opcional, para respaldo)
    script += `-- Paso 6: Guardar tabla original (OPCIONAL - solo para respaldo)\n`;
    script += `-- SELECT * INTO ${rule.table_name}_backup FROM ${rule.table_name};\n`;
    script += `-- GO\n\n`;
    
    // Paso 7: Implementar la vista en producción
    script += `-- Paso 7: Implementar la vista en producción (ejecutar cuando esté listo)\n`;
    script += `-- Opción 1: Modificar permisos para usar solo la vista enmascarada\n`;
    script += `-- GRANT SELECT ON ${rule.table_name}_masked TO [rol_usuario];\n`;
    script += `-- DENY SELECT ON ${rule.table_name} TO [rol_usuario];\n\n`;
    
    script += `-- Opción 2: Renombrar objetos (NO RECOMENDADO - puede causar problemas de referencia)\n`;
    script += `-- EXEC sp_rename '${rule.table_name}', '${rule.table_name}_original';\n`;
    script += `-- EXEC sp_rename '${rule.table_name}_masked', '${rule.table_name}';\n`;
    script += `-- GO\n\n`;
    
    // Comentario final
    script += `-- IMPORTANTE: Este script está preconfigurado para la tabla '${rule.table_name}'.\n`;
    script += `-- La mejor práctica es dar permisos solo a la vista enmascarada y no renombrar objetos.\n`;
    script += `-- El renombrado puede causar errores de referencia circular y otros problemas.\n`;
    
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