-- Script para crear base de datos de prueba con datos sensibles
-- Este script debe ejecutarse con un usuario que tenga permisos para crear tablas

-- Eliminar tablas si ya existen
DROP TABLE transacciones CASCADE CONSTRAINTS;
DROP TABLE clientes CASCADE CONSTRAINTS;
DROP TABLE empleados CASCADE CONSTRAINTS;

-- Crear tabla de clientes
CREATE TABLE clientes (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL,
    apellido VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL,
    telefono VARCHAR2(20) NOT NULL,
    tarjeta_credito VARCHAR2(16) NOT NULL,
    direccion VARCHAR2(200),
    fecha_registro TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Crear tabla de empleados
CREATE TABLE empleados (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL,
    apellido VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL,
    telefono VARCHAR2(20) NOT NULL,
    nss VARCHAR2(11) NOT NULL, -- Número de Seguridad Social
    salario NUMBER(10,2) NOT NULL,
    departamento VARCHAR2(50) NOT NULL,
    fecha_contratacion DATE NOT NULL
);

-- Crear tabla de transacciones
CREATE TABLE transacciones (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id NUMBER NOT NULL,
    tipo VARCHAR2(50) NOT NULL,
    monto NUMBER(10,2) NOT NULL,
    tarjeta_credito VARCHAR2(16) NOT NULL,
    fecha TIMESTAMP DEFAULT SYSTIMESTAMP,
    descripcion VARCHAR2(200),
    CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Insertar datos de prueba en la tabla clientes
INSERT INTO clientes (nombre, apellido, email, telefono, tarjeta_credito, direccion)
VALUES ('Juan', 'Pérez', 'juan.perez@example.com', '612345678', '4111111111111111', 'Calle Principal 123, Madrid');

INSERT INTO clientes (nombre, apellido, email, telefono, tarjeta_credito, direccion)
VALUES ('María', 'García', 'maria.garcia@example.com', '623456789', '5555555555554444', 'Avenida Central 456, Barcelona');

INSERT INTO clientes (nombre, apellido, email, telefono, tarjeta_credito, direccion)
VALUES ('Pedro', 'López', 'pedro.lopez@example.com', '634567890', '3400000000000031', 'Plaza Mayor 789, Valencia');

INSERT INTO clientes (nombre, apellido, email, telefono, tarjeta_credito, direccion)
VALUES ('Ana', 'Martínez', 'ana.martinez@example.com', '645678901', '6011000990139424', 'Calle Norte 101, Sevilla');

INSERT INTO clientes (nombre, apellido, email, telefono, tarjeta_credito, direccion)
VALUES ('Carlos', 'Rodríguez', 'carlos.rodriguez@example.com', '656789012', '5105105105105100', 'Avenida Sur 202, Bilbao');

-- Insertar datos de prueba en la tabla empleados
INSERT INTO empleados (nombre, apellido, email, telefono, nss, salario, departamento, fecha_contratacion)
VALUES ('Luis', 'Sánchez', 'luis.sanchez@company.com', '612345678', '123-45-6789', 35000.00, 'IT', TO_DATE('2020-03-15', 'YYYY-MM-DD'));

INSERT INTO empleados (nombre, apellido, email, telefono, nss, salario, departamento, fecha_contratacion)
VALUES ('Laura', 'Gómez', 'laura.gomez@company.com', '623456789', '234-56-7890', 42000.00, 'Recursos Humanos', TO_DATE('2019-07-22', 'YYYY-MM-DD'));

INSERT INTO empleados (nombre, apellido, email, telefono, nss, salario, departamento, fecha_contratacion)
VALUES ('Miguel', 'Fernández', 'miguel.fernandez@company.com', '634567890', '345-67-8901', 55000.00, 'Finanzas', TO_DATE('2018-11-10', 'YYYY-MM-DD'));

INSERT INTO empleados (nombre, apellido, email, telefono, nss, salario, departamento, fecha_contratacion)
VALUES ('Sofía', 'Díaz', 'sofia.diaz@company.com', '645678901', '456-78-9012', 38000.00, 'Marketing', TO_DATE('2021-02-05', 'YYYY-MM-DD'));

INSERT INTO empleados (nombre, apellido, email, telefono, nss, salario, departamento, fecha_contratacion)
VALUES ('Pablo', 'Torres', 'pablo.torres@company.com', '656789012', '567-89-0123', 60000.00, 'Dirección', TO_DATE('2017-05-30', 'YYYY-MM-DD'));

-- Insertar datos de prueba en la tabla transacciones
INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (1, 'COMPRA', 150.50, '4111111111111111', 'Compra en supermercado');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (2, 'COMPRA', 299.99, '5555555555554444', 'Compra en tienda de electrónica');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (3, 'RETIRO', 200.00, '3400000000000031', 'Retiro de cajero automático');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (4, 'COMPRA', 85.75, '6011000990139424', 'Compra en farmacia');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (5, 'COMPRA', 450.00, '5105105105105100', 'Compra en tienda de ropa');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (1, 'COMPRA', 25.50, '4111111111111111', 'Compra en restaurante');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (2, 'RETIRO', 100.00, '5555555555554444', 'Retiro de cajero automático');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (3, 'COMPRA', 75.30, '3400000000000031', 'Compra en gasolinera');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (4, 'COMPRA', 120.00, '6011000990139424', 'Compra en tienda online');

INSERT INTO transacciones (cliente_id, tipo, monto, tarjeta_credito, descripcion)
VALUES (5, 'COMPRA', 210.45, '5105105105105100', 'Compra en supermercado');

COMMIT;

-- Mostrar el número de registros insertados
SELECT 'Clientes: ' || COUNT(*) AS registros FROM clientes;
SELECT 'Empleados: ' || COUNT(*) AS registros FROM empleados;
SELECT 'Transacciones: ' || COUNT(*) AS registros FROM transacciones;

-- Mensaje de finalización
SELECT 'Base de datos de prueba creada correctamente.' AS mensaje FROM dual; 