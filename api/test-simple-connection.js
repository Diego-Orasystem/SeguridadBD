/**
 * Script simple para probar la conexión a la base de datos
 */
const sql = require('mssql');
require('dotenv').config();

async function testSimpleConnection() {
  // Configuración de la conexión
  const config = {
    server: process.env.SQLSERVER_SERVER || 'seguridad.database.windows.net',
    database: process.env.SQLSERVER_DATABASE || 'SeguridadBD',
    user: process.env.SQLSERVER_USER || 'orasystem',
    password: process.env.SQLSERVER_PASSWORD,
    port: 1433,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 30000
    }
  };

  console.log('Configuración de conexión:');
  console.log(`- Servidor: ${config.server}`);
  console.log(`- Base de datos: ${config.database}`);
  console.log(`- Usuario: ${config.user}`);
  console.log(`- Contraseña: ${'*'.repeat(config.password?.length || 0)}`);

  try {
    console.log('Intentando conectar a la base de datos...');
    const pool = await sql.connect(config);
    console.log('¡Conexión exitosa!');
    
    // Intentar una consulta simple para verificar permisos
    try {
      console.log('Ejecutando una consulta simple...');
      const result = await pool.request().query('SELECT @@VERSION AS version');
      console.log('Versión de SQL Server:', result.recordset[0].version);
    } catch (queryError) {
      console.error('Error al ejecutar consulta simple:', queryError);
    }
    
    await pool.close();
    console.log('Conexión cerrada correctamente');
  } catch (error) {
    console.error('Error al conectar a la base de datos:');
    console.error(error);
  }
}

// Ejecutar el test
testSimpleConnection().catch(err => {
  console.error('Error inesperado:', err);
}); 