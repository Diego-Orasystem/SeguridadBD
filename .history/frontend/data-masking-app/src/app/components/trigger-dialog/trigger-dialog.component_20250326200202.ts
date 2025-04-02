import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaskingService } from '../../services/masking.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface TriggerDialogData {
  ruleId: number;
  tableName: string;
  currentOperations: string[];
}

@Component({
  selector: 'app-trigger-dialog',
  templateUrl: './trigger-dialog.component.html',
  styleUrls: ['./trigger-dialog.component.scss']
})
export class TriggerDialogComponent {
  availableOperations = [
    { value: 'INSERT', label: 'Inserción' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'DELETE', label: 'Eliminación' }
  ];
  
  selectedOperations: string[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<TriggerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TriggerDialogData,
    private maskingService: MaskingService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar operaciones seleccionadas
    this.selectedOperations = [...data.currentOperations];
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  saveConfig(): void {
    this.loading = true;
    
    this.maskingService.configureTriggers({
      ruleId: this.data.ruleId,
      operations: this.selectedOperations
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Triggers configurados correctamente', 'Cerrar', {
            duration: 3000
          });
          this.dialogRef.close(true);
        }
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Error al configurar triggers',
          'Cerrar',
          { duration: 5000 }
        );
        this.loading = false;
      }
    });
  }
} 