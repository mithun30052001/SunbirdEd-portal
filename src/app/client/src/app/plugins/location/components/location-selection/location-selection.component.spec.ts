import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ResourceService, ToasterService, NavigationHelperService, UtilService } from '@sunbird/shared';
import { DeviceRegisterService, FormService, OrgDetailsService, UserService } from '../../../../modules/core/services';
import { Router } from '@angular/router';
import { LocationService } from '../../services/location/location.service';
import { IImpressionEventInput, IInteractEventInput, TelemetryService } from '@sunbird/telemetry';
import { PopupControlService } from '../../../../service/popup-control.service';
import { IDeviceProfile } from '../../../../modules/shared-feature/interfaces/deviceProfile';
import { SbFormLocationSelectionDelegate } from '../delegate/sb-form-location-selection.delegate';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash-es';
import { Location as SbLocation } from '@project-sunbird/client-services/models/location';
import { of, throwError } from 'rxjs';
import { onboardingLocationMockData } from './location-selection.component.spec.data';
import { LocationSelectionComponent } from './location-selection.component';

describe('LocationSelectionComponent', () => {
  let locationSelectionComponent: LocationSelectionComponent;
  const mockResourceService: Partial<ResourceService> = {
    messages: {
      fmsg:{
        m0049: "This is a error"
      }
    }
  };
  const mockToasterService: Partial<ToasterService> = {
    error: jest.fn(),
    success: jest.fn()
  };
  const mockLocationService: Partial<LocationService> = {
  };
  const mockRouter: Partial<Router> = {
    events: of({ id: 1, url: 'sample-url' }) as any,
    navigate: jest.fn()
  };
  const mockUserService: Partial<UserService> = {
    loggedIn: true,
    slug: jest.fn().mockReturnValue('tn') as any,
    userData$: of({
      userProfile: {
        userId: 'sample-uid',
        rootOrgId: 'sample-root-id',
        rootOrg: {},
        hashTagIds: ['id']
      } as any
    }) as any,
    setIsCustodianUser: jest.fn(),
    userid: 'sample-uid',
    appId: 'sample-id',
    getServerTimeDiff: '',
  };
  const mockDeviceRegisterService: Partial<DeviceRegisterService> = {};
  const mockNavigationHelperService: Partial<NavigationHelperService> = {
    contentFullScreenEvent: new EventEmitter<any>(),
    getPageLoadTime: jest.fn(()=> 1000)
  };
  const mockPopupControlService: Partial<PopupControlService> = {
    changePopupStatus: jest.fn()
  };
  const mockTelemetryService: Partial<TelemetryService> = {
    interact: jest.fn(),
    log: jest.fn()
  };
  const mockFormService: Partial<FormService> = {
    getFormConfig: jest.fn()
  };
  const mockOrgDetailsService: Partial<OrgDetailsService> = {};
  const mockUtilService: Partial<UtilService> = {
    isDesktopApp: true,
    isIos: true,
    updateRoleChange: jest.fn()
  };
  const dialogRefData = {
    close: jest.fn()
  };
  const mockDialog: Partial<MatDialog> = {
    getDialogById: jest.fn().mockReturnValue(dialogRefData)
  };
  beforeAll(() => {
    locationSelectionComponent = new LocationSelectionComponent(
      mockResourceService as ResourceService,
      mockToasterService as ToasterService,
      mockLocationService as LocationService,
      mockRouter as Router,
      mockUserService as UserService,
      mockDeviceRegisterService as DeviceRegisterService,
      mockNavigationHelperService as NavigationHelperService,
      mockPopupControlService as PopupControlService,
      mockTelemetryService as TelemetryService,
      mockFormService as FormService,
      mockOrgDetailsService as OrgDetailsService,
      mockUtilService as UtilService,
      mockDialog as MatDialog,
    )
    locationSelectionComponent.sbFormLocationSelectionDelegate = new SbFormLocationSelectionDelegate(
      mockUserService as UserService,
      mockLocationService as LocationService,
      mockFormService as FormService,
      mockDeviceRegisterService as DeviceRegisterService,
      mockOrgDetailsService as OrgDetailsService
    )
  });
  beforeEach(() => {
    locationSelectionComponent.sbFormLocationSelectionDelegate.init = jest.fn(() => {
      return Promise.resolve();
    });
    locationSelectionComponent.sbFormLocationSelectionDelegate.init['catch'] = jest.fn(() => {
      return Promise.reject();
    });
    jest.clearAllMocks();
  });

  it('should be create a instance of LocationSelectionComponent', () => {
    expect(locationSelectionComponent).toBeTruthy();
  });
  
  it('should initialize sbFormLocationSelectionDelegate successfully', async () => {
    await locationSelectionComponent.ngOnInit();
    expect(locationSelectionComponent.sbFormLocationSelectionDelegate.init).toHaveBeenCalledWith(
      locationSelectionComponent.deviceProfile,
      locationSelectionComponent.showModal,
      locationSelectionComponent.isStepper
    );
    expect(mockToasterService.error).not.toHaveBeenCalled();
  });

  it('should handle error during sbFormLocationSelectionDelegate initialization', async () => {
    locationSelectionComponent.sbFormLocationSelectionDelegate.init = jest.fn().mockRejectedValueOnce('Initialization failed');
    const closeModalSpy = jest.spyOn(locationSelectionComponent, 'closeModal');
    await locationSelectionComponent.ngOnInit();
    expect(locationSelectionComponent.sbFormLocationSelectionDelegate.init).toHaveBeenCalledWith(
      locationSelectionComponent.deviceProfile,
      locationSelectionComponent.showModal,
      locationSelectionComponent.isStepper
    );
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('should close the popup after submitting', () => {
    // arrange
    jest.spyOn(mockPopupControlService, 'changePopupStatus');
    locationSelectionComponent.onboardingModal = {
      deny(): any {
        return {};
      }
    };
    locationSelectionComponent.close = {
      emit(): any {
        return {};
      }
    } as any;
    jest.spyOn(locationSelectionComponent.onboardingModal, 'deny');
    jest.spyOn(locationSelectionComponent.close, 'emit');
    locationSelectionComponent.closeModal();
    expect(mockPopupControlService.changePopupStatus).toHaveBeenCalledWith(true);
  });

  it('should destroy location delegate', () => {
    jest.spyOn(locationSelectionComponent['sbFormLocationSelectionDelegate'], 'destroy').mockReturnValue(Promise.resolve());
    locationSelectionComponent.ngOnDestroy();
    expect(locationSelectionComponent['sbFormLocationSelectionDelegate'].destroy).toHaveBeenCalledWith();
  });
   
  it('should update user location when showModal is true', async () => {
    const updateLocationSpy = jest.spyOn(locationSelectionComponent.sbFormLocationSelectionDelegate, 'updateUserLocation').mockResolvedValue({
      userProfile: 'success',
      deviceProfile: 'success',
      changes: 'someChanges',
    });

    const telemetryLogEventsSpy = jest.spyOn(locationSelectionComponent as any, 'telemetryLogEvents');
    const utilServiceSpy = jest.spyOn(locationSelectionComponent['utilService'], 'updateRoleChange');

    await locationSelectionComponent.updateUserLocation();
    
    expect(updateLocationSpy).toHaveBeenCalled();
    expect(telemetryLogEventsSpy).toHaveBeenCalledWith('User Profile', true);
    
  });

  it('should handle errors and set isSubmitted to true when showModal is true', async () => {
    const updateLocationSpy = jest
      .spyOn(locationSelectionComponent.sbFormLocationSelectionDelegate, 'updateUserLocation')
      .mockRejectedValue(new Error('Some error'));
    const toasterServiceErrorSpy = jest.spyOn(locationSelectionComponent.toasterService, 'error');
    const closeModalSpy = jest.spyOn(locationSelectionComponent, 'closeModal');

    await locationSelectionComponent.updateUserLocation();

    expect(updateLocationSpy).toHaveBeenCalled();
    expect(toasterServiceErrorSpy).toHaveBeenCalledWith(locationSelectionComponent.resourceService.messages.fmsg.m0049);
    expect(locationSelectionComponent.isSubmitted).toBe(true);
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('should clear user location selections', async () => {
    const clearSelectionsDelegateSpy = jest
      .spyOn(locationSelectionComponent.sbFormLocationSelectionDelegate, 'clearUserLocationSelections')
      .mockResolvedValue();
    const generateCancelInteractEventSpy = jest.spyOn(locationSelectionComponent as any, 'generateCancelInteractEvent');

    await locationSelectionComponent.clearUserLocationSelections();

    expect(clearSelectionsDelegateSpy).toHaveBeenCalled();
    expect(generateCancelInteractEventSpy).toHaveBeenCalled();
  });
  
  it('should generate cancel interact event',async () => {
    const telemetryServiceSpy = jest.spyOn(locationSelectionComponent['telemetryService'], 'interact');

    locationSelectionComponent['generateCancelInteractEvent'];
    await locationSelectionComponent.clearUserLocationSelections();
    expect(telemetryServiceSpy).toHaveBeenCalledWith({
      context: {
        env: 'user-location',
        cdata: [
          { id: 'user:location_capture', type: 'Feature' },
          { id: 'SB-21152', type: 'Task' },
        ],
      },
      edata: {
        id: 'cancel-clicked',
        type: 'TOUCH',
      },
    });
  });

  it('should generate submit interact event when changes are present', () => {
    const telemetryServiceSpy = jest.spyOn(locationSelectionComponent['telemetryService'], 'interact');

    const changes = 'someChanges';
    locationSelectionComponent['generateSubmitInteractEvent'](changes);

    expect(telemetryServiceSpy).toHaveBeenCalledWith({
      context: {
        env: 'user-location',
        cdata: [
          { id: 'user:location_capture', type: 'Feature' },
          { id: 'SB-21152', type: 'Task' },
        ],
      },
      edata: {
        id: 'submit-clicked',
        type: 'location-changed',
        subtype: changes,
      },
      object: [
        { id: 'user:location_capture', type: 'Feature' },
        { id: 'SB-21152', type: 'Task' },
      ],
    });
  });

  it('should generate submit interact event when no changes are present', () => {
    const telemetryServiceSpy = jest.spyOn(locationSelectionComponent['telemetryService'], 'interact');

    const changes = '';
    locationSelectionComponent['generateSubmitInteractEvent'](changes);

    expect(telemetryServiceSpy).toHaveBeenCalledWith({
      context: {
        env: 'user-location',
        cdata: [
          { id: 'user:location_capture', type: 'Feature' },
          { id: 'SB-21152', type: 'Task' },
        ],
      },
      edata: {
        id: 'submit-clicked',
        type: 'location-unchanged',
        subtype: changes,
      },
      object: [
        { id: 'user:location_capture', type: 'Feature' },
        { id: 'SB-21152', type: 'Task' },
      ],
    });
  });
  
  it('should return error message when updation fails', () => {
    const locationType = 'someLocationType';
    const isSuccessful = false;

    const result = locationSelectionComponent['telemetryLogEvents'](locationType, isSuccessful);

    expect(result).toEqual(undefined);
  });

  it('should emit true when onSbFormValueChange is called', () => {
    const onFormValueChangeSpy = jest.spyOn(locationSelectionComponent.onFormValueChange, 'emit');

    locationSelectionComponent.onSbFormValueChange(true);

    expect(onFormValueChangeSpy).toHaveBeenCalledWith(true);
  });

  it('should set telemetryImpression with the correct values in AfterViewInit', () => {
    jest.useFakeTimers();
    locationSelectionComponent.ngAfterViewInit();
    jest.runAllTimers();
    const expectedTelemetryImpression = {
      context: {
        env: 'user-location',
        cdata: [
          { id: 'user:state:districtConfirmation', type: 'Feature' },
          { id: 'SH-40', type: 'Task' },
        ],
      },
      edata: {
        type: 'view',
        pageid: 'location-popup',
        uri: undefined, 
        duration: 1000,
      },
    };
    expect(locationSelectionComponent.telemetryImpression).toEqual(expectedTelemetryImpression);
  });

});