import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TableModule } from 'primeng/table';
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
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChartCanvas')
  productChartCanvas!: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;
  topSellerChart?: Chart;
  productChart?: Chart;

  todaySales = 0;
  totalProducts = 0;
  totalSold = 0;

  salesView: 'day' | 'month' | 'year' = 'day';

  private dashboardData?: DashboardResponse;

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    if (this.dashboardData) {
      this.renderCharts();
    }
  }

  // 🔹 โหลดข้อมูลจาก Backend
  loadDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.todaySales = Number(res.todaySales);
        this.totalProducts = Number(res.totalProducts);
        this.totalSold = Number(res.totalSold);
        this.dashboardData = res;

        if (this.salesCanvas) {
          this.renderCharts();
        }
      },
      error: (err) => console.error(err),
    });
  }

  renderCharts() {
    if (!this.dashboardData) return;

    // this.changeSalesView(this.salesView);
    // this.createTopSellerChart(this.dashboardData.topSellers);
    this.createProductChart(this.dashboardData.productChart);
  }

  // =========================
  // 🔁 เปลี่ยนมุมมองยอดขาย
  // =========================

  changeSalesView(view: 'day' | 'month' | 'year') {
    this.salesView = view;
    if (!this.dashboardData) return;

    const daily = this.dashboardData.salesChart;

    if (view === 'day') {
      this.createSalesChart(this.toDaily(daily), 'day');
    }

    if (view === 'month') {
      this.createSalesChart(this.toMonthly(daily), 'month');
    }

    if (view === 'year') {
      this.createSalesChart(this.toYearly(daily), 'year');
    }
  }

  toDaily(data: any[]) {
    const map = new Map<string, number>();

    // แปลงข้อมูลจาก backend ใส่ map
    data.forEach((d) => {
      const date = new Date(d.date);
      const key = date.toISOString().split('T')[0]; // yyyy-mm-dd
      map.set(key, Number(d.total));
    });

    const result: { label: string; total: number; color: string }[] = [];

    // สีประจำวัน (จันทร์ - อาทิตย์)
    const colors = [
      '#FCEE9E', // จันทร์
      '#FFBFC5', // อังคาร
      '#ADD495', // พุธ
      '#FF9800', // พฤหัส
      '#A8D1E7', // ศุกร์
      '#E0C7EE', // เสาร์
      '#F898A4', // อาทิตย์
    ];

    const today = new Date();

    // หาวันจันทร์ของสัปดาห์ปัจจุบัน
    const day = today.getDay(); // 0 = อาทิตย์
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    // วน 7 วัน (จันทร์ → อาทิตย์)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const key = date.toISOString().split('T')[0];

      result.push({
        label: date.toLocaleDateString('th-TH', {
          // weekday: 'short',
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

      map.set(key, (map.get(key) || 0) + Number(d.total));
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
      map.set(year, (map.get(year) || 0) + Number(d.total));
    });

    return Array.from(map.entries()).map(([label, total]) => ({
      label,
      total,
    }));
  }

  createSalesChart(dataSource: any[], view: 'day' | 'month' | 'year') {
    const ctx = this.salesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.salesChart) this.salesChart.destroy();

    // =========================
    // 🎨 กำหนดสี
    // =========================

    // สีรายวัน (มาจาก toDaily)
    const dayColors = dataSource.map((d) => d.color ?? '#CBD5E1');

    // Gradient รายเดือน
    const monthGradient = ctx.createLinearGradient(0, 0, 0, 300);
    monthGradient.addColorStop(0, '#60A5FA');
    monthGradient.addColorStop(1, '#2563EB');

    // Gradient รายปี
    const yearGradient = ctx.createLinearGradient(0, 0, 0, 300);
    yearGradient.addColorStop(0, '#34D399');
    yearGradient.addColorStop(1, '#059669');

    const backgroundColor =
      view === 'day'
        ? dayColors
        : view === 'month'
          ? monthGradient
          : yearGradient;

    // =========================
    // 📊 สร้าง Chart
    // =========================

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataSource.map((d) => d.label),
        datasets: [
          {
            label: 'ยอดขายรวม',
            data: dataSource.map((d) => d.total),
            backgroundColor,
            borderRadius: 10,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },

        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed?.y ?? 0;
                return `ยอดขาย ${value.toLocaleString()} บาท`;
              },
            },
          },
        },

        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => `${Number(v).toLocaleString()}`,
            },
          },
        },
      },
    });
  }

  // 🔹 กราฟสินค้าขายดีที่สุด
  createTopSellerChart(dataSource: any[]) {
    const ctx = this.topSellerCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.topSellerChart) this.topSellerChart.destroy();

    this.topSellerChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: dataSource.map((d) => d.name),
        datasets: [
          {
            data: dataSource.map((d) => Number(d.sold)), // จำนวนที่ขาย
            // ❌ ห้ามใส่ radius ที่นี่ (TS error)
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        // ⭐ เว้นระยะรอบกราฟ (แก้ปัญหาชิดขอบ)
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 40,
          },
        },

        // ⭐ ตั้งค่า arc อย่างถูกต้อง (TS รองรับ)
        elements: {
          arc: {
            borderWidth: 2,
          },
        },

        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20, // ⭐ เว้นระยะ legend
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const item = dataSource[index];

                const sold = Number(item.sold);
                const totalSales = Number(item.total_sales || 0);

                return [
                  `จำนวนขาย: ${sold} ชิ้น`,
                  `ยอดขายรวม: ${totalSales.toLocaleString()} บาท`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // 🔹 กราฟสินค้าทั้งหมด
  createProductChart(dataSource: any[]) {
    const ctx = this.productChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.productChart) this.productChart.destroy();

    // ✅ เรียงจำนวนขายจากมาก → น้อย
    const sortedData = [...dataSource].sort(
      (a, b) => Number(b.sold) - Number(a.sold)
    );

    this.productChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [''],

        // 1 สินค้า = 1 dataset (legend = ชื่อสินค้า)
        datasets: sortedData.map((d) => ({
          label: d.name,
          data: [Number(d.sold)], // จำนวนขาย
          borderRadius: 8,

          // ราคารวมจาก backend
          totalSales: Number(d.total_sales),
        })),
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const sold = context.parsed.y;
                const totalSales = context.dataset.totalSales;

                return [
                  `${context.dataset.label}`,
                  `จำนวนขาย: ${sold} ชิ้น`,
                  `ราคารวม: ${totalSales.toLocaleString()} บาท`,
                ];
              },
            },
          },
        },

        scales: {
          x: {
            display: false,
          },
          y: {
            title: {
              display: true,
              text: 'จำนวนขาย (ชิ้น)',
            },
            ticks: {
              callback: (value) => `${value}`,
            },
          },
        },
      },
    });
  }
}
