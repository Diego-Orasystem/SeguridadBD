const db = require('../config/database');

/**
 * Obtener todas las tablas del esquema
 */
exports.getTables = async (req, res) => {
  try {
    const schema = req.query.schema || req.user.username.toUpperCase();
    
    const result = await db.executeQuery(
      `SELECT table_name 
       FROM all_tables 
       WHERE owner = :schema 
       ORDER BY table_name`,
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
    const schema = req.query.schema || req.user.username.toUpperCase();

    const result = await db.executeQuery(
      `SELECT column_name, data_type, data_length, nullable
       FROM all_tab_columns 
       WHERE owner = :schema 
       AND table_name = :tableName 
       ORDER BY column_id`,
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
    const schema = req.query.schema || req.user.username.toUpperCase();
    const limit = req.query.limit || 10;

    // Obtener los datos con ROWNUM para limitar resultados
    const result = await db.executeQuery(
      `SELECT * FROM ${schema}.${tableName} WHERE ROWNUM <= :limit`,
      { limit },
      { maxRows: limit }
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      metadata: result.metaData
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
    // Obtener todos los esquemas a los que el usuario tiene acceso
    const result = await db.executeQuery(
      `SELECT DISTINCT owner 
       FROM all_tables 
       WHERE owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'MDSYS', 'ORDSYS', 'CTXSYS', 'DSSYS', 'DBSNMP', 'XDB')
       ORDER BY owner`
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
    await db.executeQuery('SELECT 1 FROM DUAL');
    
    res.status(200).json({
      success: true,
      message: 'Conexión a la base de datos establecida correctamente'
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