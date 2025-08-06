import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  @Input() products: any[] = [];

  ngOnInit() {
    const ctx = document.getElementById('priceChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.products.map(product => product.name),
        datasets: [{
          label: 'Product Prices',
          data: this.products.map(product => product.price),
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f1c40f',
            '#9b59b6',
            '#1abc9c',
            '#e67e22',
            '#34495e',
            '#ff6f61',
            '#7f8c8d'
          ],
          borderColor: [
            '#2980b9',
            '#c0392b',
            '#27ae60',
            '#f39c12',
            '#8e44ad',
            '#16a085',
            '#d35400',
            '#2c3e50',
            '#e74c3c',
            '#6c7a89'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Price ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Products'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }
}