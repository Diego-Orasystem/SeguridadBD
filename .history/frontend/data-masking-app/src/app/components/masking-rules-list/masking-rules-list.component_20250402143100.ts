import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaskingService } from '../../services/masking.service';
import { DatabaseService } from '../../services/database.service';
import { MaskingRule, MaskingType } from '../../models/masking.model';
import { Table } from '../../models/database.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { TriggerDialogComponent } from '../trigger-dialog/trigger-dialog.component';

@Component({
  selector: 'app-masking-rules-list',
  templateUrl: './masking-rules-list.component.html',
  styleUrls: ['./masking-rules-list.component.scss']
})
export class MaskingRulesListComponent implements OnInit {
  maskingRules: MaskingRule[] = [];
  tables: Table[] = [];
  selectedSchema: string = '';
  loading = false;
  showForm = false;
  editingRule: MaskingRule | null = null;
  
  // Para mostrar comparativa después de crear regla
  lastCreatedRule: MaskingRule | null = null;
  showComparison = false;
  comparisonData: any[] = [];
  comparisonLoading = false;
  
  displayedColumns: string[] = [
    'id', 
    'table_name', 
    'column_name', 
    'masking_type', 
    'visible_chars', 
    'is_applied', 
    'created_at', 
    'actions'
  ];

  constructor(
    private maskingService: MaskingService,
    private databaseService: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadRules();
    this.loadTables();
  }

  loadRules(): void {
    this.loading = true;
    this.maskingService.getMaskingRules()
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.maskingRules = response.data;
          }
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Error al cargar reglas de enmascaramiento',
            'Cerrar',
            { duration: 5000 }
          );
          this.loading = false;
        }
      });
  }

  loadTables(): void {
    this.databaseService.getTables(this.selectedSchema)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tables = response.data;
            console.log('Tablas cargadas:', this.tables);
          } else {
            console.warn('No se recibieron datos de tablas o la respuesta no fue exitosa');
            this.tables = [];
          }
        },
        error: (error) => {
          console.error('Error al cargar tablas:', error);
          this.snackBar.open(
            error.error?.message || 'Error al cargar tablas',
            'Cerrar',
            { duration: 5000 }
          );
          this.tables = [];
        }
      });
  }

  onSchemaChange(): void {
    this.loadTables();
  }

  openNewRuleForm(): void {
    this.editingRule = null;
    this.showForm = true;
  }

  editRule(rule: MaskingRule): void {
    this.editingRule = { ...rule };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingRule = null;
  }

  saveRule(rule: MaskingRule): void {
    if (rule.id) {
      // Actualizar regla existente
      this.maskingService.updateMaskingRule(rule.id, rule)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Regla actualizada correctamente', 'Cerrar', {
                duration: 3000
              });
              this.loadRules();
              this.cancelForm();
            }
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Error al actualizar regla',
              'Cerrar',
              { duration: 5000 }
            );
          }
        });
    } else {
      // Crear nueva regla
      this.maskingService.createMaskingRule(rule)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Regla creada correctamente', 'Cerrar', {
                duration: 3000
              });
              this.lastCreatedRule = { ...rule, id: response.data?.id };
              this.loadRules();
              this.cancelForm();
              this.loadComparisonData(rule);
            }
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Error al crear regla',
              'Cerrar',
              { duration: 5000 }
            );
          }
        });
    }
  }

  loadComparisonData(rule: MaskingRule): void {
    this.comparisonLoading = true;
    this.showComparison = true;
    
    this.databaseService.getTableData(rule.table_name, rule.schema_name, 5)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Preparar datos para la comparación
            this.processComparisonData(response.data, rule);
          } else {
            this.showComparison = false;
          }
          this.comparisonLoading = false;
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Error al cargar datos para comparación',
            'Cerrar',
            { duration: 5000 }
          );
          this.comparisonLoading = false;
          this.showComparison = false;
        }
      });
  }

  processComparisonData(data: any[], rule: MaskingRule): void {
    if (!data.length || !rule.column_name) {
      this.showComparison = false;
      return;
    }

    this.comparisonData = data.map(item => ({
      ...item,
      masked: this.maskingService.applyMaskingPreview(
        item[rule.column_name], 
        rule.masking_type, 
        rule.visible_chars || 0
      )
    }));
  }

  closeComparison(): void {
    this.showComparison = false;
    this.lastCreatedRule = null;
    this.comparisonData = [];
  }

  confirmDelete(rule: MaskingRule): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de eliminar la regla de enmascaramiento para la columna ${rule.column_name} de la tabla ${rule.table_name}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && rule.id) {
        this.deleteRule(rule.id);
      }
    });
  }

  deleteRule(id: number): void {
    this.maskingService.deleteMaskingRule(id)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Regla eliminada correctamente', 'Cerrar', {
              duration: 3000
            });
            this.loadRules();
          }
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Error al eliminar regla',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  applyMasking(rule: MaskingRule): void {
    if (!rule.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Enmascaramiento',
        message: `¿Está seguro de aplicar el enmascaramiento a la columna ${rule.column_name} de la tabla ${rule.table_name}? Esta acción renombrará la tabla original.`,
        confirmText: 'Aplicar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.maskingService.applyMasking(rule.id as number)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.snackBar.open('Enmascaramiento aplicado correctamente', 'Cerrar', {
                  duration: 3000
                });
                this.loadRules();
                this.closeComparison(); // Cerrar la ventana de comparación si está abierta
              }
            },
            error: (error) => {
              this.snackBar.open(
                error.error?.message || 'Error al aplicar enmascaramiento',
                'Cerrar',
                { duration: 5000 }
              );
            }
          });
      }
    });
  }

  removeMasking(rule: MaskingRule): void {
    if (!rule.id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Eliminación de Enmascaramiento',
        message: `¿Está seguro de eliminar el enmascaramiento de la columna ${rule.column_name} de la tabla ${rule.table_name}? Esta acción eliminará la vista y restaurará la tabla original.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.maskingService.removeMasking(rule.id as number)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.snackBar.open('Enmascaramiento eliminado correctamente', 'Cerrar', {
                  duration: 3000
                });
                this.loadRules();
              }
            },
            error: (error) => {
              this.snackBar.open(
                error.error?.message || 'Error al eliminar enmascaramiento',
                'Cerrar',
                { duration: 5000 }
              );
            }
          });
      }
    });
  }

  configureTriggers(rule: MaskingRule): void {
    if (!rule.id) return;
    
    const dialogRef = this.dialog.open(TriggerDialogComponent, {
      width: '500px',
      data: {
        ruleId: rule.id,
        tableName: rule.table_name,
        currentOperations: rule.trigger_operations ? rule.trigger_operations.split(',') : []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRules();
      }
    });
  }

  // Formato para mostrar fecha en español
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES');
  }
} 