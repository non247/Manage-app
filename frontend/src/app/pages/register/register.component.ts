import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

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

  togglePasswordVisibility() { // แสดงรหัสผ่าน
    const input = document.getElementById('passwordinput') as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

}
