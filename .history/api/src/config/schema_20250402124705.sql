-- Tabla de usuarios (simplificada)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        email NVARCHAR(100),
        is_active CHAR(1) DEFAULT 'Y',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Tabla usuarios creada correctamente';
END
ELSE
BEGIN
    PRINT 'La tabla usuarios ya existe';
END
GO

-- Tabla de reglas de enmascaramiento
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'masking_rules' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.masking_rules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        table_name NVARCHAR(128) NOT NULL,
        column_name NVARCHAR(128) NOT NULL,
        masking_type NVARCHAR(50) NOT NULL,
        visible_chars INT,
        schema_name NVARCHAR(128) NOT NULL,
        is_applied CHAR(1) DEFAULT 'N',
        trigger_operations NVARCHAR(50),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES dbo.usuarios(id),
        CONSTRAINT UC_masking_rule UNIQUE (schema_name, table_name, column_name)
    );
    
    PRINT 'Tabla masking_rules creada correctamente';
END
ELSE
BEGIN
    PRINT 'La tabla masking_rules ya existe';
END
GO

-- Crear índices
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'masking_rules' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_masking_rules_table' AND object_id = OBJECT_ID('dbo.masking_rules'))
    BEGIN
        CREATE INDEX IX_masking_rules_table ON dbo.masking_rules(table_name);
        PRINT 'Índice IX_masking_rules_table creado correctamente';
    END
    ELSE
        PRINT 'El índice IX_masking_rules_table ya existe';
        
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_masking_rules_schema' AND object_id = OBJECT_ID('dbo.masking_rules'))
    BEGIN
        CREATE INDEX IX_masking_rules_schema ON dbo.masking_rules(schema_name);
        PRINT 'Índice IX_masking_rules_schema creado correctamente';
    END
    ELSE
        PRINT 'El índice IX_masking_rules_schema ya existe';
END
GO

-- Insertar datos de ejemplo de usuarios (solo para desarrollo)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios' AND schema_id = SCHEMA_ID('dbo'))
AND NOT EXISTS (SELECT * FROM dbo.usuarios WHERE username = 'admin')
BEGIN
    INSERT INTO dbo.usuarios (username, password, email, is_active)
    VALUES ('admin', 'admin123', 'admin@example.com', 'Y');
    
    PRINT 'Usuario admin creado correctamente';
END
ELSE
BEGIN
    PRINT 'El usuario admin ya existe o la tabla no existe';
END
GO 