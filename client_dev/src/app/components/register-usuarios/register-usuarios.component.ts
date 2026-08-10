import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/user';
import { ProjectService } from '../../services/project.service';
import { Global } from '../../services/global';
import { refCount } from 'rxjs/operators';


@Component({
  selector: 'app-register-usuarios',
  templateUrl: './register-usuarios.component.html',
  styleUrls: ['./register-usuarios.component.css'],
  providers: [ProjectService]
})
export class RegisterUsuariosComponent implements OnInit {
  public us: Usuario;
  public pass: any;
  public identity: any;

  constructor(
    private _projectService: ProjectService

  ) {
    this.us = new Usuario('','','','','','','','','', '',false);

  }

  ngOnInit(): void {
    this.identity =this._projectService.getIdentity();
    var pass = <HTMLInputElement>document.getElementById('passw');
    pass.style.display = 'none';

    if(this.identity['rol'] === "proveedor"){
      var seccion = <HTMLElement>  document.querySelector('.registro');
      seccion.style.display = 'none';
    }

  }
  onSubmit(form:any){
    var opcion = confirm("¿Estás seguro de enviar la  información?");
    if(opcion == true){

      this._projectService.saveUsers(this.us).subscribe(
        response=>{
          alert('El Usuario fue registrado correctamente');
          form.reset();

        },
        error=>{
          alert('Ocurrió un error: ' +error.error.message);

        }
      )
    }


  }
  mostrar(){
    var pass = <HTMLInputElement>document.getElementById('passw');

    if(this.us.rol == 'administrador' || this.us.rol == 'administrador_premium'){
      pass.style.display = 'block';
    }
  }
  valid(){
    if(this.us.rfc.length < 12 || this.us.rfc.length > 13){
      this.us.rfc = '';
    }
  }

}
