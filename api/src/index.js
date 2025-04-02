const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const databaseRoutes = require('./routes/database.routes');
const authRoutes = require('./routes/auth.routes');
const maskingRoutes = require('./routes/masking.routes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/masking', maskingRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Enmascaramiento de Datos funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
}); 