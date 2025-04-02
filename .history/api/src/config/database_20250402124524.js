const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos SQL Server
const dbConfig = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_SERVER,
  database: process.env.SQLSERVER_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;

// Inicializar el pool de conexiones
async function initialize() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Pool de conexiones a SQL Server inicializado correctamente');
  } catch (err) {
    console.error('Error al inicializar el pool de conexiones a SQL Server:', err);
    throw err;
  }
}

// Obtener una conexión del pool
async function getConnection() {
  try {
    if (!pool) {
      await initialize();
    }
    return pool;
  } catch (err) {
    console.error('Error al obtener conexión de SQL Server:', err);
    throw err;
  }
}

// Cerrar el pool de conexiones
async function closePool() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Pool de conexiones a SQL Server cerrado correctamente');
    }
  } catch (err) {
    console.error('Error al cerrar el pool de conexiones:', err);
    throw err;
  }
}

// Ejecutar consulta SQL con parámetros
async function executeQuery(sql, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros a la solicitud
    Object.keys(params).forEach(key => {
      // Solo agregar parámetros que no sean objetos complejos
      if (params[key] !== null && typeof params[key] !== 'object') {
        request.input(key, params[key]);
      }
    });
    
    const result = await request.query(sql);
    return {
      rows: result.recordset,
      rowsAffected: result.rowsAffected[0]
    };
  } catch (err) {
    console.error('Error al ejecutar consulta:', err);
    throw err;
  }
}

// Ejecutar procedimiento almacenado
async function executeProcedure(procedure, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros a la solicitud
    Object.keys(params).forEach(key => {
      // Solo agregar parámetros que no sean objetos complejos
      if (params[key] !== null && typeof params[key] !== 'object') {
        request.input(key, params[key]);
      }
    });
    
    const result = await request.execute(procedure);
    return {
      rows: result.recordset,
      rowsAffected: result.rowsAffected[0],
      output: result.output,
      returnValue: result.returnValue
    };
  } catch (err) {
    console.error('Error al ejecutar procedimiento:', err);
    throw err;
  }
}

module.exports = {
  initialize,
  getConnection,
  closePool,
  executeQuery,
  executeProcedure,
  sql
}; 