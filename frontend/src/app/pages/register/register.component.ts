import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';

  constructor(private readonly router: Router) {}

  togglePasswordVisibility() {
    // แสดงรหัสผ่าน
    const input = document.getElementById('passwordinput') as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  // login() {
  //   if (this.Username === 'admin' && this.Password === '1234') {
  //     this.router.navigate(['/home']);
  //   } else {
  //     this.errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  //   }
  // }
}
