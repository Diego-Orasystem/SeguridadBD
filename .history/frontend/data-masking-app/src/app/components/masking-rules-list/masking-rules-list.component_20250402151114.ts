import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaskingService } from '../../services/masking.service';
import { DatabaseService } from '../../services/database.service';
import { MaskingRule } from '../../models/masking-rule.model';

@Component({
  selector: 'app-masking-rules-list',
  templateUrl: './masking-rules-list.component.html',
  styleUrls: ['./masking-rules-list.component.scss']
})
export class MaskingRulesListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'table_name', 'column_name', 'masking_type', 'is_active', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  showForm = false;
  showPreview = false;
  selectedRule: any = null;
  comparisonData: { original: any, masked: any }[] = [];
  sqlScript: string = '';

  constructor(
    private maskingService: MaskingService,
    private databaseService: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMaskingRules();
  }

  loadMaskingRules(): void {
    this.loading = true;
    this.maskingService.getMaskingRules().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataSource.data = response.data;
          // Asignar los componentes de paginación y ordenamiento
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });
        } else {
          console.warn('No se pudieron cargar las reglas de enmascaramiento');
          this.dataSource.data = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las reglas de enmascaramiento:', error);
        this.loading = false;
        // Cargar datos de ejemplo para demostración
        this.loadSampleRules();
      }
    });
  }

  loadSampleRules(): void {
    // Datos de muestra para demostración
    const sampleRules = [
      {
        id: 1,
        table_name: 'clientes',
        column_name: 'email',
        masking_type: 'EMAIL_MASK',
        description: 'Enmascaramiento de emails de clientes',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        table_name: 'clientes',
        column_name: 'tarjeta_credito',
        masking_type: 'CREDIT_CARD_MASK',
        description: 'Enmascaramiento de tarjetas de crédito',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        table_name: 'empleados',
        column_name: 'salario',
        masking_type: 'FULL_MASK',
        description: 'Enmascaramiento completo de salarios',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    this.dataSource.data = sampleRules;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      // Al cerrar el formulario, recargar las reglas
      this.loadMaskingRules();
    }
  }

  onRuleCreated(rule: any): void {
    this.showForm = false;
    // Recargar las reglas
    this.loadMaskingRules();
    // Mostrar una vista previa de la regla creada
    this.previewRule(rule);
  }

  editRule(rule: any): void {
    // Aquí implementaríamos la lógica para editar una regla existente
    console.log('Editar regla:', rule);
    // Por ahora, simplemente mostramos la regla en la consola
  }

  deleteRule(rule: any): void {
    if (confirm(`¿Está seguro de que desea eliminar la regla para ${rule.table_name}.${rule.column_name}?`)) {
      this.maskingService.deleteMaskingRule(rule.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMaskingRules();
          } else {
            console.warn('No se pudo eliminar la regla');
          }
        },
        error: (error) => {
          console.error('Error al eliminar la regla:', error);
        }
      });
    }
  }

  toggleRuleStatus(rule: any): void {
    // Actualizar el estado de la regla
    const updatedRule = {
      is_active: !rule.is_active
    };

    this.maskingService.updateMaskingRule(rule.id, updatedRule).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar la regla localmente
          rule.is_active = !rule.is_active;
        } else {
          console.warn('No se pudo actualizar el estado de la regla');
        }
      },
      error: (error) => {
        console.error('Error al actualizar el estado de la regla:', error);
      }
    });
  }

  previewRule(rule: any): void {
    this.selectedRule = rule;
    this.showPreview = true;
    
    // Generar el script SQL
    this.sqlScript = this.maskingService.generateMaskingScript(rule);
    
    // Cargar datos para la vista previa
    this.databaseService.getTablePreview(rule.table_name).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Preparar datos para la comparación
          this.comparisonData = response.data.slice(0, 5).map(row => ({
            original: row[rule.column_name],
            masked: this.maskingService.applyMaskingPreview(row[rule.column_name], rule.masking_type, rule.visible_characters)
          }));
        } else {
          this.simulateComparisonData(rule);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos para la vista previa:', error);
        this.simulateComparisonData(rule);
      }
    });
  }

  simulateComparisonData(rule: any): void {
    // Datos simulados para la vista previa
    const dataMap: Record<string, any[]> = {
      'email': [
        'usuario1@example.com',
        'usuario2@example.com',
        'usuario.largo@empresa.com',
        'correo@dominio.es',
        'user@domain.co.uk'
      ],
      'tarjeta_credito': [
        '4111111111111111',
        '5555555555554444',
        '378282246310005',
        '6011111111111117',
        '3566002020360505'
      ],
      'salario': [
        45000,
        52000,
        38500,
        61200,
        49800
      ],
      'telefono': [
        '555-123-4567',
        '(555) 234-5678',
        '555.345.6789',
        '555-456-7890',
        '555-567-8901'
      ]
    };

    // Obtener datos relevantes basados en el nombre de la columna o tipo
    let sampleData: any[] = [];
    
    if (rule.column_name.includes('email')) {
      sampleData = dataMap['email'];
    } else if (rule.column_name.includes('tarjeta') || rule.column_name.includes('card')) {
      sampleData = dataMap['tarjeta_credito'];
    } else if (rule.column_name.includes('salario') || rule.column_name.includes('sueldo')) {
      sampleData = dataMap['salario'];
    } else if (rule.column_name.includes('telefono') || rule.column_name.includes('phone')) {
      sampleData = dataMap['telefono'];
    } else {
      // Datos genéricos para otras columnas
      sampleData = ['Valor 1', 'Valor 2', 'Valor 3', 'Valor 4', 'Valor 5'];
    }

    // Crear los datos de comparación
    this.comparisonData = sampleData.map(value => ({
      original: value,
      masked: this.maskingService.applyMaskingPreview(value, rule.masking_type)
    }));
  }

  closePreview(): void {
    this.showPreview = false;
    this.selectedRule = null;
    this.comparisonData = [];
    this.sqlScript = '';
  }

  executeScript(): void {
    if (!this.selectedRule) {
      return;
    }

    this.loading = true;
    
    // Si estamos en modo simulado, mostrar un mensaje de éxito después de un tiempo
    if (this.selectedRule.id) {
      this.maskingService.applyMasking(this.selectedRule.id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.snackBar.open('Script ejecutado correctamente. Datos enmascarados.', 'Cerrar', {
              duration: 5000
            });
            // Actualizar la lista de reglas
            this.loadMaskingRules();
            // Cerrar la vista previa
            this.closePreview();
          } else {
            this.snackBar.open('Error al ejecutar el script', 'Cerrar', {
              duration: 5000
            });
          }
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Error al ejecutar el script: ' + (error.message || 'Error desconocido'), 'Cerrar', {
            duration: 5000
          });
        }
      });
    }
  }

  formatMaskingType(type: string): string {
    return this.maskingService.formatMaskingType(type);
  }
} 