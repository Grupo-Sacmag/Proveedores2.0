import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDeArchivosComponent } from './historial-de-archivos.component';

describe('HistorialDeArchivosComponent', () => {
  let component: HistorialDeArchivosComponent;
  let fixture: ComponentFixture<HistorialDeArchivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistorialDeArchivosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialDeArchivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
