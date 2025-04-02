const express = require('express');
const router = express.Router();
const maskingController = require('../controllers/masking.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Middlewares de autenticación para todas las rutas
router.use(verifyToken);

// Crear una nueva regla de enmascaramiento
router.post('/rules', maskingController.createMaskingRule);

// Obtener todas las reglas de enmascaramiento
router.get('/rules', maskingController.getMaskingRules);

// Obtener una regla de enmascaramiento específica
router.get('/rules/:id', maskingController.getMaskingRuleById);

// Actualizar una regla de enmascaramiento
router.put('/rules/:id', maskingController.updateMaskingRule);

// Eliminar una regla de enmascaramiento
router.delete('/rules/:id', maskingController.deleteMaskingRule);

// Aplicar enmascaramiento a una tabla
router.post('/apply', maskingController.applyMasking);

// Eliminar enmascaramiento de una tabla
router.post('/remove', maskingController.removeMasking);

// Obtener vistas de enmascaramiento
router.get('/views', maskingController.getMaskingViews);

// Configurar triggers para una vista enmascarada
router.post('/triggers', maskingController.configureTriggers);

module.exports = router; 