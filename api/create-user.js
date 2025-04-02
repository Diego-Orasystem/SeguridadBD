/**
 * Script para crear un usuario de prueba en la base de datos
 */
const bcrypt = require('bcrypt');
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

async function createUser() {
  let pool;
  
  try {
    console.log('Conectando a la base de datos...');
    pool = await sql.connect(config);
    console.log('Conexión exitosa!');
    
    // Verificar si la tabla usuarios existe
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'usuarios'
    `);
    
    if (tableCheck.recordset[0].count === 0) {
      console.log('La tabla de usuarios no existe. Creándola...');
      await pool.request().query(`
        CREATE TABLE dbo.usuarios (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(50) NOT NULL UNIQUE,
          password NVARCHAR(100) NOT NULL,
          email NVARCHAR(100),
          is_active CHAR(1) DEFAULT 'Y',
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        )
      `);
      console.log('Tabla de usuarios creada correctamente');
    } else {
      console.log('La tabla de usuarios ya existe');
    }
    
    // Verificar si el usuario admin ya existe
    const adminCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM dbo.usuarios WHERE username = 'admin'
    `);
    
    if (adminCheck.recordset[0].count === 0) {
      console.log('Creando usuario admin...');
      
      // Encriptar la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Crear usuario admin
      await pool.request()
        .input('username', sql.NVarChar, 'admin')
        .input('password', sql.NVarChar, hashedPassword)
        .input('email', sql.NVarChar, 'admin@example.com')
        .query(`
          INSERT INTO dbo.usuarios (username, password, email, is_active)
          VALUES (@username, @password, @email, 'Y')
        `);
      
      console.log('Usuario admin creado correctamente');
    } else {
      console.log('El usuario admin ya existe');
    }
    
    // Obtener todos los usuarios para verificar
    const users = await pool.request().query(`
      SELECT id, username, email, is_active, created_at FROM dbo.usuarios
    `);
    
    console.log('Usuarios en la base de datos:');
    users.recordset.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Activo: ${user.is_active}`);
    });
    
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
createUser()
  .then(() => {
    console.log('Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  }); 