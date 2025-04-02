const db = require('../config/database');

/**
 * Obtener todas las tablas del esquema
 */
exports.getTables = async (req, res) => {
  try {
    const schema = req.query.schema || 'dbo';
    
    const result = await db.executeQuery(
      `SELECT TABLE_NAME as table_name 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = @schema 
       AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      { schema }
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener tablas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tablas de la base de datos',
      error: error.message
    });
  }
};

/**
 * Obtener columnas de una tabla específica
 */
exports.getTableColumns = async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = req.query.schema || 'dbo';

    const result = await db.executeQuery(
      `SELECT COLUMN_NAME as column_name, 
              DATA_TYPE as data_type, 
              CHARACTER_MAXIMUM_LENGTH as data_length, 
              IS_NULLABLE as nullable
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = @schema 
       AND TABLE_NAME = @tableName 
       ORDER BY ORDINAL_POSITION`,
      { schema, tableName }
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener columnas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener columnas de la tabla',
      error: error.message
    });
  }
};

/**
 * Obtener datos de muestra de una tabla
 */
exports.getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = req.query.schema || 'dbo';
    const limit = req.query.limit || 10;

    // Obtener los datos con TOP para limitar resultados
    const result = await db.executeQuery(
      `SELECT TOP (@limit) * FROM ${schema}.${tableName}`,
      { limit: parseInt(limit) }
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      metadata: result.rows && result.rows.length > 0 ? Object.keys(result.rows[0]) : []
    });
  } catch (error) {
    console.error('Error al obtener datos de la tabla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de la tabla',
      error: error.message
    });
  }
};

/**
 * Obtener esquemas disponibles
 */
exports.getSchemas = async (req, res) => {
  try {
    // Obtener todos los esquemas disponibles
    const result = await db.executeQuery(
      `SELECT DISTINCT SCHEMA_NAME as schema_name
       FROM INFORMATION_SCHEMA.SCHEMATA
       WHERE SCHEMA_NAME NOT IN ('INFORMATION_SCHEMA', 'sys', 'guest')
       ORDER BY SCHEMA_NAME`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener esquemas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener esquemas de la base de datos',
      error: error.message
    });
  }
};

/**
 * Verificar conexión a la base de datos
 */
exports.testConnection = async (req, res) => {
  try {
    // Ejecutar una consulta simple para verificar la conexión
    const result = await db.executeQuery('SELECT 1 as test');
    
    res.status(200).json({
      success: true,
      message: 'Conexión a la base de datos establecida correctamente',
      data: result.rows // Incluir datos para mantener consistencia
    });
  } catch (error) {
    console.error('Error al verificar conexión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
}; 