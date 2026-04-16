import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminpurchaseComponent } from './adminpurchase.component';

describe('AdminpurchaseComponent', () => {
  let component: AdminpurchaseComponent;
  let fixture: ComponentFixture<AdminpurchaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminpurchaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminpurchaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
