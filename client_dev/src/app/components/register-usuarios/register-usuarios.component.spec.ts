import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterUsuariosComponent } from './register-usuarios.component';

describe('RegisterUsuariosComponent', () => {
  let component: RegisterUsuariosComponent;
  let fixture: ComponentFixture<RegisterUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisterUsuariosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
