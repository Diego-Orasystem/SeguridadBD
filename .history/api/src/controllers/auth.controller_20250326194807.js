const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Registrar un nuevo usuario
 */
exports.register = async (req, res) => {
  const { username, password, email } = req.body;

  // Validar los datos de entrada
  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren nombre de usuario, contraseña y correo electrónico'
    });
  }

  try {
    // Verificar si el usuario ya existe
    const checkUser = await db.executeQuery(
      `SELECT * FROM usuarios WHERE username = :username OR email = :email`,
      { username, email }
    );

    if (checkUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario o correo electrónico ya está en uso'
      });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar el nuevo usuario
    await db.executeQuery(
      `INSERT INTO usuarios (username, password, email, created_at) 
       VALUES (:username, :password, :email, SYSDATE)`,
      { username, password: hashedPassword, email }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente'
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de registro',
      error: error.message
    });
  }
};

/**
 * Iniciar sesión de usuario
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Validar los datos de entrada
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren nombre de usuario y contraseña'
    });
  }

  try {
    // Buscar el usuario
    const result = await db.executeQuery(
      `SELECT * FROM usuarios WHERE username = :username`,
      { username }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.PASSWORD);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.ID, 
        username: user.USERNAME, 
        email: user.EMAIL 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.ID,
        username: user.USERNAME,
        email: user.EMAIL
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de inicio de sesión',
      error: error.message
    });
  }
}; 