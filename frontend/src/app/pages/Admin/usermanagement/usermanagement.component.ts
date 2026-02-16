// import { Component, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// interface User {
//   Id: number;
//   Username: string;
//   Password: string;
//   Role: 'Admin' | 'User';
// }

// @Component({
//   selector: 'app-usermanagement',
//   imports: [FormsModule],
//   templateUrl: './usermanagement.component.html',
//   styleUrl: './usermanagement.component.scss',
// })
// export class UsermanagementComponent implements OnInit {

//     users: User[] = [];

//   selectedUser: User = {
//     Id: 0,
//     Username: '',
//     Password: '',
//     Role: 'User',
//   };

//   displayDialog = false;
//   isEdit = false;

//   ngOnInit(): void {
//     // ===== Mock Data =====
//     this.users = [
//       { Id: 1, Username: 'admin', Password: '1234', Role: 'Admin' },
//       { Id: 2, Username: 'user1', Password: '1234', Role: 'User' },
//     ];
//   }

//   // ===== เปิดเพิ่ม =====
//   openAdd() {
//     this.isEdit = false;
//     this.selectedUser = {
//       Id: 0,
//       Username: '',
//       Password: '',
//       Role: 'User',
//     };
//     this.displayDialog = true;
//   }

//   // ===== เปิดแก้ไข =====
//   openEdit(user: User) {
//     this.isEdit = true;
//     this.selectedUser = { ...user };
//     this.displayDialog = true;
//   }

//   // ===== บันทึก =====
//   saveUser() {
//     if (this.isEdit) {
//       const index = this.users.findIndex(
//         (u) => u.Id === this.selectedUser.Id
//       );
//       this.users[index] = this.selectedUser;
//     } else {
//       this.selectedUser.Id = Date.now();
//       this.users.push(this.selectedUser);
//     }

//     this.displayDialog = false;
//   }

//   // ===== เปลี่ยน Role =====
//   changeRole(user: User) {
//     user.Role = user.Role === 'Admin' ? 'User' : 'Admin';
//   }

//   // ===== ลบ =====
//   deleteUser(Id: number) {
//     this.users = this.users.filter((u) => u.Id !== Id);
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';

interface User {
  Id: number;
  Username: string;
  Password: string;
  Role: 'Admin' | 'User';
}

@Component({
  selector: 'app-usermanagement',
  imports: [CommonModule, FormsModule, MultiSelectModule, TableModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss',
})
export class UsermanagementComponent implements OnInit {

  // ================= DATA =================
  users: User[] = [];

  ngOnInit(): void {
    // ===== Mock Data =====
    this.users = [
      { Id: 1, Username: 'admin', Password: '1234', Role: 'Admin' },
      { Id: 2, Username: 'user1', Password: '1234', Role: 'User' },
    ];
  }

  // =========================================================
  // ================= CREATE (POPUP CARD) ===================
  // =========================================================

  showCreateForm = false;
  isClosing = false;

  newUser: User = {
    Id: 0,
    Username: '',
    Password: '',
    Role: 'User',
  };

  // ===== SAVE CREATE =====
  onCreateSave() {
    const newId =
      this.users.length > 0
        ? Math.max(...this.users.map(u => u.Id)) + 1
        : 1;

    this.users.push({
      Id: newId,
      Username: this.newUser.Username,
      Password: this.newUser.Password,
      Role: this.newUser.Role,
    });

    this.onCreateCancel();
  }

  // ===== CANCEL CREATE =====
  onCreateCancel() {
    this.isClosing = true;

    setTimeout(() => {
      this.showCreateForm = false;
      this.isClosing = false;

      this.newUser = {
        Id: 0,
        Username: '',
        Password: '',
        Role: 'User',
      };
    }, 200);
  }

  // =========================================================
  // ================= INLINE EDIT ===========================
  // =========================================================

  editIndex: number | null = null;
  editUser: User | null = null;

  // ===== OPEN EDIT =====
  onEdit(index: number) {
    this.editIndex = index;
    this.editUser = { ...this.users[index] };
  }

  // ===== SAVE EDIT =====
  onSave(index: number) {
    if (this.editUser) {
      this.users[index] = { ...this.editUser };
    }

    this.editIndex = null;
    this.editUser = null;
  }

  // ===== CANCEL EDIT =====
  onCancel() {
    this.editIndex = null;
    this.editUser = null;
  }

  // =========================================================
  // ================= DELETE ================================
  // =========================================================

  onDelete(index: number) {
    this.users.splice(index, 1);
  }

}
