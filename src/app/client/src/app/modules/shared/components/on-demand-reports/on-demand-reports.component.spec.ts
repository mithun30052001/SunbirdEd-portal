import { OnDemandReportsComponent } from './on-demand-reports.component';
import { ResourceService, ToasterService } from '../../services';
import { OnDemandReportService } from '../../services/on-demand-report/on-demand-report.service';
import { TelemetryService } from '@sunbird/telemetry';
import { of, throwError } from 'rxjs';
import { UntypedFormGroup } from '@angular/forms';

describe('OnDemandReportsComponent', () => {
    let component: OnDemandReportsComponent;
    const resourceService: Partial<ResourceService> = {
      frmelmnts: {
        lbl: {
            requestFailed: 'Mock request failed message',
        },
      },
      messages: {
        fmsg: {
            m0004: 'Mock error message',
        },
      },
      instance: 'mockinstance'
    };
    const telemetryService: Partial<TelemetryService> = {};
    const onDemandReportService: Partial<OnDemandReportService> = {};
    const toasterService: Partial<ToasterService> = {};

    beforeAll(() => {
        component = new OnDemandReportsComponent(
            resourceService as ResourceService,
			telemetryService as TelemetryService,
			onDemandReportService as OnDemandReportService,
			toasterService as ToasterService
        )
        component.batch = { batchId: 'mockBatchId', endDate: '2023-12-31' };
        component.userId = 'mockUserId';
        component.tag = 'mockTag';
      component.batch = { batchId: 'testBatchId', courseId: 'testCourseId' };
      component.reportForm = new UntypedFormGroup({});
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
            
    it('should create a instance of component', () => {
        expect(component).toBeTruthy();
    });

    it('should load reports when batchDetails is provided', () => {
        const mockBatchDetails = {
          courseId: 'sampleCourseId',
          batchId: 'sampleBatchId',
        };
    
        const mockReportData = {
          result: {
            jobs: [{ dataset: 'sampleDataset'}],
          },
        };
    
        onDemandReportService.getReportList = jest.fn(() => of(mockReportData));
        component.loadReports(mockBatchDetails);
    
        expect(component.batch).toEqual(mockBatchDetails);
        expect(component.tag).toEqual(`${mockBatchDetails.courseId}_${mockBatchDetails.batchId}`);
        expect(onDemandReportService.getReportList).toHaveBeenCalledWith(component.tag);
        expect(component.onDemandReportData).toEqual([{ dataset: 'sampleDataset'}]);
    });

    it('should handle reportChanged event', () => {
        const mockEvent = { value: { dataset: 'sampleDataset', title: 'Sample Title' } };
        component.reportChanged(mockEvent);
        expect(component.selectedReport).toEqual(mockEvent.value);
    });

    it('should generate telemetry for field type, batchId, and courseId', () => {
        const mockEventType = 'sampleEventType';
        const mockBatchId = 'sampleBatchId';
        const mockCourseId = 'sampleCourseId';
    
        const mockEvent = {
          value: {
            dataset: 'sampleDataset',
          },
        };
    
        telemetryService.interact = jest.fn();
        component.generateTelemetry(mockEventType, mockBatchId, mockCourseId);
    
        expect(telemetryService.interact).toHaveBeenCalledWith({
          context: {
            env: 'reports',
            cdata: [
              { id: mockCourseId, type: 'Course' },
              { id: mockBatchId, type: 'Batch' },
            ],
          },
          edata: {
            id: mockEventType,
            type: 'click',
            pageid: 'on-demand-reports',
          },
        });
    });

    it('should handle onDownloadLinkFail', () => {
        const mockData = {
          tag: 'sampleTag',
          requestId: 'sampleRequestId',
        };
    
        const mockDownloadData = {
          result: {
            downloadUrls: ['sampleDownloadUrl'],
          },
        };
    
        onDemandReportService.getReport = jest.fn(() => of(mockDownloadData));
        window.open = jest.fn();
        component.onDownloadLinkFail(mockData);
    
        expect(onDemandReportService.getReport).toHaveBeenCalledWith(mockData.tag, mockData.requestId);
        expect(window.open).toHaveBeenCalledWith('sampleDownloadUrl', '_blank');
    });

    it('should check status and return true', () => {
        component.batch = {
          endDate: '2023-11-01',
        };
        const mockReportData = {
          dataset: 'sampleDataset',
          jobStats: {
            dtJobSubmitted: '2023-11-01T00:00:00.000Z',
          },
        };
        component.onDemandReportData = [mockReportData];
        onDemandReportService.isInProgress = jest.fn(() => false);
    
        const result = component.checkStatus();
    
        expect(result).toBeTruthy();
    });

    it('should check status and return false', () => {
        component.batch = {
          endDate: '2023-11-01',
        };
        const mockReportData = {
          dataset: 'sampleDataset',
          jobStats: {
            dtJobSubmitted: '2023-10-01T00:00:00.000Z',
          },
        };
        component.onDemandReportData = [mockReportData];
        onDemandReportService.isInProgress = jest.fn(() => true);
        const result = component.checkStatus();
        expect(result).toBeFalsy();
    });

    it('should modify data', () => {
        component.reportTypes = [
          { dataset: 'sampleDataset', title: 'Sample Title' },
        ];
        const mockRow = {
          dataset: 'sampleDataset',
        };

        const modifiedData = component.dataModification(mockRow);
        expect(modifiedData.title).toEqual('Sample Title');
    });
    
    it('should submit a request with encryption', () => {
        
        component.checkStatus = jest.fn().mockReturnValue(true);
        component.generateTelemetry = jest.fn();
        component.onDemandReportService.submitRequest = jest.fn().mockReturnValue(of({ result: { status: 'SUCCESS' } }));

        component.submitRequest();

        expect(component.isProcessed).toBe(false);
        expect(component.generateTelemetry).toHaveBeenCalled();
        expect(component.onDemandReportService.submitRequest).toHaveBeenCalled();
    });

    it('should handle a failed request with encryption', () => {
        component.checkStatus = jest.fn().mockReturnValue(true);
        component.generateTelemetry = jest.fn();
        component.onDemandReportService.submitRequest = jest.fn().mockReturnValue(of({ result: { status: 'FAILED', statusMessage: 'Test error' } }));
        component.toasterService.error = jest.fn();

        component.submitRequest();

        expect(component.isProcessed).toBe(false);
        expect(component.generateTelemetry).toHaveBeenCalled();
        expect(component.onDemandReportService.submitRequest).toHaveBeenCalled();
        expect(component.toasterService.error).toHaveBeenCalledWith('Test error');
    });
    

    it('should set the instance property to uppercase of the instance from ResourceService', () => {
      component.ngOnInit();
      expect(component.instance).toBe('MOCKINSTANCE');
    });

    it('should handle error when onDemandReportService.getReportList emits an error', () => {
      const errorResponse = new Error('Mock error');
      onDemandReportService.getReportList = jest.fn().mockReturnValue(throwError(errorResponse));
      component.loadReports({ courseId: 'testCourseId', batchId: 'mockBatchId' });
      expect(toasterService.error).toHaveBeenCalledWith('Mock error message');
    });

    it('should open the download link when getReport is successful', () => {
      onDemandReportService.getReport = jest.fn().mockReturnValue(of({ result: { downloadUrls: ['testDownloadUrl'] } }));
      component.onDownloadLinkFail({ tag: 'test:tag', requestId: 'testRequestId' });
      expect(window.open).toHaveBeenCalledWith('testDownloadUrl', '_blank');
    });
    
    it('should handle error when getReport emits an error', () => {
      const errorResponse = new Error('Test error');
      onDemandReportService.getReport = jest.fn().mockReturnValue(throwError(errorResponse));
      component.onDownloadLinkFail({ tag: 'test:tag', requestId: 'testRequestId' });
      expect(toasterService.error).toHaveBeenCalledWith('Mock error message');
    });
    
    it('should handle error when download URL is not available', () => {
      onDemandReportService.getReport = jest.fn().mockReturnValue(of({ result: { downloadUrls: [] } }));
      component.onDownloadLinkFail({ tag: 'test:tag', requestId: 'testRequestId' });
      expect(toasterService.error).toHaveBeenCalledWith('Mock error message');
    });

});


