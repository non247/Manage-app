// import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
// import { Chart, registerables } from 'chart.js';
// import { TableModule } from 'primeng/table';
// import { DashboardService } from '../../../core/services/Dashboard.service';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [TableModule],
//   templateUrl: './Dashboard.component.html',
//   styleUrl: './Dashboard.component.scss',
// })
// export class DashboardComponent implements AfterViewInit {
//   @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;

//   ngAfterViewInit(): void {
//     this.createSalesChart();
//     this.createTopSellerChart();
//   }

//   lowStockProducts = [
//     {
//       code: 'P001',
//       name: 'วนิลา',
//       category: 'ไอศครีม',
//       quantity: 50,
//       price: 10,
//       date: new Date('2025-12-01'),
//     },
//     {
//       code: 'P002',
//       name: 'ช็อคโกแลต',
//       category: 'ไอศครีม',
//       quantity: 120,
//       price: 30,
//       date: new Date('2025-12-01'),
//     },
//     {
//       code: 'P003',
//       name: 'สตรอเบอร์รี่',
//       category: 'ไอศครีม',
//       quantity: 5,
//       price: 20,
//       date: new Date('2025-12-01'),
//     },
//   ];

//   createSalesChart() {
//     const ctx = this.salesCanvas.nativeElement.getContext('2d');
//     if (!ctx) return;

// new Chart(ctx, {
//   type: 'line',
//   data: {
//     labels: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
//     datasets: [
//       {
//         label: 'ยอดขายรายวัน',
//         data: [1200, 1700, 800, 1000, 1100, 900, 700],
//         borderColor: '#D81B60',
//         backgroundColor: 'rgba(216,27,96,0.2)',
//         pointRadius: 5,
//         pointHitRadius: 15,   // ⭐ สำคัญ
//         tension: 0.4,
//         fill: true,
//       },
//     ],
//   },
//   options: {
//     responsive: true,
//     maintainAspectRatio: false,

//     interaction: {
//       mode: 'nearest',
//       intersect: false,      // ⭐ ทำให้ hover ง่ายขึ้น
//     },

//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         enabled: true,
//         callbacks: {
//           label: (context) => `${context.raw} บาท`,
//         },
//       },
//     },
//   },
// });

// }
//   createTopSellerChart() {
//     const ctx = this.topSellerCanvas.nativeElement.getContext('2d');
//     if (!ctx) return;

//     new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels: ['วนิลา', 'ช็อคโกแลต', 'สตรอเบอร์รี่'],
//         datasets: [
//           {
//             data: [140, 70, 35],
//             backgroundColor: ['#F3E5AB', '#713600', '#F8BBD0'],
//             borderRadius: 8,
//           },
//         ],
//       },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: {
//           display: false,
//         },
//         tooltip: {
//           callbacks: {
//             label: function (context) {
//               return context.raw + ' บาท';
//             },
//           },
//         },
//       },
//       // scales: {
//       //   y: {
//       //     ticks: {
//       //       callback: function (value) {
//       //         return value + ' บาท';
//       //       },
//       //     },
//       //   },
//       // },
//     },
//   });
// }
// }

import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TableModule } from 'primeng/table';
import { DashboardService } from '../../../core/services/Dashboard.service';
import { DashboardResponse } from '../../../core/services/Dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TableModule],
  templateUrl: './Dashboard.component.html',
  styleUrl: './Dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChartCanvas') productChartCanvas!: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;
  topSellerChart?: Chart;
  productChart?: Chart;

  todaySales = 0;
  totalProducts = 0;

  private dashboardData?: DashboardResponse;

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
        datasets: [
          {
            data: dataSource.map(d => Number(d.total)),
            borderColor: '#D81B60',
            backgroundColor: 'rgba(216,27,96,0.2)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
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
      datasets: [
        {
          data: dataSource.map(d => Number(d.sold)),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.label}: ${context.parsed} ชิ้น`
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

  this.productChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataSource.map(d => d.name),
      datasets: [
        {
          data: dataSource.map(d => Number(d.sold)),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} ชิ้น`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => `${value} ชิ้น`
          }
        }
      }
    },
  });
}
}

