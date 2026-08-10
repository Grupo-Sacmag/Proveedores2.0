import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivesAllComponent } from './archives-all.component';

describe('ArchivesAllComponent', () => {
  let component: ArchivesAllComponent;
  let fixture: ComponentFixture<ArchivesAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchivesAllComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchivesAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
