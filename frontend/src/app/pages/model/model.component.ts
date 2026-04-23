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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ModelService } from '../../core/services/model.service';

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
  ) {}

  initialForm(): void {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    this.forecastForm = this.fb.group({
      is_holiday: false,
      start_date: [startDate, Validators.required],
      end_date: [endDate, Validators.required],
    });
  }

  ngOnInit(): void {
    this.initialForm();
    this.onSubmit();
  }

  ngAfterViewInit(): void {
    // Canvas element is now available, safe to render (browser only)
    if (this.isBrowser) {
      this.onSubmit();
    }
  }

  forecastForm!: FormGroup;
  forecastResult: any[] = [];
  forecastChart?: Chart;

  get topFlavor(): string {
    if (!this.forecastResult || this.forecastResult.length === 0) return '-';
    // Get the highest forecasted_totalsold
    const sorted = [...this.forecastResult].sort(
      (a, b) =>
        Number(b.forecasted_totalsold ?? 0) -
        Number(a.forecasted_totalsold ?? 0)
    );
    return sorted[0]?.flavor ?? '-';
  }

  get topFlavorSold(): number {
    if (!this.forecastResult || this.forecastResult.length === 0) return 0;
    // Get the highest forecasted_totalsold
    const sorted = [...this.forecastResult].sort(
      (a, b) =>
        Number(b.forecasted_totalsold ?? 0) -
        Number(a.forecasted_totalsold ?? 0)
    );
    return Number(sorted[0]?.forecasted_totalsold ?? 0);
  }

  get totalForecastSold(): number {
    if (!this.forecastResult) return 0;
    return this.forecastResult.reduce(
      (sum, item) => sum + Number(item.forecasted_totalsold ?? 0),
      0
    );
  }

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

  // Color palette for different flavors
  private readonly colorPalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B88B', // Peach
    '#A9DFBF', // Light Green
    '#F1948A', // Coral
    '#D5A6BD', // Mauve
    '#AED6F1', // Light Blue
    '#F8B7D3', // Pink
    '#D4EFDF', // Pale Green
  ];

  private getFlavorColor(index: number): string {
    return this.colorPalette[index % this.colorPalette.length];
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
            label: 'จำนวนที่พยากรณ์',
            data: totals,
            backgroundColor: labels.map((_, index) =>
              this.getFlavorColor(index)
            ),
            borderColor: labels.map((_, index) => this.getFlavorColor(index)),
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
              text: 'จำนวนที่พยากรณ์ (ถ้วย)',
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
    if (this.forecastForm.invalid) return;

    const formData = {
      ...this.forecastForm.value,
      is_holiday: this.forecastForm.value.is_holiday ? 1 : 0,
      start_date: this.formatDate(this.forecastForm.value.start_date),
      end_date: this.formatDate(this.forecastForm.value.end_date),
    };

    this.modelService.getSaleForecastData(formData).subscribe({
      next: (res) => {
        this.forecastResult = Array.isArray(res.results) ? res.results : [];
        // Sort results from high to low by forecasted_totalsold
        this.forecastResult.sort(
          (a, b) =>
            Number(b.forecasted_totalsold ?? 0) -
            Number(a.forecasted_totalsold ?? 0)
        );
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
