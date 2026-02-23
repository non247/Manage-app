import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModelService } from '../../core/services/model.service';

@Component({
  selector: 'app-model',
  imports: [],
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
      is_holiday: 0,
      duration_days: 7,
      start_date: '2026-01-26',
      end_date: '2026-02-01',
    });
  }

  ngOnInit(): void {
    this.onSubmit();
  }

  predictForm: FormGroup;
  result: any = null;

  onSubmit() {
    const formData = {
      flavor: this.predictForm.value.flavor,
      is_holiday: this.predictForm.value.is_holiday,
      duration_days: this.predictForm.value.duration_days,
      start_date: this.predictForm.value.start_date,
      end_date: this.predictForm.value.end_date,
    };

    this.modelService.getForecastSoldPerDay(formData).subscribe({
      next: (res) => {
        this.result = res.prediction;
        console.log('Forecast result:', res);
      },
      error: (err) => console.error('Error:', err),
    });
  }
}
