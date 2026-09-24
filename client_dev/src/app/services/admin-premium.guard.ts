import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class AdminPremiumGuard implements CanActivate {

  constructor(
    private _router: Router,
    private _projectService: ProjectService
  ) {}

  canActivate(): boolean {
    let identity = this._projectService.getIdentity();
    let token = this._projectService.getToken();

    // Asume que getIdentity() regresa el objeto decodificado del JWT (con .rol),
    // igual que hace tu UserGuard con identity/token. Si tu ProjectService
    // guarda el rol en otra propiedad, ajusta la condición de abajo.
    if (identity && token && identity.rol === 'administrador_premium') {
      return true;
    } else {
      this._router.navigate(['/inicio']);
      return false;
    }
  }
}
