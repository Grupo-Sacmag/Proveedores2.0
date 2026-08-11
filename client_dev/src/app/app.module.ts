import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { routing, appRoutingProviders } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import{ HttpClientModule} from '@angular/common/http';

import { AppComponent } from './app.component';

import { IndexComponent } from './components/index/index.component';
import { VendorsComponent } from './components/vendors/vendors.component';
import { ArchivesComponent } from './components/archives/archives.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDataComponent } from './components/user-data/user-data.component';
import { RegisterUsuariosComponent } from './components/register-usuarios/register-usuarios.component'


//Serviccios
import { ProjectService } from './services/project.service';
import {UserGuard} from './services/user.guard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/*Angular material*/
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { SearchPipe } from './pipes/search.pipe';
import { RecuperarInfoComponent } from './components/recuperar-info/recuperar-info.component';
import { ArchivesAllComponent } from './components/archives-all/archives-all.component';
import { HistorialDeArchivosComponent } from './components/historial-de-archivos/historial-de-archivos.component';
import { ChequeComponent } from './components/cheque/cheque.component';
import { PatchNotesComponent } from './components/patch-notes/patch-notes.component';
import { PatchnotesComponent } from './components/patchnotes/patchnotes.component';
import { WorkordersComponent } from './components/workorders/workorders.component';


@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    VendorsComponent,
    ArchivesComponent,
    RegisterComponent,
    UserDataComponent,
    RegisterUsuariosComponent,
    SearchPipe,
    RecuperarInfoComponent,
    ArchivesAllComponent,
    HistorialDeArchivosComponent,
    ChequeComponent,
    PatchNotesComponent,
    PatchnotesComponent,
    WorkordersComponent,
  ],
  imports: [
    //Modulos
    BrowserModule,
    routing,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  providers: [
    //Servicios
    appRoutingProviders,
    ProjectService,
    UserGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
