const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuración de la base de datos Oracle
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  autoCommit: false
};

/**
 * Función principal para ejecutar el script SQL
 */
async function createTestDatabase() {
  let connection;

  try {
    console.log('Conectando a la base de datos Oracle...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conexión establecida correctamente');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'create_test_db.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Dividir el script en instrucciones individuales
    const statements = sqlScript.split(';');

    // Ejecutar cada instrucción
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        try {
          // Si la instrucción contiene un comando PL/SQL (bloques BEGIN...END)
          if (statement.toUpperCase().includes('BEGIN')) {
            await connection.execute(statement);
          } 
          // Si es una instrucción SQL normal
          else {
            await connection.execute(statement);
          }
        } catch (error) {
          console.error(`Error al ejecutar la instrucción #${i + 1}:`, error.message);
          console.error('Instrucción:', statement);
        }
      }
    }

    // Hacer commit de los cambios
    await connection.commit();
    console.log('Base de datos de prueba creada correctamente');

  } catch (error) {
    console.error('Error:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Rollback ejecutado');
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Conexión cerrada');
      } catch (closeError) {
        console.error('Error al cerrar la conexión:', closeError);
      }
    }
  }
}

// Ejecutar la función principal
createTestDatabase()
  .then(() => {
    console.log('Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error no controlado:', error);
    process.exit(1);
  }); 