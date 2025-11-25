import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EoLoginPage } from './eo-login-page';

describe('EoLoginPage', () => {
  let component: EoLoginPage;
  let fixture: ComponentFixture<EoLoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EoLoginPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EoLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
