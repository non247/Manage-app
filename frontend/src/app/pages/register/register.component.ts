import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    trigger('slideForm', [
      transition(':enter', [
        style({
          transform: 'translateX(80px) translateZ(0)',
        }),
        animate(
          '420ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({
            transform: 'translateX(0) translateZ(0)',
          })
        ),
      ]),
    ]),
  ],
})
export class RegisterComponent {
  Email: string = '';
  Username: string = '';
  Password: string = '';
  ConfirmPassword: string = '';

  errorMessage: string = '';
  successMessage: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  isLoading: boolean = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    // ตรวจสอบกรอกข้อมูลให้ครบ
    if (!this.Username || !this.Email || !this.Password || !this.ConfirmPassword) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบ';
      return;
    }

    // ตรวจสอบรูปแบบ Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.Email)) {
      this.errorMessage = 'กรุณากรอกอีเมลให้ถูกต้อง';
      return;
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (this.Password.length < 6) {
      this.errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      return;
    }

    // ตรวจสอบรหัสผ่านตรงกัน
    if (this.Password !== this.ConfirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return;
    }

    this.isLoading = true;

    this.auth.register(this.Username, this.Password, this.Email).subscribe({
      next: () => {
        this.isLoading = false;
        this.errorMessage = '';
        this.successMessage = 'สมัครสมาชิกสำเร็จ';

        Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกสำเร็จ',
          text: 'กำลังพาไปหน้าเข้าสู่ระบบ',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },

      error: (err) => {
        this.isLoading = false;
        this.successMessage = '';

        if (err?.status === 409) {
          this.errorMessage = 'Username นี้ถูกใช้แล้ว';
          return;
        }

        this.errorMessage = err?.error?.message || 'สมัครสมาชิกไม่สำเร็จ';
      },
    });
  }
}