# Aplicación de Enmascaramiento de Datos para Oracle

Esta aplicación permite automatizar el enmascaramiento de datos sensibles en una base de datos Oracle mediante la creación de vistas y triggers.

## Características

- Explorar tablas y columnas de una base de datos Oracle
- Crear reglas de enmascaramiento para columnas específicas
- Aplicar enmascaramiento mediante vistas con el nombre original de la tabla
- Configurar triggers para operaciones CRUD en las vistas enmascaradas
- Interfaz gráfica intuitiva desarrollada con Angular y Material Design

## Requisitos previos

- Node.js 14 o superior
- Oracle Database (probado con Oracle 19c)
- Oracle Instant Client instalado y configurado

## Configuración

1. Clona el repositorio:
   ```
   git clone <url-del-repositorio>
   cd SeguridadBD
   ```

2. Configura las variables de entorno:
   - Crea un archivo `.env` en la carpeta `api` con el siguiente contenido:
     ```
     PORT=3000
     NODE_ENV=development
     ORACLE_USER=tu_usuario
     ORACLE_PASSWORD=tu_contraseña
     ORACLE_CONNECTION_STRING=localhost:1521/XE
     JWT_SECRET=secreto_jwt_para_data_masking_app
     JWT_EXPIRES_IN=1d
     ```

3. Instala las dependencias del backend:
   ```
   cd api
   npm install
   ```

4. Instala las dependencias del frontend:
   ```
   cd ../frontend/data-masking-app
   npm install
   ```

## Inicialización de la base de datos

1. Inicializa las tablas del sistema:
   ```
   cd api
   npm run init-db
   ```

2. Crea tablas de prueba con datos sensibles (opcional):
   ```
   npm run create-test-db
   ```

## Ejecución

1. Inicia el servidor API:
   ```
   cd api
   npm run dev
   ```

2. Inicia la aplicación Angular:
   ```
   cd ../frontend/data-masking-app
   ng serve
   ```

3. Abre tu navegador en [http://localhost:4200](http://localhost:4200)

## Uso

1. Inicia sesión con las credenciales predeterminadas:
   - Usuario: `admin`
   - Contraseña: `admin123`

2. Explora las tablas de tu base de datos

3. Crea reglas de enmascaramiento para columnas con datos sensibles

4. Aplica el enmascaramiento para crear vistas

5. Configura los triggers para operaciones CRUD en las vistas

## Estructura del proyecto

- `/api`: Backend Node.js con Express
  - `/src`: Código fuente del backend
  - `/scripts`: Scripts útiles como la creación de la BD de prueba

- `/frontend`: Frontend Angular
  - `/data-masking-app`: Aplicación Angular

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles. 