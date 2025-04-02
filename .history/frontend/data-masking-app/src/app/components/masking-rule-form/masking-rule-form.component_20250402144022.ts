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
        }
      });
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
    
    this.databaseService.getTableColumns(tableName, schema)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.columns = response.data;
            this.loading = false;
          }
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Error al cargar columnas',
            'Cerrar',
            { duration: 5000 }
          );
          this.loading = false;
        }
      });
  }

  loadTablePreview(tableName: string): void {
    this.previewLoading = true;
    this.showPreview = false;
    const schema = this.ruleForm.get('schema_name')?.value || this.schema;
    
    // Cargar una muestra de datos (limitada a 5 registros)
    this.databaseService.getTableData(tableName, schema, 5)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.previewData = response.data;
            this.previewLoading = false;
            this.showPreview = true;
            
            // Si ya tenemos una columna seleccionada, actualizar vista previa
            if (this.ruleForm.get('column_name')?.value) {
              this.updateColumnPreview();
            }
          }
        },
        error: (error) => {
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