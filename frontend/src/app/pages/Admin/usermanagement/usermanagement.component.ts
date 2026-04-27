import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';

import { UserService } from '../../../core/services/usermanagement.service';

type Role = 'admin' | 'user';

interface User {
  Id: number; // ยังใช้สำหรับ update / delete
  Code: string; // ใช้แสดงรหัสผู้ใช้
  Username: string;
  Email: string;
  Role: Role;
}

interface NewUserForm {
  Username: string;
  Password: string;
  Email: string;
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

  editIndex: number | null = null;
  editUser: User | null = null;

  showCreateForm = false;
  isClosing = false;

  newUser: NewUserForm = {
    Username: '',
    Password: '',
    Email: '',
    Role: 'user',
  };

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  getRoleLabel(role: Role): string {
    return role === 'admin' ? 'เจ้าของร้าน' : 'พนักงาน';
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res: User[]) => {
        this.users = res;
      },
      error: (err) => {
        console.error('โหลดผู้ใช้ไม่สำเร็จ', err);
        Swal.fire('ผิดพลาด', 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ', 'error');
      },
    });
  }

  onEdit(index: number): void {
    this.editIndex = index;
    this.editUser = { ...this.users[index] };
  }

  onCancel(): void {
    this.editIndex = null;
    this.editUser = null;
  }

  onSave(index: number): void {
    if (!this.editUser) return;

    if (
      !this.editUser.Username?.trim() ||
      !this.editUser.Email?.trim() ||
      !this.editUser.Role
    ) {
      Swal.fire({
        title: 'แจ้งเตือน',
        text: 'ยังไม่มีรายการสั่งซื้อในฟอร์ม',
        icon: 'info',
      });
      return;
    }

    this.userService
      .updateUser(this.editUser.Id, {
        Username: this.editUser.Username,
        Email: this.editUser.Email,
        Role: this.editUser.Role,
      })
      .subscribe({
        next: (updatedUser: User) => {
          this.users[index] = updatedUser;
          this.onCancel();
          Swal.fire('สำเร็จ', 'แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว', 'success');
        },
        error: (err) => {
          console.error('อัปเดตผู้ใช้ไม่สำเร็จ', err);
          Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้', 'error');
        },
      });
  }

  onDelete(index: number): void {
    const user = this.users[index];

    Swal.fire({
      title: 'ยืนยันที่จะลบ',
      text: `ต้องการลบผู้ใช้ ${user.Username} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(user.Id).subscribe({
          next: () => {
            this.users.splice(index, 1);
            Swal.fire('สำเร็จ', 'ลบผู้ใช้เรียบร้อยแล้ว', 'success');
          },
          error: (err) => {
            console.error('ลบผู้ใช้ไม่สำเร็จ', err);
            Swal.fire('ผิดพลาด', 'ไม่สามารถลบผู้ใช้ได้', 'error');
          },
        });
      }
    });
  }

  onCreateSave(): void {
    if (
      !this.newUser.Username.trim() ||
      !this.newUser.Password.trim() ||
      !this.newUser.Email.trim() ||
      !this.newUser.Role
    ) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        Swal.fire('สำเร็จ', 'เพิ่มผู้ใช้เรียบร้อยแล้ว', 'success');
        this.loadUsers();
        this.resetCreateForm();
        this.showCreateForm = false;
      },
      error: (err) => {
        console.error('เพิ่มผู้ใช้ไม่สำเร็จ', err);
        Swal.fire('ผิดพลาด', 'ไม่สามารถเพิ่มผู้ใช้ได้', 'error');
      },
    });
  }

  onCreateCancel(): void {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;
      this.resetCreateForm();
    }, 200);
  }

  resetCreateForm(): void {
    this.newUser = {
      Username: '',
      Password: '',
      Email: '',
      Role: 'user',
    };
  }
}
