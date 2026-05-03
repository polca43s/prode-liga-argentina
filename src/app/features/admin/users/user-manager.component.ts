import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/prode.models';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="glass-card manager-card">
        <header class="manager-header">
          <div class="header-left">
            <button routerLink="/admin" class="btn-back">⬅ Volver</button>
            <h1>👥 Gestión de Usuarios</h1>
          </div>
        </header>

        <div class="users-list">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Mail</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" [class.editing]="currentUser.id === user.id">
                <td>
                  <div class="user-cell">
                    <strong>@{{ user.nickname }}</strong>
                    <span>{{ user.nombre }} {{ user.apellido }}</span>
                  </div>
                </td>
                <td>{{ user.mail }}</td>
                <td><span class="role-badge" [class.admin]="user.tipo === 'ADMIN'">{{ user.tipo }}</span></td>
                <td>
                  <div class="actions">
                    <button (click)="openEditForm(user)" class="btn-icon">✏️</button>
                    <button (click)="deleteUser(user.id)" class="btn-icon">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Formulario Integrado -->
      <div *ngIf="showForm" class="glass-card form-card animate-slide-up" id="admin-form">
        <header class="form-header">
          <h2>📝 Editar Usuario: @{{ currentUser.nickname }}</h2>
          <button (click)="closeForm()" class="btn-close">✖</button>
        </header>
        
        <form (ngSubmit)="saveUser()" class="integrated-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nickname</label>
              <input type="text" [(ngModel)]="currentUser.nickname" name="nickname" required>
            </div>
            <div class="form-group">
              <label>Rol de Usuario</label>
              <select [(ngModel)]="currentUser.tipo" name="tipo">
                <option value="USER">Usuario Estándar</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" [(ngModel)]="currentUser.nombre" name="nombre">
            </div>
            <div class="form-group">
              <label>Apellido</label>
              <input type="text" [(ngModel)]="currentUser.apellido" name="apellido">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeForm()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary large">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; color: white; display: flex; flex-direction: column; align-items: center; gap: 30px; }
    .manager-card { width: 100%; max-width: 1000px; padding: 40px; }
    .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
    
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { text-align: left; padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.85rem; }
    .admin-table td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .admin-table tr.editing { background: rgba(116, 172, 223, 0.05); }
    
    .user-cell { display: flex; flex-direction: column; }
    .role-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; background: rgba(255,255,255,0.1); }
    .role-badge.admin { background: var(--primary); color: white; }

    .form-card { width: 100%; max-width: 1000px; padding: 40px; border-top: 3px solid var(--primary); }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem; }
    .form-group input, select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; color: #000; }
    
    .form-actions { display: flex; gap: 15px; margin-top: 10px; }
    .btn-primary.large { flex: 2; }
    .btn-secondary { flex: 1; }

    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.6; transition: 0.2s; }
    .btn-icon:hover { opacity: 1; transform: scale(1.1); }

    .animate-slide-up { animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserManagerComponent implements OnInit {
  users: User[] = [];
  showForm = false;
  currentUser: any = {};

  constructor(private userService: UserService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() { this.userService.getUsers().subscribe(data => this.users = data); }

  openEditForm(user: User) { this.currentUser = { ...user }; this.showForm = true; this.scrollToForm(); }

  closeForm() { this.showForm = false; this.currentUser = {}; }

  saveUser() {
    this.userService.updateUser(this.currentUser.id, this.currentUser).subscribe(() => {
      this.closeForm();
      this.loadUsers();
    });
  }

  deleteUser(id: string) { if (confirm('¿Borrar usuario?')) this.userService.deleteUser(id).subscribe(() => this.loadUsers()); }

  private scrollToForm() { setTimeout(() => { document.getElementById('admin-form')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }
}
