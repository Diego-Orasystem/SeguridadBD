const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar el token JWT
 */
function verifyToken(req, res, next) {
  // Obtener el token del encabezado de autorización
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No se proporcionó token de acceso' 
    });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Añadir los datos del usuario al objeto de solicitud
    req.user = decoded;
    
    // Continuar con la siguiente función en la cadena
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
}

module.exports = {
  verifyToken
}; 