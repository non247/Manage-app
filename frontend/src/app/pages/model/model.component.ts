import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModelService } from '../../core/services/model.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    InputNumberModule,
    CheckboxModule,
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss',
})
export class ModelComponent implements OnInit {
  constructor(
    private readonly modelService: ModelService,
    private readonly fb: FormBuilder
  ) {
    this.predictForm = this.fb.group({
      flavor: 'มิ้นต์ช็อกโกแลตชิพ',
      is_holiday: false,
      duration_days: 7,
      start_date: new Date('2026-01-26'),
      end_date: new Date('2026-02-01'),
    });
  }

  ngOnInit(): void {
    this.onSubmit();
  }

  predictForm: FormGroup;
  result: any = null;

  private formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.predictForm.invalid) return;

    const formData = {
      ...this.predictForm.value,
      is_holiday: this.predictForm.value.is_holiday ? 1 : 0,
      start_date: this.formatDate(this.predictForm.value.start_date),
      end_date: this.formatDate(this.predictForm.value.end_date),
    };

    this.modelService.getForecastSoldPerDay(formData).subscribe({
      next: (res) => {
        this.result = res.forecasted_totalsold;
        console.log('Forecast result:', res);
      },
      error: (err) => {
        console.error('Error:', err);
        this.result = null;
      },
    });
  }
}
