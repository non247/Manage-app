import {Component,ElementRef,ViewChild,OnInit,AfterViewInit} from '@angular/core';
import {Chart,registerables} from 'chart.js';
import {TableModule} from 'primeng/table';
import {DashboardService} from '../../../core/services/Dashboard.service';
import {DashboardResponse} from '../../../core/services/Dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule],
  templateUrl: './Dashboard.component.html',
  styleUrl: './Dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('salesCanvas') salesCanvas!: ElementRef < HTMLCanvasElement > ;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef < HTMLCanvasElement > ;
  @ViewChild('productChartCanvas') productChartCanvas!: ElementRef < HTMLCanvasElement > ;

  salesChart ? : Chart;
  topSellerChart ? : Chart;
  productChart ? : Chart;

  todaySales = 0;
  totalProducts = 0;

  private dashboardData ? : DashboardResponse;

  constructor(private dashboardService: DashboardService) {}

  // 1️⃣ โหลดข้อมูลอย่างเดียว
  ngOnInit(): void {
    this.loadDashboard();
  }

  // 2️⃣ สร้าง chart หลัง view พร้อม
  ngAfterViewInit(): void {
    if (this.dashboardData) {
      this.renderCharts();
    }
  }

  // 🔹 โหลดข้อมูลจาก Backend
  loadDashboard() {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        console.log('🔥 dashboard data:', res);

        this.todaySales = Number(res.todaySales);
        this.totalProducts = Number(res.totalProducts);

        this.dashboardData = res;

        // ถ้า view พร้อมแล้ว ให้ render ได้เลย
        if (this.salesCanvas) {
          this.renderCharts();
        }
      },
      error: (err) => {
        console.error('❌ Dashboard API error:', err);
      }
    });
  }

  // 🔹 รวมการสร้าง chart ไว้ที่เดียว
  renderCharts() {
    if (!this.dashboardData) return;

    this.createSalesChart(this.dashboardData.salesChart);
    this.createTopSellerChart(this.dashboardData.topSellers);
    this.createProductChart(this.dashboardData.productChart);
  }

  // 🔹 กราฟยอดขายรายวัน
  createSalesChart(dataSource: any[]) {
    const ctx = this.salesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.salesChart) this.salesChart.destroy();

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataSource.map(d =>
          new Date(d.date).toLocaleDateString('th-TH')
        ),
        datasets: [{
          data: dataSource.map(d => Number(d.total)),
          borderColor: '#D81B60',
          backgroundColor: 'rgba(216,27,96,0.2)',
          tension: 0.4,
          fill: true,
        }, ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
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
        labels: dataSource.map(d => d.name),
        datasets: [{
          data: dataSource.map(d => Number(d.sold)), // จำนวนที่ขาย
        }, ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
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
                  `ยอดขายรวม: ${totalSales.toLocaleString()} บาท`
                ];
              }
            }
          }
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
      datasets: sortedData.map(d => ({
        label: d.name,
        data: [Number(d.sold)],          // จำนวนขาย
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
            }
          }
        }
      },

      scales: {
        x: {
          display: false,
        },
        y: {
          title: {
            display: true,
            text: 'จำนวนขาย (ชิ้น)'
          },
          ticks: {
            callback: (value) => `${value}`
          }
        }
      }
    },
  });
}
}