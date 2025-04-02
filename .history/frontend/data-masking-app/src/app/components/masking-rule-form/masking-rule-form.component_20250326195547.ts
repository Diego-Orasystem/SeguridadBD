import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaskingRule, MaskingType } from '../../models/masking.model';
import { Table, Column } from '../../models/database.model';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Si estamos editando una regla existente, cargar sus columnas
    if (this.editingRule) {
      this.loadColumns(this.editingRule.table_name);
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
      } else {
        this.columns = [];
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