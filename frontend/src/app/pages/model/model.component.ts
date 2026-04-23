import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModelService } from '../../core/services/model.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
export class ModelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('forecastChartCanvas')
  forecastChartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  constructor(
    private readonly modelService: ModelService,
    private readonly fb: FormBuilder
  ) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    this.predictForm = this.fb.group({
      is_holiday: false,
      start_date: startDate,
      end_date: endDate,
    });
  }

  ngOnInit(): void {
    // Form is ready here, but view is not
  }

  ngAfterViewInit(): void {
    // Canvas element is now available, safe to render (browser only)
    if (this.isBrowser) {
      this.onSubmit();
    }
  }

  predictForm: FormGroup;
  forecastResult: any[] = [];
  forecastChart?: Chart;

  private formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.forecastChart?.destroy();
    }
  }

  private renderForecastChart(): void {
    if (!this.isBrowser) return;

    let dataSource = this.forecastResult || [];
    // Sort by forecasted_totalsold descending (highest to lowest)
    dataSource = [...dataSource].sort(
      (a, b) =>
        Number(b.forecasted_totalsold ?? 0) -
        Number(a.forecasted_totalsold ?? 0)
    );

    const ctx = this.forecastChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.forecastChart?.destroy();

    const labels = dataSource.map((item) => item.flavor ?? 'ไม่ระบุ');
    const totals = dataSource.map((item) =>
      Math.round(Number(item.forecasted_totalsold ?? 0))
    );

    this.forecastChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Forecast Totalsold',
            data: totals,
            backgroundColor: labels.map(
              (_, index) => `rgba(216, 27, 96, ${0.55 + index * 0.1})`
            ),
            borderColor: labels.map(() => 'rgba(216, 27, 96, 0.95)'),
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw ?? 0);
                return `${context.dataset.label}: ${value.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }
                )} ถ้วย`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Flavor',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Forecast Total Sold (ถ้วย)',
            },
            ticks: {
              callback: (value) => `${value}`,
            },
          },
        },
      },
    });
  }

  onSubmit() {
    if (this.predictForm.invalid) return;

    const formData = {
      ...this.predictForm.value,
      is_holiday: this.predictForm.value.is_holiday ? 1 : 0,
      start_date: this.formatDate(this.predictForm.value.start_date),
      end_date: this.formatDate(this.predictForm.value.end_date),
    };

    this.modelService.getSaleForecastData(formData).subscribe({
      next: (res) => {
        this.forecastResult = Array.isArray(res.results) ? res.results : [];
        console.log('Forecast result:', res);
        // Defer chart rendering until canvas is in the DOM (browser only)
        if (this.isBrowser) {
          setTimeout(() => this.renderForecastChart(), 0);
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.forecastResult = [];
        if (this.isBrowser) {
          this.forecastChart?.destroy();
        }
      },
    });
  }
}
