import { Component, OnInit } from '@angular/core';

import {Router, ActivatedRoute, Params} from '@angular/router';
import { ProjectService } from '../../services/project.service';

import { Usuario } from '../../models/user';

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.css'],
  providers: [ProjectService]
})
export class UserDataComponent implements OnInit {
  public user:Usuario;
  public token;



  constructor(
    private _projectService: ProjectService,
    private _router: Router,
    private _route :ActivatedRoute
  ) {
    this.user = this._projectService.getIdentity();
    this.user.usuario = this.user.usuario.toUpperCase();
    this.user.nombre = this.user.nombre.toUpperCase();
    this.user.apellidoP = this.user.apellidoP.toUpperCase();
    this.user.apellidoM = this.user.apellidoM.toUpperCase();
    this.user.correo = this.user.correo.toUpperCase();
    this.user.rfc = this.user.rfc.toUpperCase();
    this.user.rol = this.user.rol.toUpperCase();

    this.token = this._projectService.getToken();



  }

  ngOnInit(): void {

  }
 goToRegisterProv(){
    this._router.navigate(['/registro']);
   }
 goToRegisterUse(){
    this._router.navigate(['/registro-usuarios']);
   }


}
