import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';

import { UserService } from '../../../core/services/usermanagement.service';

// ✅ เพิ่ม type ให้หาย error Role/User
type Role = 'admin' | 'user';

interface User {
  Id: number;
  Username: string;
  Role: Role;
}

interface NewUserForm {
  Username: string;
  Password: string;
  Role: Role;
}

@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, TableModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss',
})
export class UsermanagementComponent implements OnInit {
  users: User[] = [];

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: User[]) => (this.users = data),
      error: () => Swal.fire('Error', 'โหลดผู้ใช้ไม่สำเร็จ', 'error'),
    });
  }

  // ================= CREATE =================
  showCreateForm = false;
  isClosing = false;

  newUser: NewUserForm = {
    Username: '',
    Password: '',
    Role: 'user',
  };

  onCreateSave() {
    if (!this.newUser.Username || !this.newUser.Password) {
      Swal.fire('Warning', 'กรุณากรอก Username และ Password', 'warning');
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        Swal.fire('Success', 'เพิ่มผู้ใช้สำเร็จ', 'success');
        this.onCreateCancel();
        this.loadUsers();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'เพิ่มผู้ใช้ไม่สำเร็จ';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  onCreateCancel() {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;

      this.newUser = {
        Username: '',
        Password: '',
        Role: 'user',
      };
    }, 200);
  }

  // ================= INLINE EDIT =================
  editIndex: number | null = null;
  editUser: User | null = null;

  onEdit(index: number) {
    this.editIndex = index;
    this.editUser = { ...this.users[index] };
  }

  onSave(index: number) {
    if (!this.editUser) return;

    const id = this.users[index].Id;

    this.userService
      .updateUser(id, {
        Username: this.editUser.Username,
        Role: this.editUser.Role,
      })
      .subscribe({
        next: (updated: User) => {
          this.users[index] = updated;
          this.editIndex = null;
          this.editUser = null;
          Swal.fire({
            title: 'สำเร็จ',
            text: 'บันทึกข้อมูลเรียบร้อย',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'บันทึกไม่สำเร็จ';
          Swal.fire('Error', msg, 'error');
        },
      });
  }

  onCancel() {
    this.editIndex = null;
    this.editUser = null;
  }

  // ================= DELETE =================
  onDelete(index: number) {
    const id = this.users[index].Id;

    Swal.fire({
      title: 'ยืนยันที่จะลบ?',
      html: '<span style="color:red; font-weight:bold;">ข้อมูลจะไม่สามารถกู้คืนได้</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',

    }).then((result) => {
      if (!result.isConfirmed) return;

      this.userService.deleteUser(id).subscribe({
        next: () => {
          Swal.fire({
              title: 'สำเร็จ',
              text: 'ลบรายการสำเร็จ',
              icon: 'success',
              timer: 1500, // เวลาแสดง (ms)
              showConfirmButton: false,
              timerProgressBar: true,});
          this.users.splice(index, 1);
        },
        error: () => Swal.fire('Error', 'ลบไม่สำเร็จ', 'error'),
      });
    });
  }
}
