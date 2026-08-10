import { Component,OnInit, DoCheck} from '@angular/core';
import { ProjectService } from './services/project.service';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { Proveedor } from './models/vendor';
import { JSDocComment } from '@angular/compiler';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ProjectService]
})
export class AppComponent implements OnInit, DoCheck {
  public identity:any;
  public tipo: any;
  public vendor:any;
  public rol:any;
  public menuToggle: any;
  public navigation: any;



  title = 'Proveedores-Sacmag';
  constructor(
    private _projectService:ProjectService,
    private _router: Router
  ){
    /* this.vendor = new Proveedor('','','','','','','','',0,'',false,false);
     */


  }
  ngOnInit(){



    this.identity= JSON.stringify(this._projectService.getIdentity());
    /* this.vendor = this._projectService.getIdentity();
    console.log(this.vendor); */
    this.rol = JSON.parse(this.identity);
    this.rol = this.rol['rol'];


    /* this.tipo = this._projectService.getIdentity();
    this.tipo = this.tipo['rol'];
    console.log(this.tipo['rol']); */
  }
  ngDoCheck(){
   /*  this.tipo= ''; */
    this.identity= JSON.stringify(this._projectService.getIdentity());
    this.rol = JSON.parse(this.identity);
    this.rol = this.rol['rol'];

    /* this.tipo = this.tipo['rol'];
    console.log(this.tipo['rol']);
     */
  }
  logOut(){
    localStorage.clear();
    this.identity= null;
    this._router.navigateByUrl('/login');

  }


  menu(){
    this.menuToggle = document.querySelector('.toggle');
  this.navigation = document.querySelector('.navigation');
  this.menuToggle.classList.toggle('active');
  this.navigation.classList.toggle('active');

  }


}
