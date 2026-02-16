import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router,RouterModule  } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {

  Username: string = '';
  Password: string = '';
  ConfirmPassword: string = '';

  // ❌ ลบ role จาก form
  // role: string = 'user';

  errorMessage: string = '';
  successMessage: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

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

    if (!this.Username || !this.Password) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบ';
      this.successMessage = '';
      return;
    }

    if (this.Password !== this.ConfirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      this.successMessage = '';
      return;
    }

    // ✅ กำหนด role = user อัตโนมัติ
    const success = this.auth.register(
      this.Username,
      this.Password,
      'user'   // <--- fix ตรงนี้
    );

    if (success) {
      this.successMessage = 'สมัครสมาชิกสำเร็จ';
      this.errorMessage = '';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);

    } else {
      this.errorMessage = 'Username นี้ถูกใช้แล้ว';
      this.successMessage = '';
    }
  }
}
