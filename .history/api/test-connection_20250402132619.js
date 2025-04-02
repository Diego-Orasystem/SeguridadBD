/**
 * Script para probar la conexión a Azure SQL Database
 */
const db = require('./src/config/database');

async function testConnection() {
  try {
    console.log('Probando conexión a la base de datos...');
    
    // Inicializar conexión a la base de datos
    await db.initialize();
    
    // Ejecutar una consulta simple
    const result = await db.executeQuery('SELECT @@VERSION AS version');
    
    console.log('Conexión exitosa!');
    console.log('Versión de SQL Server:', result.rows[0].version);
    
    // Probar si existe la tabla masking_rules
    try {
      const tablesResult = await db.executeQuery(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      
      console.log('\nTablas disponibles:');
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.TABLE_NAME}`);
      });
      
      // Verificar si existe la tabla masking_rules
      const hasMaskingRulesTable = tablesResult.rows.some(row => 
        row.TABLE_NAME.toLowerCase() === 'masking_rules'
      );
      
      if (!hasMaskingRulesTable) {
        console.log('\nLa tabla masking_rules no existe. ¿Deseas crearla? (Puedes ejecutar "npm run init-db" para inicializar la base de datos)');
      } else {
        console.log('\nLa tabla masking_rules ya existe.');
      }
    } catch (error) {
      console.error('Error al verificar tablas:', error.message);
    }
    
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
  } finally {
    // Cerrar pool de conexiones
    await db.closePool();
  }
}

// Ejecutar prueba de conexión
testConnection(); 