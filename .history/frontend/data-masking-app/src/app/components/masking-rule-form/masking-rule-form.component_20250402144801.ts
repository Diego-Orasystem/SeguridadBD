import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaskingRule, MaskingType } from '../../models/masking.model';
import { Table, Column, TableData } from '../../models/database.model';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaskingService } from '../../services/masking.service';

@Component({
  selector: 'app-masking-rule-form',
  templateUrl: './masking-rule-form.component.html',
  styleUrls: ['./masking-rule-form.component.scss']
})
export class MaskingRuleFormComponent implements OnInit {
  @Input() editingRule: MaskingRule | null = null;
  @Input() tables: Table[] = [];
  @Input() schema: string = '';
  
  @Output() formSubmit = new EventEmitter<MaskingRule>();
  @Output() formCancel = new EventEmitter<void>();
  
  ruleForm!: FormGroup;
  columns: Column[] = [];
  loading = false;
  tablesLoading = false;
  
  // Vista previa de datos
  previewData: TableData[] = [];
  previewLoading = false;
  showPreview = false;
  selectedColumnData: any[] = [];
  maskedColumnData: any[] = [];
  
  // Opciones para el tipo de enmascaramiento
  maskingTypes = [
    { value: MaskingType.CREDIT_CARD, label: 'Tarjeta de Crédito' },
    { value: MaskingType.EMAIL, label: 'Correo Electrónico' },
    { value: MaskingType.PHONE, label: 'Teléfono' },
    { value: MaskingType.FULL_MASK, label: 'Enmascaramiento Completo' },
    { value: MaskingType.CUSTOM, label: 'Personalizado' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar,
    private maskingService: MaskingService
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Si estamos editando una regla existente, cargar sus columnas
    if (this.editingRule) {
      this.loadColumns(this.editingRule.table_name);
    }
    
    console.log('ngOnInit - Tablas recibidas:', this.tables);
    
    // Si no hay tablas, intentar cargarlas
    if (!this.tables || this.tables.length === 0) {
      this.loadTablesManually();
    }
  }

  loadTablesManually(): void {
    this.tablesLoading = true;
    console.log('Cargando tablas manualmente...');
    
    this.databaseService.getTables(this.schema)
      .subscribe({
        next: (response) => {
          console.log('Respuesta de getTables:', response);
          if (response.success && response.data) {
            this.tables = response.data;
            console.log('Tablas cargadas manualmente:', this.tables);
          } else {
            console.warn('No se recibieron datos de tablas o la respuesta no fue exitosa');
            // Usar datos de prueba si la API falla
            this.useTestData();
          }
          this.tablesLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar tablas manualmente:', error);
          this.snackBar.open(
            error.error?.message || 'Error al cargar tablas',
            'Cerrar',
            { duration: 5000 }
          );
          this.tablesLoading = false;
          
          // Usar datos de prueba si la API falla
          this.useTestData();
        }
      });
  }
  
  // Método para usar datos de prueba
  useTestData(): void {
    console.log('Usando datos de prueba para tablas');
    this.tables = [
      { table_name: 'clientes' },
      { table_name: 'empleados' },
      { table_name: 'productos' },
      { table_name: 'ventas' },
      { table_name: 'proveedores' }
    ];
    
    // También podríamos simular columnas para la primera tabla
    if (this.ruleForm.get('table_name')?.value === 'clientes') {
      this.columns = [
        { column_name: 'id', data_type: 'int', data_length: 0, nullable: 'NO', COLUMN_NAME: 'id', DATA_TYPE: 'int', DATA_LENGTH: 0, NULLABLE: 'NO' },
        { column_name: 'nombre', data_type: 'varchar', data_length: 100, nullable: 'NO', COLUMN_NAME: 'nombre', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'NO' },
        { column_name: 'email', data_type: 'varchar', data_length: 100, nullable: 'YES', COLUMN_NAME: 'email', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'YES' },
        { column_name: 'telefono', data_type: 'varchar', data_length: 20, nullable: 'YES', COLUMN_NAME: 'telefono', DATA_TYPE: 'varchar', DATA_LENGTH: 20, NULLABLE: 'YES' },
        { column_name: 'direccion', data_type: 'varchar', data_length: 200, nullable: 'YES', COLUMN_NAME: 'direccion', DATA_TYPE: 'varchar', DATA_LENGTH: 200, NULLABLE: 'YES' },
        { column_name: 'fecha_registro', data_type: 'date', data_length: 0, nullable: 'NO', COLUMN_NAME: 'fecha_registro', DATA_TYPE: 'date', DATA_LENGTH: 0, NULLABLE: 'NO' }
      ];
    }
  }

  initForm(): void {
    this.ruleForm = this.formBuilder.group({
      table_name: ['', Validators.required],
      column_name: ['', Validators.required],
      masking_type: [MaskingType.CREDIT_CARD, Validators.required],
      visible_chars: [4, [Validators.min(0), Validators.max(20)]],
      schema_name: [this.schema]
    });

    // Si estamos editando, rellenar el formulario con los datos de la regla
    if (this.editingRule) {
      this.ruleForm.patchValue({
        table_name: this.editingRule.table_name,
        column_name: this.editingRule.column_name,
        masking_type: this.editingRule.masking_type,
        visible_chars: this.editingRule.visible_chars,
        schema_name: this.editingRule.schema_name || this.schema
      });
    }

    // Escuchar cambios en el select de tabla para cargar columnas
    this.ruleForm.get('table_name')?.valueChanges.subscribe(tableName => {
      if (tableName) {
        this.loadColumns(tableName);
        this.loadTablePreview(tableName);
      } else {
        this.columns = [];
        this.previewData = [];
        this.showPreview = false;
      }
    });

    // Escuchar cambios en el select de columna para actualizar la vista previa
    this.ruleForm.get('column_name')?.valueChanges.subscribe(columnName => {
      if (columnName && this.previewData.length > 0) {
        this.updateColumnPreview();
      }
    });

    // Escuchar cambios en el tipo de enmascaramiento y caracteres visibles
    this.ruleForm.get('masking_type')?.valueChanges.subscribe(() => {
      if (this.previewData.length > 0 && this.ruleForm.get('column_name')?.value) {
        this.updateColumnPreview();
      }
    });

    this.ruleForm.get('visible_chars')?.valueChanges.subscribe(() => {
      if (this.previewData.length > 0 && this.ruleForm.get('column_name')?.value) {
        this.updateColumnPreview();
      }
    });
  }

  loadColumns(tableName: string): void {
    this.loading = true;
    const schema = this.ruleForm.get('schema_name')?.value || this.schema;
    
    console.log('Cargando columnas para la tabla:', tableName);
    
    // Si estamos usando datos de prueba, simular columnas para las tablas
    if (this.tables.some(t => t.table_name === tableName && !t.TABLE_NAME)) {
      console.log('Usando datos de prueba para columnas');
      
      // Columnas simuladas para diferentes tablas
      if (tableName === 'clientes') {
        this.columns = [
          { column_name: 'id', data_type: 'int', data_length: 0, nullable: 'NO', COLUMN_NAME: 'id', DATA_TYPE: 'int', DATA_LENGTH: 0, NULLABLE: 'NO' },
          { column_name: 'nombre', data_type: 'varchar', data_length: 100, nullable: 'NO', COLUMN_NAME: 'nombre', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'NO' },
          { column_name: 'email', data_type: 'varchar', data_length: 100, nullable: 'YES', COLUMN_NAME: 'email', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'YES' },
          { column_name: 'telefono', data_type: 'varchar', data_length: 20, nullable: 'YES', COLUMN_NAME: 'telefono', DATA_TYPE: 'varchar', DATA_LENGTH: 20, NULLABLE: 'YES' },
          { column_name: 'tarjeta', data_type: 'varchar', data_length: 50, nullable: 'YES', COLUMN_NAME: 'tarjeta', DATA_TYPE: 'varchar', DATA_LENGTH: 50, NULLABLE: 'YES' }
        ];
      } else if (tableName === 'empleados') {
        this.columns = [
          { column_name: 'id', data_type: 'int', data_length: 0, nullable: 'NO', COLUMN_NAME: 'id', DATA_TYPE: 'int', DATA_LENGTH: 0, NULLABLE: 'NO' },
          { column_name: 'nombre', data_type: 'varchar', data_length: 100, nullable: 'NO', COLUMN_NAME: 'nombre', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'NO' },
          { column_name: 'email', data_type: 'varchar', data_length: 100, nullable: 'YES', COLUMN_NAME: 'email', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'YES' },
          { column_name: 'salario', data_type: 'decimal', data_length: 0, nullable: 'YES', COLUMN_NAME: 'salario', DATA_TYPE: 'decimal', DATA_LENGTH: 0, NULLABLE: 'YES' }
        ];
      } else {
        // Para otras tablas, columnas genéricas
        this.columns = [
          { column_name: 'id', data_type: 'int', data_length: 0, nullable: 'NO', COLUMN_NAME: 'id', DATA_TYPE: 'int', DATA_LENGTH: 0, NULLABLE: 'NO' },
          { column_name: 'nombre', data_type: 'varchar', data_length: 100, nullable: 'NO', COLUMN_NAME: 'nombre', DATA_TYPE: 'varchar', DATA_LENGTH: 100, NULLABLE: 'NO' },
          { column_name: 'descripcion', data_type: 'varchar', data_length: 200, nullable: 'YES', COLUMN_NAME: 'descripcion', DATA_TYPE: 'varchar', DATA_LENGTH: 200, NULLABLE: 'YES' }
        ];
      }
      
      this.loading = false;
      return;
    }
    
    // Si no estamos usando datos de prueba, consultar a la API
    this.databaseService.getTableColumns(tableName, schema)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.columns = response.data;
            console.log('Columnas cargadas:', this.columns);
          } else {
            console.warn('No se recibieron datos de columnas o la respuesta no fue exitosa');
            this.columns = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar columnas:', error);
          this.snackBar.open(
            error.error?.message || 'Error al cargar columnas',
            'Cerrar',
            { duration: 5000 }
          );
          this.loading = false;
          this.columns = [];
        }
      });
  }

  loadTablePreview(tableName: string): void {
    this.previewLoading = true;
    this.showPreview = false;
    const schema = this.ruleForm.get('schema_name')?.value || this.schema;
    
    console.log('Cargando vista previa para la tabla:', tableName);
    
    // Si estamos usando datos de prueba, simular datos de vista previa
    if (this.tables.some(t => t.table_name === tableName && !t.TABLE_NAME)) {
      console.log('Usando datos de prueba para vista previa');
      
      // Datos simulados para diferentes tablas
      if (tableName === 'clientes') {
        this.previewData = [
          { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', telefono: '555-123-4567', tarjeta: '4111111111111111' },
          { id: 2, nombre: 'María García', email: 'maria@ejemplo.com', telefono: '555-234-5678', tarjeta: '5555555555554444' },
          { id: 3, nombre: 'Carlos López', email: 'carlos@ejemplo.com', telefono: '555-345-6789', tarjeta: '378282246310005' },
          { id: 4, nombre: 'Ana Martínez', email: 'ana@ejemplo.com', telefono: '555-456-7890', tarjeta: '6011111111111117' },
          { id: 5, nombre: 'Roberto Sánchez', email: 'roberto@ejemplo.com', telefono: '555-567-8901', tarjeta: '3566002020360505' }
        ];
      } else if (tableName === 'empleados') {
        this.previewData = [
          { id: 1, nombre: 'Luis Ramírez', email: 'luis@empresa.com', salario: 50000 },
          { id: 2, nombre: 'Sandra Torres', email: 'sandra@empresa.com', salario: 55000 },
          { id: 3, nombre: 'Eduardo Vargas', email: 'eduardo@empresa.com', salario: 48000 },
          { id: 4, nombre: 'Patricia Morales', email: 'patricia@empresa.com', salario: 60000 },
          { id: 5, nombre: 'Miguel Castro', email: 'miguel@empresa.com', salario: 52000 }
        ];
      } else {
        // Para otras tablas, datos genéricos
        this.previewData = [
          { id: 1, nombre: 'Item 1', descripcion: 'Descripción del item 1' },
          { id: 2, nombre: 'Item 2', descripcion: 'Descripción del item 2' },
          { id: 3, nombre: 'Item 3', descripcion: 'Descripción del item 3' },
          { id: 4, nombre: 'Item 4', descripcion: 'Descripción del item 4' },
          { id: 5, nombre: 'Item 5', descripcion: 'Descripción del item 5' }
        ];
      }
      
      this.previewLoading = false;
      this.showPreview = true;
      
      // Si ya tenemos una columna seleccionada, actualizar vista previa
      if (this.ruleForm.get('column_name')?.value) {
        this.updateColumnPreview();
      }
      
      return;
    }
    
    // Si no estamos usando datos de prueba, consultar a la API
    // Cargar una muestra de datos (limitada a 5 registros)
    this.databaseService.getTableData(tableName, schema, 5)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.previewData = response.data;
            console.log('Datos de vista previa cargados:', this.previewData);
            this.showPreview = true;
            
            // Si ya tenemos una columna seleccionada, actualizar vista previa
            if (this.ruleForm.get('column_name')?.value) {
              this.updateColumnPreview();
            }
          } else {
            console.warn('No se recibieron datos de vista previa o la respuesta no fue exitosa');
          }
          this.previewLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar vista previa de datos:', error);
          this.snackBar.open(
            error.error?.message || 'Error al cargar vista previa de datos',
            'Cerrar',
            { duration: 5000 }
          );
          this.previewLoading = false;
        }
      });
  }

  updateColumnPreview(): void {
    const columnName = this.ruleForm.get('column_name')?.value;
    if (!columnName || this.previewData.length === 0) return;
    
    // Extraer los datos de la columna seleccionada
    this.selectedColumnData = this.previewData.map(row => row[columnName] || '');
    
    // Aplicar enmascaramiento a los datos según configuración actual
    this.maskedColumnData = this.selectedColumnData.map(value => 
      this.maskingService.applyMaskingPreview(
        value, 
        this.ruleForm.get('masking_type')?.value,
        this.ruleForm.get('visible_chars')?.value)
    );
  }

  // Obtener todas las columnas disponibles de los datos de vista previa
  getTableColumns(): string[] {
    if (!this.previewData || this.previewData.length === 0) {
      return [];
    }
    
    // Obtener todas las claves únicas de los datos de la tabla
    const allKeys = new Set<string>();
    this.previewData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    return Array.from(allKeys);
  }

  onSubmit(): void {
    if (this.ruleForm.invalid) {
      return;
    }

    const formData = this.ruleForm.value;
    
    // Crear objeto de regla de enmascaramiento
    const maskingRule: MaskingRule = {
      ...formData,
      // Si estamos editando, mantener el ID
      ...(this.editingRule?.id ? { id: this.editingRule.id } : {})
    };

    this.formSubmit.emit(maskingRule);
  }

  onCancel(): void {
    this.formCancel.emit();
  }
} 