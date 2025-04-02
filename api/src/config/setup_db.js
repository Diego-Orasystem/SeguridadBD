/**
 * Script para inicializar la base de datos SQL Server
 */
const fs = require('fs');
const path = require('path');
const db = require('./database');

async function setup() {
  try {
    console.log('Iniciando configuración de la base de datos...');
    
    // Inicializar conexión a la base de datos
    await db.initialize();
    
    // Leer archivo SQL de esquema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir consultas SQL (por GO)
    const queries = sqlSchema.split(/\r?\nGO\r?\n/);
    
    // Ejecutar cada consulta
    for (const query of queries) {
      if (query.trim()) {
        try {
          await db.executeQuery(query);
        } catch (err) {
          console.error('Error al ejecutar consulta:', err.message);
          console.error('Consulta:', query);
        }
      }
    }
    
    console.log('Base de datos configurada correctamente');
  } catch (error) {
    console.error('Error al configurar la base de datos:', error);
  } finally {
    // Cerrar pool de conexiones
    await db.closePool();
  }
}

// Ejecutar configuración
setup(); 