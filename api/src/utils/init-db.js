const db = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Script para inicializar la base de datos Oracle con las tablas necesarias
 */
async function initializeDatabase() {
  let connection;
  
  try {
    console.log('Inicializando base de datos...');
    
    // Inicializar el pool de conexiones
    await db.initialize();
    
    // Obtener una conexión
    connection = await db.getConnection();
    
    // Crear tabla de usuarios
    try {
      await connection.execute(`
        CREATE TABLE usuarios (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          username VARCHAR2(50) NOT NULL UNIQUE,
          password VARCHAR2(255) NOT NULL,
          email VARCHAR2(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
          updated_at TIMESTAMP
        )
      `);
      console.log('Tabla de usuarios creada correctamente');
    } catch (err) {
      if (err.message.includes('name is already used by an existing object')) {
        console.log('La tabla de usuarios ya existe');
      } else {
        throw err;
      }
    }
    
    // Crear tabla de reglas de enmascaramiento
    try {
      await connection.execute(`
        CREATE TABLE masking_rules (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          schema_name VARCHAR2(50) NOT NULL,
          table_name VARCHAR2(50) NOT NULL,
          column_name VARCHAR2(50) NOT NULL,
          masking_type VARCHAR2(50) NOT NULL,
          visible_chars NUMBER,
          is_applied CHAR(1) DEFAULT 'N',
          trigger_operations VARCHAR2(50),
          created_by NUMBER,
          created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
          updated_at TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES usuarios(id),
          CONSTRAINT unique_masking_rule UNIQUE (schema_name, table_name, column_name)
        )
      `);
      console.log('Tabla de reglas de enmascaramiento creada correctamente');
    } catch (err) {
      if (err.message.includes('name is already used by an existing object')) {
        console.log('La tabla de reglas de enmascaramiento ya existe');
      } else {
        throw err;
      }
    }
    
    // Crear usuario admin por defecto si no existe
    try {
      const checkAdmin = await connection.execute(
        'SELECT COUNT(*) as count FROM usuarios WHERE username = :username',
        { username: 'admin' }
      );
      
      if (checkAdmin.rows[0].COUNT === 0) {
        // Crear hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await connection.execute(
          `INSERT INTO usuarios (username, password, email, created_at) 
           VALUES (:username, :password, :email, SYSDATE)`,
          { 
            username: 'admin', 
            password: hashedPassword, 
            email: 'admin@example.com' 
          }
        );
        console.log('Usuario administrador creado correctamente');
      } else {
        console.log('El usuario administrador ya existe');
      }
    } catch (err) {
      console.error('Error al crear usuario administrador:', err);
    }
    
    // Commit los cambios
    await connection.commit();
    console.log('Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    
    // Rollback en caso de error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
    }
    
    throw error;
  } finally {
    // Liberar la conexión
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
}

// Si este script es ejecutado directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Script completado');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error en el script:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 