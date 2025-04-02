const oracledb = require('oracledb');
const dotenv = require('dotenv');

dotenv.config();

// Configurar el modo de autocommit
oracledb.autoCommit = true;

// Configuración de la base de datos Oracle
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  // Para incluir los metadatos en los resultados de las consultas
  extendedMetaData: true
};

// Inicializar el pool de conexiones
async function initialize() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolAlias: 'default',
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60
    });
    console.log('Pool de conexiones a Oracle inicializado correctamente');
  } catch (err) {
    console.error('Error al inicializar el pool de conexiones a Oracle:', err);
    throw err;
  }
}

// Obtener una conexión del pool
async function getConnection() {
  try {
    const connection = await oracledb.getConnection('default');
    return connection;
  } catch (err) {
    console.error('Error al obtener conexión de Oracle:', err);
    throw err;
  }
}

// Cerrar el pool de conexiones
async function closePool() {
  try {
    await oracledb.getPool().close(10);
    console.log('Pool de conexiones a Oracle cerrado correctamente');
  } catch (err) {
    console.error('Error al cerrar el pool de conexiones:', err);
    throw err;
  }
}

// Ejecutar consulta SQL con parámetros
async function executeQuery(sql, params = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });
    return result;
  } catch (err) {
    console.error('Error al ejecutar consulta:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar conexión:', err);
      }
    }
  }
}

module.exports = {
  initialize,
  getConnection,
  closePool,
  executeQuery,
  oracledb
}; 