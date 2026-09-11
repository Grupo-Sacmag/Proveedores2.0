import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css'],
  providers: [ProjectService]
})
export class AyudaComponent implements OnInit {
  public identity: any;
  public showProveedorInfo: boolean = false;
  public showAdminInfo: boolean = false;

  constructor(
    private _projectService: ProjectService,
    public themeService: ThemeService
  ) { 
    this.identity = this._projectService.getIdentity();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnInit(): void {
  }

  toggleProveedorInfo(event: Event) {
    event.preventDefault();
    this.showProveedorInfo = !this.showProveedorInfo;
  }

  toggleAdminInfo(event: Event) {
    event.preventDefault();
    this.showAdminInfo = !this.showAdminInfo;
  }
}
