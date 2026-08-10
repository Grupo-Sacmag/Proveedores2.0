import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperarInfoComponent } from './recuperar-info.component';

describe('RecuperarInfoComponent', () => {
  let component: RecuperarInfoComponent;
  let fixture: ComponentFixture<RecuperarInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecuperarInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecuperarInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
