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
import { Chart, registerables } from 'chart.js';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import {
  DashboardResponse,
  DashboardService,
} from '../../../core/services/Dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule, CommonModule],
  templateUrl: './Dashboard.component.html',
  styleUrl: './Dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChartCanvas')
  productChartCanvas!: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;
  topSellerChart?: Chart;
  productChart?: Chart;

  todaySales = 0;

  // ✅ วันนี้กี่ "รายการ" (นับจำนวนแถวของวันนี้)
  todayProducts = 0;

  totalProducts = 0;
  totalSold = 0;

  // ✅ รายการที่ส่งมาจาก checkbox (ใช้คำนวณวันนี้กี่รายการ)
  sentTodayList: any[] = [];

  salesView: 'day' | 'month' | 'year' = 'day';

  private dashboardData?: DashboardResponse;
  private viewReady = false;

  // ✅ ถ้ามาจาก checkbox แล้ว ไม่ให้ backend override ค่า todayProducts
  private fromCheckbox = false;

  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    if (this.isBrowser) {
      if (history.state?.loginSuccess) {
        history.replaceState({}, '');
      }
    }

    // ==================================================
    // ✅ รับรายการที่ส่งจาก checkbox แล้ว "นับของวันนี้"
    // ==================================================
    if (this.isBrowser) {
      const st: any = history.state;

      if (st?.fromCheckbox && Array.isArray(st?.sentList)) {
        this.fromCheckbox = true;
        this.sentTodayList = st.sentList;

        // ✅ นับเฉพาะรายการที่เป็น "วันนี้"
        this.todayProducts = this.calcTodayCount(this.sentTodayList);

        // กัน state ค้าง
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
    this.topSellerChart?.destroy();
    this.productChart?.destroy();
  }

  // =========================
  // ✅ Helpers: กัน NaN + รองรับ snake_case
  // =========================
  private toNumber(v: any): number {
    if (typeof v === 'string') v = v.replace(/,/g, '');
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

  // ✅ ทำ key วันที่แบบ local (แก้ปัญหา UTC day shift)
  private dateKeyLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ✅ รองรับ date เป็น string "22/02/2026"
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

  // ✅ แปลง date จาก item เป็น key local แบบ "YYYY-MM-DD"
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

  // ✅ นับรายการของ "วันนี้"
  private calcTodayCount(list: any[]): number {
    const todayKey = this.dateKeyLocal(new Date());

    return (list || []).filter((x) => {
      // รองรับชื่อ key วันที่หลายแบบ
      const rawDate =
        x?.date ?? x?.Date ?? x?.createdAt ?? x?.created_at ?? x?.soldDate;

      const key = this.dateKeyFromItemDate(rawDate);
      return key !== '' && key === todayKey;
    }).length;
  }

  // =========================
  // 🔹 โหลดข้อมูลจาก Backend  ✅ (แก้ตรงนี้)
  // =========================
  loadDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (res: any) => {
        // ✅ todaySales
        this.todaySales = this.toNumber(
          this.pick(res, 'todaySales', 'today_sales', 'todaySale', 'today_sale')
        );

        // ✅ todayProducts: backend ส่งเป็น "ตัวเลข" (COUNT แถววันนี้)
        // ถ้ามาจาก checkbox ไม่ override
        if (!this.fromCheckbox) {
          this.todayProducts = this.toNumber(
            this.pick(
              res,
              'todayProducts', // <-- backend ของคุณส่งชื่อนี้
              'today_items', // เผื่อคุณเปลี่ยนเป็น snake_case ในอนาคต
              'todayItems',
              'today_items_count'
            )
          );
        }

        // ✅ totalProducts: backend ส่งเป็นตัวเลข
        this.totalProducts = this.toNumber(
          this.pick(res, 'totalProducts', 'total_products', 'productsTotal')
        );

        // ✅ totalSold
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

  // =========================
  // 🔁 เปลี่ยนมุมมองยอดขาย
  // =========================
  changeSalesView(view: 'day' | 'month' | 'year') {
    this.salesView = view;
    if (!this.dashboardData) return;

    const daily = (this.dashboardData as any).salesChart || [];

    if (view === 'day') this.createSalesChart(this.toDaily(daily), 'day');
    if (view === 'month') this.createSalesChart(this.toMonthly(daily), 'month');
    if (view === 'year') this.createSalesChart(this.toYearly(daily), 'year');
  }

  // ✅ แก้: ไม่ใช้ toISOString (UTC) + รวมยอดวันเดียวกัน
  toDaily(data: any[]) {
    const map = new Map<string, number>();

    data.forEach((d) => {
      const date = new Date(d.date);
      const key = this.dateKeyLocal(date);
      map.set(key, (map.get(key) || 0) + this.toNumber(d.total));
    });

    const result: { label: string; total: number; color: string }[] = [];

    const colors = [
      '#FCEE9E',
      '#FFBFC5',
      '#ADD495',
      '#FF9800',
      '#A8D1E7',
      '#E0C7EE',
      '#F898A4',
    ];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() + diffToMonday);

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

  // =========================
  // 📊 กราฟยอดขาย
  // =========================
  createSalesChart(dataSource: any[], view: 'day' | 'month' | 'year') {
    const ctx = this.salesCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.salesChart?.destroy();

    const dayColors = dataSource.map((d) => d.color ?? '#CBD5E1');

    const monthGradient = ctx.createLinearGradient(0, 0, 0, 300);
    monthGradient.addColorStop(0, '#60A5FA');
    monthGradient.addColorStop(1, '#2563EB');

    const yearGradient = ctx.createLinearGradient(0, 0, 0, 300);
    yearGradient.addColorStop(0, '#34D399');
    yearGradient.addColorStop(1, '#059669');

    const backgroundColor =
      view === 'day'
        ? dayColors
        : view === 'month'
          ? monthGradient
          : yearGradient;

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataSource.map((d) => d.label),
        datasets: [
          {
            label: 'ยอดขายรวม',
            data: dataSource.map((d) => this.toNumber(d.total)),
            backgroundColor,
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

  // =========================
  // 🥧 กราฟสินค้าขายดีที่สุด
  // =========================
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
  // =========================
  // 📦 กราฟสินค้าทั้งหมด
  // =========================
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
                return `${context.dataset.label}: ${value.toLocaleString()} ชิ้น`;
              },
            },
          },
        },
        scales: {
          x: { display: false },
          y: {
            title: { display: true, text: 'จำนวนขาย (ชิ้น)' },
            ticks: {
              callback: (value) => `${value} ชิ้น`,
            },
          },
        },
      },
    });
  }
}
