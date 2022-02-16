
import {of as observableOf,  Observable } from 'rxjs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { UserService, CoreModule, BadgesService } from '@sunbird/core';
import { ProfileBadgeComponent } from './profile-badge.component';
import { mockRes } from './profile-badge.component.spec.data';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule, IUserProfile } from '@sunbird/shared';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { configureTestSuite } from '@sunbird/test-util';

describe('ProfileBadgeComponent', () => {
  let component: ProfileBadgeComponent;
  let fixture: ComponentFixture<ProfileBadgeComponent>;
  configureTestSuite();
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule.forRoot(), HttpClientTestingModule, CoreModule],
      declarations: [ProfileBadgeComponent],
      providers: [UserService, BadgesService],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call getBadgeData method', () => {
    const userService = TestBed.inject(UserService);
    const badgeService = TestBed.inject(BadgesService);
    userService._userData$.next({ err: null, userProfile: mockRes.data.userProfile as any });
    spyOn(badgeService, 'getDetailedBadgeAssertions').and.callFake(() => observableOf(mockRes.badgeList));
    component.ngOnInit();
    expect(component.badgeArray[0]).toEqual(mockRes.badgeList);
  });
  it('should call toggle method with limit greater than 4', () => {
    const badgeService = TestBed.inject(BadgesService);
    const limit = true;
    component.badgeArray = [];
    component.badgeArray.length = 5;
    component.limit = component.badgeArray.length;
    component.toggle(limit);
    expect(component.viewMore).toBe(false);
    expect(component.limit).toBeGreaterThan(4);
  });
  it('should call toggle method with limit lesser than 4', () => {
    const limit = false;
    component.toggle(limit);
    expect(component.viewMore).toBe(true);
    expect(component.limit).toBeLessThanOrEqual(4);
  });
});
