import {Injectable} from '@angular/core';
import{Router, CanActivate, ActivatedRoute} from '@angular/router';
import {ProjectService} from './project.service';
import { Usuario } from '../models/user';
import { IndexComponent } from '../components/index/index.component';



@Injectable({
    providedIn: 'root'
}
    
)


export class UserGuard implements CanActivate{
    public identity:any;
    public token: any;
    
    constructor(
        private _router: Router,
        private _projectService: ProjectService,
        private _route: ActivatedRoute
       
        
    ){
       
       
        
     
        
    }
    
    
    canActivate():boolean{
      let identity = this._projectService.getIdentity();
      let token = this._projectService.getToken();
      if(identity && token){
        
        return true;
      }else{
        this._router.navigate(['/inicio']);
        return false;
      }
        
      

    }
  
}