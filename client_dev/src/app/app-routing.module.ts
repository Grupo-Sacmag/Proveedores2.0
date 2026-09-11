
import { ModuleWithProviders, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {UserGuard} from './services/user.guard'


import { IndexComponent } from './components/index/index.component';
import { VendorsComponent } from './components/vendors/vendors.component';
import { ArchivesComponent } from './components/archives/archives.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDataComponent } from './components/user-data/user-data.component';
import { RegisterUsuariosComponent } from './components/register-usuarios/register-usuarios.component';
import { RecuperarInfoComponent } from './components/recuperar-info/recuperar-info.component';
import { ArchivesAllComponent } from './components/archives-all/archives-all.component';
import { HistorialDeArchivosComponent } from './components/historial-de-archivos/historial-de-archivos.component';
import { ChequeComponent } from './components/cheque/cheque.component';
import { PatchNotesComponent } from './components/patch-notes/patch-notes.component';
import { PatchnotesComponent } from './components/patchnotes/patchnotes.component';


import { WorkordersComponent } from './components/workorders/workorders.component';
import { AyudaComponent } from './components/ayuda/ayuda.component';
const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'inicio', component: IndexComponent },
  { path: 'datos', component: UserDataComponent },
  {
    path: 'proveedores',
    component: VendorsComponent,
    canActivate: [UserGuard],
  },
  { path: 'archivos', component: ArchivesComponent, canActivate: [UserGuard] },
  { path: 'registro', component: RegisterComponent, canActivate: [UserGuard] },
  {
    path: 'proveedor/:id',
    component: ArchivesComponent,
    canActivate: [UserGuard],
  },
  { path: 'recuperar-info', component: RecuperarInfoComponent },
  { path: 'recuperar-info/:rfc/:correo', component: RecuperarInfoComponent },
  {
    path: 'registro-usuarios',
    component: RegisterUsuariosComponent,
    canActivate: [UserGuard],
  },
  {
    path: 'archivos-all',
    component: ArchivesAllComponent,
    canActivate: [UserGuard],
  },
  { path: 'historial-archivos/:rfc', component: HistorialDeArchivosComponent },
  { path: 'cheque/:rfc', component: ChequeComponent, canActivate: [UserGuard] },
  { path: 'workorders/:rfc/:empresa', component: WorkordersComponent, canActivate: [UserGuard] },
  { path: 'patch-notes', component: PatchNotesComponent },
  { path: 'patchnotes', component: PatchNotesComponent },
  { path: 'feedback', component: PatchnotesComponent },
  { path: 'ayuda', component: AyudaComponent },
  { path: '**', component: IndexComponent },
];

export const appRoutingProviders:any[] = [];
export const routing: ModuleWithProviders<any> =RouterModule.forRoot(routes);
