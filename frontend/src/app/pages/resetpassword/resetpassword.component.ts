import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './resetpassword.component.html',
  styleUrl: './resetpassword.component.scss',
})
export class ResetpasswordComponent {
  newPassword = '';
  confirmPassword = '';
  token = '';

  successMessage = '';
  errorMessage = '';

  fieldError = '';

  showPassword = false;
  showConfirmPassword = false;
  loading = false;

  private readonly apiUrl = '/api/auth/reset-password';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || '';

      // console.log('TOKEN =', this.token);

      if (!this.token) {
        this.errorMessage = 'ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน';
      }
    });
  }

  resetPassword(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.token) {
      this.errorMessage = 'Token ไม่ถูกต้อง';
      return;
    }

    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = 'กรุณากรอกรหัสผ่านให้ครบถ้วน';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return;
    }

    this.loading = true;

    this.http
      .post<any>(this.apiUrl, {
        token: this.token,
        password: this.newPassword,
      })
      .subscribe({
        next: async (res) => {
          this.loading = false;
          this.successMessage = '';
          this.errorMessage = '';

          this.newPassword = '';
          this.confirmPassword = '';

          await Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: res?.message || 'รีเซ็ตรหัสผ่านสำเร็จ',
            timer: 1800,
            timerProgressBar: true,
            showConfirmButton: false,
          });

          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่';

          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: this.errorMessage,
            confirmButtonText: 'ตกลง',
          });
        },
      });
  }
}
