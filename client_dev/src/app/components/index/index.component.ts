import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Usuario } from '../../models/user';
import { UserGuard } from '../../services/user.guard';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],
  providers: [ProjectService, UserGuard]
})
export class IndexComponent implements OnInit {
  public user: Usuario;

  public status: string;
  public identity;
  public token:any;
  public identidad;
  public rol: any;
  verPassword: boolean = false;



  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _projectService: ProjectService
  ) {
    this.user = new Usuario("","","","","","","","","","",false);
    this.status = '';
    this.identity = new Usuario("","","","","","","","","","",false);
    this.identity = this._projectService.getIdentity();
    this.rol = this.identity?.rol;
    this.identidad = localStorage.getItem('identity');

   }


  ngOnInit(): void {

  }

  onSubmit(){
    //loguear usuario
    this._projectService.signup(this.user).subscribe(
      response=>{
        this.identity = response.user;


        if(!this.identity || !this.identity._id){
          this.status = 'error'
        }else{
          this.status= 'success';
          //Persistir datos del usuario
          localStorage.setItem('identity', JSON.stringify(this.identity));
          this._router.navigateByUrl('/datos');



          //Conseguir el token
          this.getToken();
        }

      },
      error=>{
        var errorMensaje = <any>error;
        console.log(errorMensaje);
        if(errorMensaje !=null){


          this.status = 'error';
        }
      }

    );
  }
  getToken(){
    this._projectService.signup(this.user, 'true').subscribe(
      response=>{
        this.token = response.token;


        if(this.token.length <= 0){
          this.status = 'error'
        }else{
          this.status= 'success';
          //Persistir token
          localStorage.setItem('token', this.token);

        }

      },
      error=>{
        var errorMensaje = <any>error;
        console.log(errorMensaje);
        if(errorMensaje !=null){


          this.status = 'error';
        }
      }

    );

  }
  olvidar(){
    var mensaje  = prompt("Ingresa tu Usuario");
    if(mensaje != null ){
      if(mensaje.trim().length >7){
        this._projectService.forgotPass(mensaje).subscribe(
          response=>{
            var correo = response.correo;
            var arrayCorreo = correo.split('@');
            var stringToChange = arrayCorreo[0].substring(3, arrayCorreo[0].length);
            var change = '';
            for(var i= 0; i < stringToChange.length; i++){
              change = change + '*';

            }
            alert('La información fue enviada exitosamente al correo: '+arrayCorreo[0].substring(0,3)+change + '@'+ arrayCorreo[1]);

          },
          error=>{
            alert(error.error.message);
          }
        )

      }else{
        alert('Usuario incorrecto')
      }
    }



  }

 goToRegisterProv(){
    this._router.navigate(['/registro']);
   }
 goToRegisterUse(){
    this._router.navigate(['/registro-usuarios']);
   }



}
