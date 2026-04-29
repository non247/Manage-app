import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(private authService: AuthService) {}

  sendReset() {
    const cleanEmail = this.email.trim();

    if (!cleanEmail) {
      this.errorMessage = 'กรุณากรอกอีเมล';
      this.successMessage = '';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      this.errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(cleanEmail).subscribe({
      next: (res) => {
        this.successMessage =
          res?.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว';

        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'กรุณาตรวจสอบอีเมลของคุณ',
          confirmButtonColor: '#d81b60',
          confirmButtonText: 'ตกลง',
        });
      },
      error: (err) => {
        console.log('FORGOT ERROR =', err);

        this.successMessage = '';
        this.errorMessage =
          err?.error?.message || 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่';

        Swal.fire({
          icon: 'error',
          title: 'ส่งอีเมลไม่สำเร็จ',
          text: this.errorMessage,
          confirmButtonColor: '#d81b60',
          confirmButtonText: 'ตกลง',
        });
      },
    });
  }
}