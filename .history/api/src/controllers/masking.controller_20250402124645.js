const db = require('../config/database');

/**
 * Crear una nueva regla de enmascaramiento
 */
exports.createMaskingRule = async (req, res) => {
  const { tableName, columnName, maskingType, visibleChars, schema } = req.body;

  // Validación de datos de entrada
  if (!tableName || !columnName || !maskingType) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren nombre de tabla, columna y tipo de enmascaramiento'
    });
  }

  try {
    // Crear entrada en la tabla de reglas de enmascaramiento
    const result = await db.executeQuery(
      `INSERT INTO masking_rules 
        (table_name, column_name, masking_type, visible_chars, schema_name, created_by, created_at) 
       VALUES 
        (@tableName, @columnName, @maskingType, @visibleChars, @schema, @userId, GETDATE());
       SELECT SCOPE_IDENTITY() AS id;`,
      { 
        tableName, 
        columnName, 
        maskingType, 
        visibleChars: visibleChars || null, 
        schema: schema || req.user.username.toUpperCase(),
        userId: req.user.id
      }
    );

    const ruleId = result.rows[0].id;

    res.status(201).json({
      success: true,
      message: 'Regla de enmascaramiento creada correctamente',
      data: {
        id: ruleId,
        tableName,
        columnName,
        maskingType,
        visibleChars,
        schema: schema || req.user.username.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Error al crear regla de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear regla de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Obtener todas las reglas de enmascaramiento
 */
exports.getMaskingRules = async (req, res) => {
  try {
    const result = await db.executeQuery(
      `SELECT mr.id, mr.table_name, mr.column_name, mr.masking_type, 
              mr.visible_chars, mr.schema_name, mr.is_applied,
              u.username as created_by_user, mr.created_at, mr.updated_at
       FROM masking_rules mr
       JOIN usuarios u ON mr.created_by = u.id
       ORDER BY mr.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener reglas de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reglas de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Obtener una regla de enmascaramiento por ID
 */
exports.getMaskingRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.executeQuery(
      `SELECT mr.id, mr.table_name, mr.column_name, mr.masking_type, 
              mr.visible_chars, mr.schema_name, mr.is_applied,
              u.username as created_by_user, mr.created_at, mr.updated_at
       FROM masking_rules mr
       JOIN usuarios u ON mr.created_by = u.id
       WHERE mr.id = @id`,
      { id }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener regla de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener regla de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Actualizar una regla de enmascaramiento
 */
exports.updateMaskingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { maskingType, visibleChars } = req.body;

    // Validación de datos
    if (!maskingType) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere tipo de enmascaramiento'
      });
    }

    // Verificar si la regla existe
    const checkRule = await db.executeQuery(
      'SELECT * FROM masking_rules WHERE id = @id',
      { id }
    );

    if (checkRule.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    // Actualizar la regla
    await db.executeQuery(
      `UPDATE masking_rules 
       SET masking_type = @maskingType, 
           visible_chars = @visibleChars,
           updated_at = GETDATE()
       WHERE id = @id`,
      { 
        id, 
        maskingType, 
        visibleChars: visibleChars || null 
      }
    );

    // Si la regla ya está aplicada, actualizar la vista
    if (checkRule.rows[0].is_applied === 'Y') {
      await updateMaskingView(checkRule.rows[0].schema_name, 
                               checkRule.rows[0].table_name,
                               checkRule.rows[0].column_name,
                               maskingType,
                               visibleChars);
    }

    res.status(200).json({
      success: true,
      message: 'Regla de enmascaramiento actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar regla de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar regla de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Eliminar una regla de enmascaramiento
 */
exports.deleteMaskingRule = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la regla existe
    const checkRule = await db.executeQuery(
      'SELECT * FROM masking_rules WHERE id = @id',
      { id }
    );

    if (checkRule.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    const rule = checkRule.rows[0];

    // Si la regla está aplicada, primero eliminar la vista y triggers
    if (rule.is_applied === 'Y') {
      await removeMaskingView(rule.schema_name, rule.table_name);
    }

    // Eliminar la regla
    await db.executeQuery(
      'DELETE FROM masking_rules WHERE id = @id',
      { id }
    );

    res.status(200).json({
      success: true,
      message: 'Regla de enmascaramiento eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar regla de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar regla de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Aplicar enmascaramiento a una tabla
 */
exports.applyMasking = async (req, res) => {
  try {
    const { ruleId } = req.body;

    if (!ruleId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID de regla'
      });
    }

    // Obtener la regla de enmascaramiento
    const ruleResult = await db.executeQuery(
      'SELECT * FROM masking_rules WHERE id = @ruleId',
      { ruleId }
    );

    if (ruleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    const rule = ruleResult.rows[0];

    // Verificar si la regla ya está aplicada
    if (rule.is_applied === 'Y') {
      return res.status(400).json({
        success: false,
        message: 'La regla de enmascaramiento ya está aplicada'
      });
    }

    // Aplicar el enmascaramiento (crear vista y configurar)
    await applyMaskingView(
      rule.schema_name,
      rule.table_name,
      rule.column_name,
      rule.masking_type,
      rule.visible_chars
    );

    // Actualizar el estado de la regla
    await db.executeQuery(
      `UPDATE masking_rules SET is_applied = 'Y', updated_at = GETDATE() WHERE id = @ruleId`,
      { ruleId }
    );

    res.status(200).json({
      success: true,
      message: 'Enmascaramiento aplicado correctamente',
      data: {
        schemaName: rule.schema_name,
        tableName: rule.table_name,
        columnName: rule.column_name
      }
    });
  } catch (error) {
    console.error('Error al aplicar enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Eliminar enmascaramiento de una tabla
 */
exports.removeMasking = async (req, res) => {
  try {
    const { ruleId } = req.body;

    if (!ruleId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID de regla'
      });
    }

    // Obtener la regla de enmascaramiento
    const ruleResult = await db.executeQuery(
      'SELECT * FROM masking_rules WHERE id = @ruleId',
      { ruleId }
    );

    if (ruleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    const rule = ruleResult.rows[0];

    // Verificar si la regla está aplicada
    if (rule.is_applied !== 'Y') {
      return res.status(400).json({
        success: false,
        message: 'La regla de enmascaramiento no está aplicada'
      });
    }

    // Eliminar el enmascaramiento (eliminar vista)
    await removeMaskingView(rule.schema_name, rule.table_name);

    // Actualizar el estado de la regla
    await db.executeQuery(
      `UPDATE masking_rules SET is_applied = 'N', updated_at = GETDATE() WHERE id = @ruleId`,
      { ruleId }
    );

    res.status(200).json({
      success: true,
      message: 'Enmascaramiento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Obtener vistas de enmascaramiento
 */
exports.getMaskingViews = async (req, res) => {
  try {
    const schema = req.query.schema || req.user.username.toUpperCase();

    // Consultar vistas de enmascaramiento
    const result = await db.executeQuery(
      `SELECT name AS view_name, definition AS text
       FROM sys.objects o
       JOIN sys.sql_modules m ON o.object_id = m.object_id
       WHERE o.type = 'V'
       AND SCHEMA_NAME(o.schema_id) = @schema
       AND o.name LIKE 'MASKED_%'`,
      { schema }
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener vistas de enmascaramiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vistas de enmascaramiento',
      error: error.message
    });
  }
};

/**
 * Configurar triggers para una vista enmascarada
 */
exports.configureTriggers = async (req, res) => {
  try {
    const { ruleId, operations } = req.body;

    // Validar datos de entrada
    if (!ruleId || !operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID de regla y operaciones (array)'
      });
    }

    // Validar operaciones permitidas
    const validOperations = ['INSERT', 'UPDATE', 'DELETE'];
    const invalidOps = operations.filter(op => !validOperations.includes(op.toUpperCase()));
    
    if (invalidOps.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Operaciones inválidas: ${invalidOps.join(', ')}`
      });
    }

    // Obtener la regla de enmascaramiento
    const ruleResult = await db.executeQuery(
      'SELECT * FROM masking_rules WHERE id = @ruleId',
      { ruleId }
    );

    if (ruleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Regla de enmascaramiento no encontrada'
      });
    }

    const rule = ruleResult.rows[0];

    // Verificar si la regla está aplicada
    if (rule.is_applied !== 'Y') {
      return res.status(400).json({
        success: false,
        message: 'Primero debe aplicar el enmascaramiento'
      });
    }

    // Crear triggers para las operaciones seleccionadas
    await createMaskingTriggers(
      rule.schema_name,
      rule.table_name,
      operations
    );

    // Registrar las operaciones configuradas
    await db.executeQuery(
      `UPDATE masking_rules 
       SET trigger_operations = @operations, 
           updated_at = GETDATE() 
       WHERE id = @ruleId`,
      { ruleId, operations: operations.join(',') }
    );

    res.status(200).json({
      success: true,
      message: 'Triggers configurados correctamente',
      data: {
        tableName: rule.table_name,
        operations
      }
    });
  } catch (error) {
    console.error('Error al configurar triggers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar triggers',
      error: error.message
    });
  }
};

