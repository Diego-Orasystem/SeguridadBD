import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { MaskingRule } from '../../models/masking-rule.model';
import { MaskingService } from '../../services/masking.service';

@Component({
  selector: 'app-masking-rule-form',
  templateUrl: './masking-rule-form.component.html',
  styleUrls: ['./masking-rule-form.component.scss']
})
export class MaskingRuleFormComponent implements OnInit {
  @Output() ruleCreated = new EventEmitter<MaskingRule>();
  @Output() cancel = new EventEmitter<void>();

  maskingRuleForm: FormGroup;
  tables: string[] = [];
  columns: any[] = [];
  previewData: any[] = [];
  tablesLoading = false;
  columnsLoading = false;
  previewLoading = false;
  selectedTable: string = '';
  selectedColumn: string = '';

  maskingTypes = [
    { value: 'FULL_MASK', label: 'Enmascaramiento completo' },
    { value: 'PARTIAL_MASK', label: 'Enmascaramiento parcial' },
    { value: 'EMAIL_MASK', label: 'Enmascaramiento de email' },
    { value: 'CREDIT_CARD_MASK', label: 'Enmascaramiento de tarjeta de crédito' },
    { value: 'RANDOM', label: 'Valor aleatorio' }
  ];

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private maskingService: MaskingService
  ) {
    this.maskingRuleForm = this.fb.group({
      table: ['', Validators.required],
      column: ['', Validators.required],
      maskingType: ['FULL_MASK', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadTablesManually();
  }

  loadTablesManually(): void {
    this.tablesLoading = true;
    this.databaseService.getTables().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tables = response.data.map((table: any) => table.table_name);
          console.log('Tablas cargadas:', this.tables);
        } else {
          console.warn('No se pudieron cargar las tablas. Usando datos de prueba.');
          this.useTestData();
        }
        this.tablesLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar tablas:', error);
        this.useTestData();
        this.tablesLoading = false;
      }
    });
  }

  useTestData(): void {
    // Datos de prueba para tablas
    this.tables = ['clientes', 'empleados', 'productos', 'ventas', 'proveedores'];
    console.log('Usando datos de prueba para tablas:', this.tables);
  }

  onTableSelected(): void {
    this.selectedTable = this.maskingRuleForm.get('table')?.value;
    this.selectedColumn = '';
    this.maskingRuleForm.get('column')?.setValue('');
    if (this.selectedTable) {
      this.loadColumns(this.selectedTable);
      this.loadTablePreview(this.selectedTable);
    }
  }

  loadColumns(tableName: string): void {
    this.columnsLoading = true;
    this.columns = [];
    
    this.databaseService.getTableColumns(tableName).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.columns = response.data;
          console.log(`Columnas cargadas para ${tableName}:`, this.columns);
        } else {
          console.warn(`No se pudieron cargar las columnas para ${tableName}. Usando datos de prueba.`);
          this.useTestColumns(tableName);
        }
        this.columnsLoading = false;
      },
      error: (error) => {
        console.error(`Error al cargar columnas para ${tableName}:`, error);
        this.useTestColumns(tableName);
        this.columnsLoading = false;
      }
    });
  }

  useTestColumns(tableName: string): void {
    if (tableName === 'clientes') {
      this.columns = [
        { column_name: 'id', data_type: 'number', data_length: null, nullable: 'N' },
        { column_name: 'nombre', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'apellido', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'email', data_type: 'varchar2', data_length: 100, nullable: 'Y' },
        { column_name: 'telefono', data_type: 'varchar2', data_length: 20, nullable: 'Y' },
        { column_name: 'direccion', data_type: 'varchar2', data_length: 200, nullable: 'Y' },
        { column_name: 'ciudad', data_type: 'varchar2', data_length: 100, nullable: 'Y' },
        { column_name: 'pais', data_type: 'varchar2', data_length: 100, nullable: 'Y' },
        { column_name: 'tarjeta_credito', data_type: 'varchar2', data_length: 16, nullable: 'Y' }
      ];
    } else if (tableName === 'empleados') {
      this.columns = [
        { column_name: 'id', data_type: 'number', data_length: null, nullable: 'N' },
        { column_name: 'nombre', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'apellido', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'email', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'salario', data_type: 'number', data_length: null, nullable: 'Y' },
        { column_name: 'fecha_contratacion', data_type: 'date', data_length: null, nullable: 'Y' },
        { column_name: 'departamento', data_type: 'varchar2', data_length: 100, nullable: 'Y' }
      ];
    } else {
      // Columnas genéricas para otras tablas
      this.columns = [
        { column_name: 'id', data_type: 'number', data_length: null, nullable: 'N' },
        { column_name: 'nombre', data_type: 'varchar2', data_length: 100, nullable: 'N' },
        { column_name: 'descripcion', data_type: 'varchar2', data_length: 200, nullable: 'Y' },
        { column_name: 'fecha_creacion', data_type: 'date', data_length: null, nullable: 'Y' }
      ];
    }
    console.log(`Usando datos de prueba para columnas de ${tableName}:`, this.columns);
  }

  onColumnSelected(): void {
    this.selectedColumn = this.maskingRuleForm.get('column')?.value;
  }

  loadTablePreview(tableName: string): void {
    this.previewLoading = true;
    this.previewData = [];
    
    this.databaseService.getTablePreview(tableName).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.previewData = response.data;
          console.log(`Vista previa cargada para ${tableName}:`, this.previewData);
        } else {
          console.warn(`No se pudo cargar la vista previa para ${tableName}. Usando datos de prueba.`);
          this.useTestPreview(tableName);
        }
        this.previewLoading = false;
      },
      error: (error) => {
        console.error(`Error al cargar vista previa para ${tableName}:`, error);
        this.useTestPreview(tableName);
        this.previewLoading = false;
      }
    });
  }

  useTestPreview(tableName: string): void {
    if (tableName === 'clientes') {
      this.previewData = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan.perez@example.com', telefono: '555-123-4567', direccion: 'Calle Principal 123', ciudad: 'Madrid', pais: 'España', tarjeta_credito: '4111111111111111' },
        { id: 2, nombre: 'María', apellido: 'González', email: 'maria.gon@example.com', telefono: '555-987-6543', direccion: 'Avenida Central 456', ciudad: 'Barcelona', pais: 'España', tarjeta_credito: '5555555555554444' },
        { id: 3, nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos.rod@example.com', telefono: '555-567-8901', direccion: 'Plaza Mayor 789', ciudad: 'Sevilla', pais: 'España', tarjeta_credito: '3782822463100005' },
        { id: 4, nombre: 'Ana', apellido: 'Martínez', email: 'ana.martinez@example.com', telefono: '555-234-5678', direccion: 'Calle Secundaria 321', ciudad: 'Valencia', pais: 'España', tarjeta_credito: '6011111111111117' },
        { id: 5, nombre: 'Pedro', apellido: 'López', email: 'pedro.lopez@example.com', telefono: '555-876-5432', direccion: 'Avenida Principal 654', ciudad: 'Zaragoza', pais: 'España', tarjeta_credito: '4012888888881881' }
      ];
    } else if (tableName === 'empleados') {
      this.previewData = [
        { id: 1, nombre: 'Roberto', apellido: 'Fernández', email: 'roberto.f@company.com', salario: 45000, fecha_contratacion: '2020-01-15', departamento: 'Ventas' },
        { id: 2, nombre: 'Laura', apellido: 'García', email: 'laura.g@company.com', salario: 52000, fecha_contratacion: '2019-05-20', departamento: 'Marketing' },
        { id: 3, nombre: 'Miguel', apellido: 'Sánchez', email: 'miguel.s@company.com', salario: 48000, fecha_contratacion: '2021-03-10', departamento: 'Desarrollo' },
        { id: 4, nombre: 'Sofía', apellido: 'Díaz', email: 'sofia.d@company.com', salario: 60000, fecha_contratacion: '2018-11-05', departamento: 'Finanzas' },
        { id: 5, nombre: 'Javier', apellido: 'Ruiz', email: 'javier.r@company.com', salario: 55000, fecha_contratacion: '2020-09-22', departamento: 'Recursos Humanos' }
      ];
    } else {
      // Datos genéricos para otras tablas
      this.previewData = [];
      for (let i = 1; i <= 5; i++) {
        const row: any = { id: i, nombre: `Item ${i}`, descripcion: `Descripción del item ${i}`, fecha_creacion: new Date().toISOString().split('T')[0] };
        this.previewData.push(row);
      }
    }
    console.log(`Usando datos de prueba para vista previa de ${tableName}:`, this.previewData);
  }

  getTableColumns(): string[] {
    if (this.previewData.length === 0) {
      return [];
    }
    // Obtener todas las claves únicas de los objetos en previewData
    const allKeys = new Set<string>();
    this.previewData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
  }

  getMaskedValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const maskingType = this.maskingRuleForm.get('maskingType')?.value;
    
    switch (maskingType) {
      case 'FULL_MASK':
        return 'XXXX';
      case 'PARTIAL_MASK':
        return String(value).substring(0, 2) + 'XXX';
      case 'EMAIL_MASK':
        if (typeof value === 'string' && value.includes('@')) {
          const parts = value.split('@');
          return parts[0].substring(0, 2) + 'XXX@' + parts[1];
        }
        return 'XXX@example.com';
      case 'CREDIT_CARD_MASK':
        if (typeof value === 'string') {
          return 'XXXX-XXXX-XXXX-' + value.substring(value.length - 4);
        }
        return 'XXXX-XXXX-XXXX-XXXX';
      case 'RANDOM':
        return 'RANDOM_VALUE';
      default:
        return 'MASKED';
    }
  }

  resetForm(): void {
    this.maskingRuleForm.reset({
      maskingType: 'FULL_MASK',
      isActive: true
    });
    this.selectedTable = '';
    this.selectedColumn = '';
    this.previewData = [];
  }

  createRule(): void {
    if (this.maskingRuleForm.valid) {
      const formValues = this.maskingRuleForm.value;
      
      const newRule: MaskingRule = {
        id: Date.now(), // ID temporal
        table_name: formValues.table,
        column_name: formValues.column,
        masking_type: formValues.maskingType,
        description: formValues.description || `Regla para ${formValues.table}.${formValues.column}`,
        is_active: formValues.isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.maskingService.createMaskingRule(newRule).subscribe({
        next: (response) => {
          if (response.success) {
            this.ruleCreated.emit(response.data || newRule);
            this.resetForm();
          } else {
            console.warn('Error al crear regla. Usando modo prueba.');
            // En modo prueba, emitimos la regla directamente
            this.ruleCreated.emit(newRule);
            this.resetForm();
          }
        },
        error: (error) => {
          console.error('Error al crear regla:', error);
          // En caso de error, también emitimos la regla en modo prueba
          this.ruleCreated.emit(newRule);
          this.resetForm();
        }
      });
    }
  }
} 