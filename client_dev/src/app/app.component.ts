import { Component,OnInit, DoCheck} from '@angular/core';
import { ProjectService } from './services/project.service';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { Proveedor } from './models/vendor';
import { JSDocComment } from '@angular/compiler';


import { ThemeService } from './services/theme.service';

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
    private _router: Router,
    public themeService: ThemeService
  ){
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnInit(){
    this.identity= JSON.stringify(this._projectService.getIdentity());
    this.rol = JSON.parse(this.identity);
    this.rol = this.rol['rol'];
  }
  ngDoCheck(){
    this.identity= JSON.stringify(this._projectService.getIdentity());
    this.rol = JSON.parse(this.identity);
    this.rol = this.rol['rol'];
  }
  logOut(){
    const currentTheme = localStorage.getItem('theme');
    localStorage.clear();
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }
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