// ===== Funciones auxiliares =====

/**
 * Aplicar vista de enmascaramiento
 */
async function applyMaskingView(schema, tableName, columnName, maskingType, visibleChars) {
  try {
    const pool = await db.getConnection();

    try {
      // Obtener todas las columnas de la tabla
      const columnsResult = await pool.request()
        .input('schema', schema)
        .input('tableName', tableName)
        .query(`
          SELECT column_name 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = @schema 
          AND TABLE_NAME = @tableName 
          ORDER BY ORDINAL_POSITION
        `);

      // Generar la función de enmascaramiento según el tipo
      let maskingFunction;
      
      switch (maskingType.toUpperCase()) {
        case 'CREDIT_CARD':
          maskingFunction = `CASE 
                              WHEN ${columnName} IS NULL THEN NULL 
                              ELSE LEFT(${columnName}, ${visibleChars || 4}) + REPLICATE('X', LEN(${columnName}) - ${visibleChars || 4}) 
                            END`;
          break;
          
        case 'EMAIL':
          maskingFunction = `CASE 
                              WHEN ${columnName} IS NULL THEN NULL 
                              ELSE LEFT(${columnName}, 2) + 'XXXX' + '@' + 
                                   SUBSTRING(${columnName}, CHARINDEX('@', ${columnName}) + 1, LEN(${columnName})) 
                            END`;
          break;
          
        case 'PHONE':
          maskingFunction = `CASE 
                              WHEN ${columnName} IS NULL THEN NULL 
                              ELSE LEFT(${columnName}, ${visibleChars || 3}) + REPLICATE('X', LEN(${columnName}) - ${visibleChars || 3}) 
                            END`;
          break;
          
        case 'FULL_MASK':
          maskingFunction = `CASE 
                              WHEN ${columnName} IS NULL THEN NULL 
                              ELSE REPLICATE('X', LEN(${columnName})) 
                            END`;
          break;
          
        default:
          maskingFunction = `CASE 
                              WHEN ${columnName} IS NULL THEN NULL 
                              ELSE LEFT(${columnName}, ${visibleChars || 2}) + REPLICATE('X', LEN(${columnName}) - ${visibleChars || 2}) 
                            END`;
      }

      // Construir la definición de columnas para la vista
      const columnDefinitions = columnsResult.recordset.map(col => {
        if (col.column_name === columnName) {
          return `${maskingFunction} AS ${columnName}`;
        }
        return col.column_name;
      }).join(', ');

      // Renombrar la tabla original
      await pool.request().query(
        `EXEC sp_rename '${schema}.${tableName}', 'ORIGINAL_${tableName}'`
      );

      // Crear la vista con el nombre original de la tabla
      await pool.request().query(
        `CREATE VIEW ${schema}.${tableName} AS 
         SELECT ${columnDefinitions} 
         FROM ${schema}.ORIGINAL_${tableName}`
      );

    } catch (error) {
      // En caso de error, intentar restaurar la tabla original
      try {
        await pool.request().query(
          `EXEC sp_rename '${schema}.ORIGINAL_${tableName}', '${tableName}'`
        );
      } catch (renameError) {
        console.error('Error al restaurar tabla original:', renameError);
      }
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Actualizar vista de enmascaramiento
 */
async function updateMaskingView(schema, tableName, columnName, maskingType, visibleChars) {
  try {
    // Eliminar vista actual
    await removeMaskingView(schema, tableName, false);
    
    // Crear nueva vista con configuración actualizada
    await applyMaskingView(schema, tableName, columnName, maskingType, visibleChars);
  } catch (error) {
    throw error;
  }
}

/**
 * Eliminar vista de enmascaramiento
 */
async function removeMaskingView(schema, tableName, restoreOriginal = true) {
  const pool = await db.getConnection();
  
  try {
    // Eliminar triggers asociados a la vista
    try {
      await pool.request().query(`DROP TRIGGER ${schema}.MASKED_TRG_INSERT_${tableName}`);
    } catch (err) {
      // Ignorar error si el trigger no existe
    }
    
    try {
      await pool.request().query(`DROP TRIGGER ${schema}.MASKED_TRG_UPDATE_${tableName}`);
    } catch (err) {
      // Ignorar error si el trigger no existe
    }
    
    try {
      await pool.request().query(`DROP TRIGGER ${schema}.MASKED_TRG_DELETE_${tableName}`);
    } catch (err) {
      // Ignorar error si el trigger no existe
    }

    // Eliminar la vista
    try {
      await pool.request().query(`DROP VIEW ${schema}.${tableName}`);
    } catch (err) {
      // Ignorar error si la vista no existe
    }

    // Restaurar la tabla original si se requiere
    if (restoreOriginal) {
      await pool.request().query(
        `EXEC sp_rename '${schema}.ORIGINAL_${tableName}', '${tableName}'`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Crear triggers para una vista de enmascaramiento
 */
async function createMaskingTriggers(schema, tableName, operations) {
  const pool = await db.getConnection();
  
  try {
    // Crear triggers según las operaciones seleccionadas
    if (operations.includes('INSERT')) {
      await pool.request().query(
        `CREATE TRIGGER ${schema}.MASKED_TRG_INSERT_${tableName}
         ON ${schema}.${tableName}
         INSTEAD OF INSERT
         AS
         BEGIN
           INSERT INTO ${schema}.ORIGINAL_${tableName}
           SELECT * FROM inserted;
         END;`
      );
    }
    
    if (operations.includes('UPDATE')) {
      await pool.request().query(
        `CREATE TRIGGER ${schema}.MASKED_TRG_UPDATE_${tableName}
         ON ${schema}.${tableName}
         INSTEAD OF UPDATE
         AS
         BEGIN
           UPDATE o
           SET o.* = i.*
           FROM ${schema}.ORIGINAL_${tableName} o
           INNER JOIN inserted i ON o.ID = i.ID;
         END;`
      );
    }
    
    if (operations.includes('DELETE')) {
      await pool.request().query(
        `CREATE TRIGGER ${schema}.MASKED_TRG_DELETE_${tableName}
         ON ${schema}.${tableName}
         INSTEAD OF DELETE
         AS
         BEGIN
           DELETE o
           FROM ${schema}.ORIGINAL_${tableName} o
           INNER JOIN deleted d ON o.ID = d.ID;
         END;`
      );
    }
  } catch (error) {
    throw error;
  }
} 