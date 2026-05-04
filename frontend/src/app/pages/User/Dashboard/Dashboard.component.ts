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
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import {
  DashboardResponse,
  DashboardService,
} from '../../../core/services/Dashboard.service';
import { ModelService } from '../../../core/services/model.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule, CommonModule, DatePickerModule, FormsModule],
  templateUrl: './Dashboard.component.html',
  styleUrl: './Dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedDate: Date = new Date();

  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesLineCanvas') salesLineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChartCanvas')
  productChartCanvas!: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;
  salesLineChart?: Chart;
  topSellerChart?: Chart;
  productChart?: Chart;

  todaySales = 0;
  todayProducts = 0;
  totalProducts = 0;
  totalSold = 0;

  sentTodayList: any[] = [];
  salesView: 'day' | 'month' | 'year' = 'day';

  predictedFlavors: { name: string; sold: number; totalSales?: number }[] = [];
  totalForecastSold = 0;

  forecastStartDate: string = '';
  forecastEndDate: string = '';

  weekOffset = 0;

  private dashboardData?: DashboardResponse;
  private viewReady = false;
  private fromCheckbox = false;

  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly modelService: ModelService
  ) {}

  ngOnInit(): void {
    if (this.isBrowser) {
      const st: any = history.state;

      if (st?.loginSuccess) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'ยินดีต้อนรับเข้าสู่ระบบ',
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
        });
      }

      if (st?.fromCheckbox && Array.isArray(st?.sentList)) {
        this.fromCheckbox = true;
        this.sentTodayList = st.sentList;
        this.todayProducts = this.calcTodayCount(this.sentTodayList);
      }

      if (st?.loginSuccess || st?.fromCheckbox) {
        history.replaceState({}, '');
      }
    }

    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dashboardData) this.renderCharts();
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.salesLineChart?.destroy();
    this.topSellerChart?.destroy();
    this.productChart?.destroy();
  }

  private toNumber(v: any): number {
    if (typeof v === 'string') v = v.replaceAll(',', '');
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private pick(res: any, ...keys: string[]) {
    for (const k of keys) {
      const val = res?.[k];
      if (val !== undefined && val !== null) return val;
    }
    return 0;
  }

  private dateKeyLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDMY(s: string): Date | null {
    if (!s) return null;
    const parts = s.split('/');
    if (parts.length !== 3) return null;

    const dd = Number(parts[0]);
    const mm = Number(parts[1]);
    const yyyy = Number(parts[2]);

    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
  }

  private dateKeyFromItemDate(itemDate: any): string {
    let d: Date;

    if (itemDate instanceof Date) {
      d = itemDate;
    } else if (typeof itemDate === 'string' && itemDate.includes('/')) {
      d = this.parseDMY(itemDate) ?? new Date(itemDate);
    } else {
      d = new Date(itemDate);
    }

    if (Number.isNaN(d.getTime())) return '';
    return this.dateKeyLocal(d);
  }

  private calcTodayCount(list: any[]): number {
    const todayKey = this.dateKeyLocal(new Date());

    return (list || []).filter((x) => {
      const rawDate =
        x?.date ?? x?.Date ?? x?.createdAt ?? x?.created_at ?? x?.soldDate;

      const key = this.dateKeyFromItemDate(rawDate);
      return key !== '' && key === todayKey;
    }).length;
  }

  private getMondayOfWeek(baseDate: Date): Date {
    const ref = new Date(baseDate);
    ref.setHours(0, 0, 0, 0);

    const dayOfWeek = ref.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(ref);
    monday.setDate(ref.getDate() + diffToMonday);
    return monday;
  }

  private getBaseDateFromOffset(): Date {
    const base = new Date(this.selectedDate || new Date());
    base.setDate(base.getDate() + this.weekOffset * 7);
    return base;
  }

  get weekRangeLabel(): string {
    const monday = this.getMondayOfWeek(this.getBaseDateFromOffset());
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const start = monday.toLocaleDateString('th-TH-u-ca-gregory', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const end = sunday.toLocaleDateString('th-TH-u-ca-gregory', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${start} - ${end}`;
  }

  onDateChange(): void {
    this.weekOffset = 0;
    if (this.salesView === 'day') {
      this.changeSalesView('day');
    }
  }

  goPrevWeek(): void {
    this.weekOffset--;
    if (this.salesView === 'day') {
      this.changeSalesView('day');
    }
  }

  goNextWeek(): void {
    if (this.weekOffset < 0) {
      this.weekOffset++;
      if (this.salesView === 'day') {
        this.changeSalesView('day');
      }
    }
  }

  goCurrentWeek(): void {
    this.selectedDate = new Date();
    this.weekOffset = 0;
    if (this.salesView === 'day') {
      this.changeSalesView('day');
    }
  }

  private calculatePredictedFlavors() {
    if (!this.dashboardData) {
      this.predictedFlavors = [];
      return;
    }

    const topSellers = (this.dashboardData as any).topSellers || [];
    const productChart = (this.dashboardData as any).productChart || [];
    const source = topSellers.length > 0 ? topSellers : productChart;

    this.predictedFlavors = source
      .map((item: any) => ({
        name: item.name,
        sold: this.toNumber(item.sold),
        totalSales: this.toNumber(item.total_sales),
      }))
      .filter((item: any) => item.name && item.sold > 0)
      .sort((a: any, b: any) => b.sold - a.sold)
      .slice(0, 5);
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadForecastedFlavors(): void {
    // Get next 7 days starting from today
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Store dates for display
    this.forecastStartDate = startDate.toLocaleDateString(
      'th-TH-u-ca-gregory',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
    this.forecastEndDate = endDate.toLocaleDateString('th-TH-u-ca-gregory', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const payload = {
      start_date: this.formatDateForAPI(startDate),
      end_date: this.formatDateForAPI(endDate),
    };

    this.modelService.getSaleForecastData(payload).subscribe({
      next: (res: any) => {
        const results = Array.isArray(res.results) ? res.results : [];

        // Transform API response to predictedFlavors format
        this.predictedFlavors = results
          .map((item: any) => ({
            name: item.flavor,
            sold: this.toNumber(item.forecasted_totalsold_rounded),
          }))
          .filter((item: any) => item.name && item.sold > 0)
          .sort((a: any, b: any) => b.sold - a.sold);

        // Calculate total forecast sold
        this.totalForecastSold = results.reduce(
          (sum: number, item: { forecasted_totalsold_rounded: any }) =>
            sum + this.toNumber(item.forecasted_totalsold_rounded),
          0
        );
      },
      error: (err) => {
        console.error('Error loading forecasted flavors:', err);
        this.predictedFlavors = [];
        this.totalForecastSold = 0;
      },
    });
  }

  loadDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (res: any) => {
        this.todaySales = this.toNumber(
          this.pick(res, 'todaySales', 'today_sales', 'todaySale', 'today_sale')
        );

        if (!this.fromCheckbox) {
          this.todayProducts = this.toNumber(
            this.pick(
              res,
              'todayProducts',
              'today_items',
              'todayItems',
              'today_items_count'
            )
          );
        }

        this.totalProducts = this.toNumber(
          this.pick(res, 'totalProducts', 'total_products', 'productsTotal')
        );

        this.totalSold = this.toNumber(
          this.pick(
            res,
            'totalSold',
            'total_sold',
            'soldTotal',
            'qtySold',
            'total_qty_sold'
          )
        );

        this.dashboardData = res;
        this.loadForecastedFlavors();

        if (this.isBrowser && this.viewReady) {
          this.renderCharts();
        }
      },
      error: (err) => console.error(err),
    });
  }

  renderCharts() {
    if (!this.isBrowser) return;
    if (!this.dashboardData) return;
    if (!this.viewReady) return;

    this.changeSalesView(this.salesView);
    this.createTopSellerChart((this.dashboardData as any).topSellers || []);
    this.createProductChart((this.dashboardData as any).productChart || []);
  }

  changeSalesView(view: 'day' | 'month' | 'year') {
    this.salesView = view;
    if (!this.dashboardData) return;

    const daily = (this.dashboardData as any).salesChart || [];
    let chartData: any[] = [];

    if (view === 'day') {
      chartData = this.toDaily(daily, this.getBaseDateFromOffset());
      this.createSalesChart(chartData, 'day');
      this.createSalesLineChart(chartData, 'day');
    }

    if (view === 'month') {
      chartData = this.toMonthly(daily);
      this.createSalesChart(chartData, 'month');
      this.createSalesLineChart(chartData, 'month');
    }

    if (view === 'year') {
      chartData = this.toYearly(daily);
      this.createSalesChart(chartData, 'year');
      this.createSalesLineChart(chartData, 'year');
    }
  }

  toDaily(data: any[], baseDate: Date) {
    const map = new Map<string, number>();

    data.forEach((d) => {
      const date = new Date(d.date);
      const key = this.dateKeyLocal(date);
      map.set(key, (map.get(key) || 0) + this.toNumber(d.total));
    });

    const result: { label: string; total: number; color: string }[] = [];

    const colors = [
      '#FFF3B0', // จันทร์
      '#FFD6E0', // อังคาร
      '#CDE7BE', // พุธ
      '#FFD8A8', // พฤหัส
      '#CFE8F7', // ศุกร์
      '#E8D9F3', // เสาร์
      '#F9D0D8', // อาทิตย์
    ];

    const monday = this.getMondayOfWeek(baseDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const key = this.dateKeyLocal(date);

      result.push({
        label: date.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
        }),
        total: map.get(key) || 0,
        color: colors[i],
      });
    }

    return result;
  }

  toMonthly(data: any[]) {
    const map = new Map<string, number>();

    data.forEach((d) => {
      const date = new Date(d.date);
      const key = date.toLocaleString('th-TH', { month: 'long' });
      map.set(key, (map.get(key) || 0) + this.toNumber(d.total));
    });

    return Array.from(map.entries()).map(([label, total]) => ({
      label,
      total,
    }));
  }

  toYearly(data: any[]) {
    const map = new Map<number, number>();

    data.forEach((d) => {
      const year = new Date(d.date).getFullYear();
      map.set(year, (map.get(year) || 0) + this.toNumber(d.total));
    });

    return Array.from(map.entries()).map(([label, total]) => ({
      label,
      total,
    }));
  }

  createSalesChart(dataSource: any[], view: 'day' | 'month' | 'year') {
    const ctx = this.salesCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.salesChart?.destroy();

    const pastelColors = [
      '#CFE8F7',
      '#FEC8D8',
      '#CDE7BE',
      '#FFD6E0',
      '#A8D1E7',
      '#FFDFD3',
      '#F9E79F',
      '#E0C7EE',
      '#FFD8A8',
      '#DCC6E0',
      '#BFE3C0',
      '#F9D0D8',
    ];

    const dayColors = dataSource.map((d) => d.color ?? '#CBD5E1');
    const pastelSeriesColors = dataSource.map(
      (_, i) => pastelColors[i % pastelColors.length]
    );

    const backgroundColor = view === 'day' ? dayColors : pastelSeriesColors;

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataSource.map((d) => d.label),
        datasets: [
          {
            label: 'ยอดขายรวม',
            data: dataSource.map((d) => this.toNumber(d.total)),
            backgroundColor,
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 10,
            barPercentage: 0.6,
            minBarLength: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 16, bottom: 12, left: 26, right: 20 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = (ctx as any).parsed?.y ?? 0;
                return `ยอดขาย ${Number(value).toLocaleString()} บาท`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, padding: 10 },
          },
          y: {
            beginAtZero: true,
            ticks: {
              padding: 10,
              callback: (v) => `${Number(v).toLocaleString()}`,
            },
          },
        },
      },
    });
  }

  createSalesLineChart(dataSource: any[], view: 'day' | 'month' | 'year') {
    const ctx = this.salesLineCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.salesLineChart?.destroy();

    this.salesLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataSource.map((d) => d.label),
        datasets: [
          {
            label: 'แนวโน้มยอดขาย',
            data: dataSource.map((d) => this.toNumber(d.total)),
            borderColor: '#d81b60',
            backgroundColor: 'rgba(216,27,96,0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#d81b60',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 16, bottom: 12, left: 26, right: 20 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = (ctx as any).parsed?.y ?? 0;
                return `ยอดขาย ${Number(value).toLocaleString()} บาท`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, padding: 10 },
          },
          y: {
            beginAtZero: true,
            ticks: {
              padding: 10,
              callback: (v) => `${Number(v).toLocaleString()}`,
            },
          },
        },
      },
    });
  }

  createTopSellerChart(dataSource: any[]) {
    const ctx = this.topSellerCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.topSellerChart?.destroy();

    this.topSellerChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: dataSource.map((d) => d.name),
        datasets: [
          {
            data: dataSource.map((d) => this.toNumber(d.sold)),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20, bottom: 20, left: 20, right: 40 } },
        elements: { arc: { borderWidth: 2 } },
        plugins: {
          legend: {
            position: 'right',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw ?? 0);
                return `${value.toLocaleString()} ชิ้น`;
              },
            },
          },
        },
      },
    });
  }

  createProductChart(dataSource: any[]) {
    const ctx = this.productChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.productChart?.destroy();

    const sortedData = [...dataSource].sort(
      (a, b) => this.toNumber(b.sold) - this.toNumber(a.sold)
    );

    this.productChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [''],
        datasets: sortedData.map((d) => ({
          label: d.name,
          data: [this.toNumber(d.sold)],
          borderRadius: 8,
          totalSales: this.toNumber(d.total_sales),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { usePointStyle: true, pointStyle: 'circle' },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw ?? 0);
                return `${context.dataset.label}: ${value.toLocaleString()} รายการ`;
              },
            },
          },
        },
        scales: {
          x: { display: false },
          y: {
            title: { display: true, text: 'จำนวนทั้งหมด (รายการ)' },
            ticks: {
              callback: (value) => `${value} รายการ`,
            },
          },
        },
      },
    });
  }
}
