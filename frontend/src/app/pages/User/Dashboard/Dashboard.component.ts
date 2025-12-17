// import { Component } from '@angular/core';
// import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
// import { TableModule } from 'primeng/table';
// import { Chart, registerables } from 'chart.js';
// Chart.register(...registerables);

// @Component({
//   selector: 'app-Dashboard',
//   imports: [SidebarUserComponent,TableModule],
//   templateUrl: './Dashboard.component.html',
//   styleUrl: './Dashboard.component.scss',
// })
// export class DashboardComponent {

//       lowStockProducts = [
//     { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
//     { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
//     { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
//    { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
//     { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
//     { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
//     { code: 'P001', name: 'Pen', category: 'Stationery', quantity: 50 },
//     { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
//     { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
//      { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
//       { code: 'P002', name: 'Book', category: 'Stationery', quantity: 120 },
//     { code: 'P003', name: 'Book', category: 'box', quantity: 5 },
//      { code: 'P003', name: 'Book', category: 'box', quantity: 5 }
//   ];
// }

import { Component, AfterViewInit,ViewChild,ElementRef } from '@angular/core';
import { SidebarUserComponent } from "../../../component/sidebar-user/sidebar-user.component";
import { TableModule } from 'primeng/table';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarUserComponent, TableModule],
  templateUrl: './Dashboard.component.html',
  styleUrl: './Dashboard.component.scss',
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('salesCanvas') salesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topSellerCanvas') topSellerCanvas!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.createSalesChart();
    this.createTopSellerChart();
  }

  lowStockProducts = [
    { code: 'P001', name: 'Vanilla', category: 'Ice Cream', quantity: 50, price: 10, date: new Date('2025-12-01')},
    { code: 'P002', name: 'chocolate', category: 'Ice Cream', quantity: 120, price: 30, date: new Date('2025-12-01')},
    { code: 'P003', name: 'Box A', category: 'Box', quantity: 5, price: 20, date: new Date('2025-12-01')}
  ];

 createSalesChart() {
    const ctx = this.salesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Daily Sales (฿)',
          data: [1200, 1900, 3000, 2500, 4200, 3800, 4520],
          borderColor: '#D81B60',
          backgroundColor: 'rgba(216,27,96,0.2)',
          pointRadius: 5,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  createTopSellerChart() {
    const ctx = this.topSellerCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Vanilla', 'chocolate', 'Box'],
        datasets: [{
          data: [120, 50, 5],
          backgroundColor: ['#D81B60', '#F06292', '#F8BBD0'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}