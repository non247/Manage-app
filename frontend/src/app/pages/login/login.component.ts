// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { NgIf } from '@angular/common';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [FormsModule, NgIf],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss'
// })
// export class LoginComponent {
//   Username: string = '';
//   Password: string = '';
//   errorMessage: string = '';

//   constructor(private router: Router) {}

//   togglePasswordVisibility() { // แสดงรหัสผ่าน
//     const input = document.getElementById('passwordinput') as HTMLInputElement;
//     input.type = input.type === 'password' ? 'text' : 'password';
//   }
//   login() {
//     if (this.Username === '' && this.Password === '') {
//       this.router.navigate(['/dashboard']);
//     } else {
//       this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
//     }
//   }
// }
// // console.log()
import { CommonModule, NgIf } from '@angular/common'; // <-- เพิ่ม CommonModule
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';

  showPassword: boolean = false; // <-- เพิ่มตัวแปรนี้

  constructor(private readonly router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // <-- แค่สลับค่า
  }

  login() {
    if (this.Username === '' && this.Password === '') {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Username or password is incorrect.';
    }
  }
}
