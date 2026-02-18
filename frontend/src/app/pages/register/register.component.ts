// import { CommonModule, NgIf } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Router,RouterModule  } from '@angular/router';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-register',
//   standalone: true,
//   imports: [FormsModule, NgIf, CommonModule, RouterModule],
//   templateUrl: './register.component.html',
//   styleUrls: ['./register.component.scss'],
// })
// export class RegisterComponent {

//   Username: string = '';
//   Password: string = '';
//   ConfirmPassword: string = '';

//   // ❌ ลบ role จาก form
//   // role: string = 'user';

//   errorMessage: string = '';
//   successMessage: string = '';

//   showPassword: boolean = false;
//   showConfirmPassword: boolean = false;

//   constructor(
//     private readonly auth: AuthService,
//     private readonly router: Router
//   ) {}

//   togglePassword() {
//     this.showPassword = !this.showPassword;
//   }

//   toggleConfirmPassword() {
//     this.showConfirmPassword = !this.showConfirmPassword;
//   }

//   register() {

//     if (!this.Username || !this.Password) {
//       this.errorMessage = 'กรุณากรอกข้อมูลให้ครบ';
//       this.successMessage = '';
//       return;
//     }

//     if (this.Password !== this.ConfirmPassword) {
//       this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
//       this.successMessage = '';
//       return;
//     }

//     // ✅ กำหนด role = user อัตโนมัติ
//     const success = this.auth.register(
//       this.Username,
//       this.Password,
//       'user'   // <--- fix ตรงนี้
//     );

//     if (success) {
//       this.successMessage = 'สมัครสมาชิกสำเร็จ';
//       this.errorMessage = '';

//       setTimeout(() => {
//         this.router.navigate(['/login']);
//       }, 1500);

//     } else {
//       this.errorMessage = 'Username นี้ถูกใช้แล้ว';
//       this.successMessage = '';
//     }
//   }
// }
import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

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

  // validate
  if (!this.Username || !this.Password || !this.ConfirmPassword) {
    this.errorMessage = 'กรุณากรอกข้อมูลให้ครบ';
    return;
  }

  if (this.Password !== this.ConfirmPassword) {
    this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
    return;
  }

  this.isLoading = true;

  this.auth.register(this.Username, this.Password).subscribe({
    next: () => {
      this.isLoading = false;

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

      if (err?.status === 409) {
        Swal.fire({
          icon: 'error',
          title: 'สมัครไม่สำเร็จ',
          text: 'Username นี้ถูกใช้แล้ว',
        });
        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.error?.message || 'สมัครสมาชิกไม่สำเร็จ',
      });
    },
  });
}
}