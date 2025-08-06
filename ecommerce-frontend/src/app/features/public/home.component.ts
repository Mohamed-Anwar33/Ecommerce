import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  title = 'Welcome to TechStore';
  subtitle = 'Your one-stop shop for the latest technology';
  private subscription: Subscription = new Subscription();
  
  // Categories data
  categories = [
    {
      name: 'Electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&auto=format',
      count: 150
    },
    {
      name: 'Fashion',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&auto=format',
      count: 200
    },
    {
      name: 'Home & Garden',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format',
      count: 120
    },
    {
      name: 'Sports',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
      count: 80
    }
  ];
  

  
  // Stats data
  stats = {
    totalProducts: 0,
    happyCustomers: '10,000+',
    yearsExperience: 5,
    countriesServed: 25
  };
  
  statsArray = [
    {
      icon: 'fas fa-box',
      value: '0+',
      label: 'Products'
    },
    {
      icon: 'fas fa-users',
      value: '10,000+',
      label: 'Happy Customers'
    },
    {
      icon: 'fas fa-calendar-alt',
      value: '5+',
      label: 'Years Experience'
    },
    {
      icon: 'fas fa-globe',
      value: '25+',
      label: 'Countries Served'
    }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Fetch and update product count dynamically
    const productsSub = this.apiService.getProducts().subscribe(products => {
      const count = products.length;
      this.statsArray[0].value = count + (count === 0 ? '+' : '');
    });
    this.subscription.add(productsSub);
    console.log('Home component initialized');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
