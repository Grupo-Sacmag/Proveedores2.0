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
  private rfc: string;
  private correo : string;
  public usuario: Usuario;
  public newPassword: any;
  public newPasswordCon: string;
  public validate1 : boolean;
  public validate2: boolean;
  public myinput: any;
  public identity: any;

  constructor(
    private _router : Router,
    private _route: ActivatedRoute,
    private _projectService: ProjectService
  ) {
    this.usuario = new Usuario('','','','','','','','','','',false);
    this.url = Global.url;
    this.newPassword = '';
    this.newPasswordCon = ''
    this.rfc = '';
    this.correo = '';
    this.validate1 = false;
    this.validate2 = false;
   /*  this.myinput = <HTMLInputElement> document.getElementById('conNueAfi');
    this.myinput.onpaste = function(e){
      e.preventDefault();
    } */
  }

  ngOnInit(): void {
    this.identity = JSON.stringify( this._projectService.getIdentity());


    this._route.params.subscribe(params =>{
        this.rfc = params.rfc;
        this.correo = params.correo;
        this.usuario.rfc = this.rfc;
        this.usuario.correo = this.correo;
      })






  }
  text(id: string){
    var tipo = <HTMLInputElement> document.getElementById(id);
      if(tipo.type == "password"){
          tipo.type = "text";
      }else{
          tipo.type = "password";
      }
  }

  validate(){

    if(this.newPassword.trim().length >= 8){
      this.validate1 = false;
      if(this.newPasswordCon.trim() != this.newPassword.trim()){
        this.validate2 = true;
      }
      if(this.newPasswordCon.trim() === this.newPassword.trim()){
        this.validate2 = false;
      }


    }else{
      this.validate1 = true;
    }
  }
  validateNew(){
    if(this.newPasswordCon.trim() === this.newPassword.trim()){
      this.validate2 = false;

    }else{
      this.validate2 = true;
    }
  }
  onSubmit(form: any){
    var opcion = confirm("¿Estás seguro de enviar la  información?");
    if(opcion == true){
      this._projectService.changePassword(this.usuario,this.newPassword).subscribe(
        response=>{
          alert('La contraseña fue cambiada correctamente');
          form.reset();
          this._router.navigate(['/inicio']);
        },error=>{
          alert(error.error.message);
        }
      )
    }

  }


}
