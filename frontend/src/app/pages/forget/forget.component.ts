import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './forget.component.html',
  styleUrl: './forget.component.scss',
  animations: [
    trigger('slideForm', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(40px)',
        }),
        animate(
          '500ms ease-out',
          style({
            opacity: 1,
            transform: 'translateX(0)',
          })
        ),
      ]),
    ]),
  ],
})
export class ForgetComponent {
  email = '';
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient) {}

  sendReset() {
    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'กรุณากรอกอีเมล';
      this.successMessage = '';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .post('https://manage-app-5koc.onrender.com/api/auth/forgot-password', {
        email: this.email.trim(),
      })
      .subscribe({
        next: () => {
          this.successMessage = 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว';

          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'กรุณาตรวจสอบอีเมลของคุณ',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'ตกลง',
          });
        },
        error: (err) => {
          this.successMessage = '';
          this.errorMessage =
            err?.error?.message || 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่';
        },
      });
  }
}
