import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Global } from '../../services/global';
import { Usuario } from '../../models/user';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-recuperar-info',
  templateUrl: './recuperar-info.component.html',
  styleUrls: ['./recuperar-info.component.css']
})
export class RecuperarInfoComponent implements OnInit {
  public url: string;
  public usuario: Usuario;
  public newPassword: any;
  public newPasswordCon: string;
  public validate1: boolean;
  public validate2: boolean;
  public identity: any;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _projectService: ProjectService
  ) {
    this.usuario = new Usuario('', '', '', '', '', '', '', '', '', '', false);
    this.url = Global.url;
    this.newPassword = '';
    this.newPasswordCon = '';
    this.validate1 = false;
    this.validate2 = false;
  }

  ngOnInit(): void {
    this.identity = JSON.stringify(this._projectService.getIdentity());

    this._route.params.subscribe(params => {
      if (params.rfc) {
        this.usuario.rfc = params.rfc;
      }
      if (params.correo) {
        this.usuario.correo = params.correo;
      }
    });
  }

  text(id: string) {
    var tipo = <HTMLInputElement>document.getElementById(id);
    if (tipo) {
      if (tipo.type == 'password') {
        tipo.type = 'text';
      } else {
        tipo.type = 'password';
      }
    }
  }

  validate() {
    if (this.newPassword && this.newPassword.trim().length >= 8) {
      this.validate1 = false;
      if (this.newPasswordCon && this.newPasswordCon.trim() != this.newPassword.trim()) {
        this.validate2 = true;
      } else if (this.newPasswordCon && this.newPasswordCon.trim() === this.newPassword.trim()) {
        this.validate2 = false;
      }
    } else {
      this.validate1 = true;
    }
  }

  validateNew() {
    if (this.newPasswordCon && this.newPassword && this.newPasswordCon.trim() === this.newPassword.trim()) {
      this.validate2 = false;
    } else {
      this.validate2 = true;
    }
  }

  onSubmit(form: any) {
    if (!this.usuario.correo || !this.usuario.rfc || !this.usuario.empresa) {
      alert('Por favor completa todos los campos requeridos (Correo, RFC/CURP y Empresa).');
      return;
    }
    if (!this.newPassword || this.newPassword.trim().length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.newPassword.trim() !== this.newPasswordCon.trim()) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    var opcion = confirm('¿Estás seguro de reestablecer tu contraseña?');
    if (opcion) {
      this._projectService.changePassword(this.usuario, this.newPassword.trim()).subscribe(
        response => {
          alert('¡Tu contraseña fue reestablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.');
          form.reset();
          this._router.navigate(['/inicio']);
        },
        error => {
          alert(error.error?.message || 'Error al reestablecer la contraseña.');
        }
      );
    }
  }
}
