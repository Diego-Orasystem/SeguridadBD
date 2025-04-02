const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/database.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Middlewares de autenticación para todas las rutas
router.use(verifyToken);

// Obtener todas las tablas
router.get('/tables', databaseController.getTables);

// Obtener columnas de una tabla específica
router.get('/tables/:tableName/columns', databaseController.getTableColumns);

// Obtener datos de muestra de una tabla
router.get('/tables/:tableName/data', databaseController.getTableData);

// Obtener esquemas de base de datos
router.get('/schemas', databaseController.getSchemas);

// Verificar conexión a la base de datos
router.get('/test-connection', databaseController.testConnection);

module.exports = router; 