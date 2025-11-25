import { Component } from '@angular/core';
import { Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';


  togglePasswordVisibility() { // แสดงรหัสผ่าน
    const input = document.getElementById('passwordinput') as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
// console.log()