// import { OnInit, Component, ElementRef, ViewChild } from '@angular/core';
// import { Chart, registerables } from 'chart.js';
// import { TableModule } from 'primeng/table';
// import { DashboardService } from '../../../core/services/Dashboard.service';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [TableModule],
//   templateUrl: './Dashboard.component.html',
//   styleUrl: './Dashboard.component.scss',
// })
// export class DashboardComponent implements OnInit {

//   @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('productChartCanvas') productChartCanvas!: ElementRef<HTMLCanvasElement>;


//   salesChart!: Chart;
//   topSellerChart!: Chart;
//   productChart!: Chart;

//   todaySales = 0;
//   totalProducts = 0;

//   constructor(private dashboardService: DashboardService) {}

//   ngOnInit(): void {
//     this.loadDashboard();
//   }

//   // 🔹 โหลดข้อมูลจาก Backend
// loadDashboard() {
//   this.dashboardService.getDashboard().subscribe({
//     next: (res) => {
//       console.log('🔥 dashboard data:', res);

//       this.todaySales = Number(res.todaySales);
//       this.totalProducts = Number(res.totalProducts);

//       this.createSalesChart(res.salesChart);
//       this.createTopSellerChart(res.topSellers);
//       this.createproductChart(res.productChart);
//     },
//     error: (err) => {
//       console.error('❌ Dashboard API error:', err);
//     }
//   });
// }

//   // 🔹 กราฟยอดขายรายวัน
//   createSalesChart(salesChartData: any[]) {
//     const ctx = this.salesCanvas.nativeElement.getContext('2d');
//     if (!ctx) return;

//     const labels = salesChartData.map(item =>
//       new Date(item.date).toLocaleDateString('th-TH')
//     );
//     const data = salesChartData.map(item => Number(item.total));

//     if (this.salesChart) this.salesChart.destroy();

//     this.salesChart = new Chart(ctx, {
//       type: 'line',
//       data: {
//         labels,
//         datasets: [
//           {
//             label: 'ยอดขายรายวัน',
//             data,
//             borderColor: '#D81B60',
//             backgroundColor: 'rgba(216,27,96,0.2)',
//             pointRadius: 5,
//             pointHitRadius: 15,
//             tension: 0.4,
//             fill: true,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         interaction: {
//           mode: 'nearest',
//           intersect: false,
//         },
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: {
//               label: (ctx) =>
//                 `฿${Number(ctx.raw).toLocaleString()}`,
//             },
//           },
//         },
//       },
//     });
//   }

//   // 🔹 กราฟสินค้าขายดีที่สุด
//   createTopSellerChart(topSellers: any[]) {
//     const ctx = this.topSellerCanvas.nativeElement.getContext('2d');
//     if (!ctx) return;

//     const labels = topSellers.map(item => item.name);
//     const data = topSellers.map(item => Number(item.sold));

//     if (this.topSellerChart) this.topSellerChart.destroy();

//     this.topSellerChart = new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels,
//         datasets: [
//           {
//             data,
//             backgroundColor: ['#F3E5AB', '#713600', '#F8BBD0'],
//             borderRadius: 8,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: {
//               label: (ctx) => `${ctx.raw} ชิ้น`,
//             },
//           },
//         },
//       },
//     });
//   }

//     createproductChart(productChart: any[]) {
//     const ctx = this.productChartCanvas.nativeElement.getContext('2d');
//     if (!ctx) return;

//     const labels = productChart.map(item => item.name);
//     const data = productChart.map(item => Number(item.sold));

//     if (this.productChart) this.productChart.destroy();

//     this.productChart = new Chart(ctx, {
//       type: 'bar',
//       data: {
//         labels,
//         datasets: [
//           {
//             data,
//             backgroundColor: ['#F3E5AB', '#713600', '#F8BBD0'],
//             borderRadius: 8,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: { display: false },
//           tooltip: {
//             callbacks: {
//               label: (ctx) => `${ctx.raw} ชิ้น`,
//             },
//           },
//         },
//       },
//     });
//   }

// }