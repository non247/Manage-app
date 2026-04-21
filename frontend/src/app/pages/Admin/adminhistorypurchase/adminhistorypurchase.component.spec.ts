import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmhistorypurchaseComponent } from './admhistorypurchase.component';

describe('AdmhistorypurchaseComponent', () => {
  let component: AdmhistorypurchaseComponent;
  let fixture: ComponentFixture<AdmhistorypurchaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmhistorypurchaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdmhistorypurchaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
