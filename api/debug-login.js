/**
 * Script para probar el inicio de sesión directamente
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

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

async function debugLogin() {
  let pool;
  
  try {
    console.log('Conectando a la base de datos...');
    pool = await sql.connect(config);
    console.log('Conexión exitosa!');
    
    // Datos de prueba para el login
    const username = 'admin';
    const password = 'admin123';
    
    console.log(`Intentando login con usuario: ${username}`);
    
    // Buscar el usuario
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM usuarios WHERE username = @username');
    
    if (result.recordset.length === 0) {
      console.log('Error: Usuario no encontrado');
      return;
    }
    
    const user = result.recordset[0];
    console.log('Usuario encontrado:', user);
    
    // Verificar la contraseña (sin encriptar, solo para depuración)
    console.log('Contraseña almacenada:', user.password);
    
    try {
      // Verificar la contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      console.log('¿Contraseña válida?', validPassword);
      
      if (validPassword) {
        // Generar token JWT
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            email: user.email 
          },
          process.env.API_SECRET || 'mi_secret_para_jwt',
          { expiresIn: '24h' }
        );
        
        console.log('Token generado correctamente:', token);
        console.log('Login exitoso!');
      } else {
        console.log('Error: Contraseña incorrecta');
      }
    } catch (bcryptError) {
      console.error('Error en la verificación de contraseña:', bcryptError);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log('Conexión cerrada correctamente');
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
}

// Ejecutar la función
debugLogin()
  .then(() => {
    console.log('Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  }); 