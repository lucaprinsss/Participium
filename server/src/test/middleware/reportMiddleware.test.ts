import { Request, Response, NextFunction } from 'express';
import { validateCreateReport } from '../../middleware/reportMiddleware';
import { BadRequestError } from '../../models/errors/BadRequestError';
import { ReportCategory } from '../../models/dto/ReportCategory';

describe('validateCreateReport', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {
        title: 'Valid Title for Report',
        description: 'This is a valid description for the report, it has more than 10 characters.',
        category: Object.values(ReportCategory)[0],
        isAnonymous: false,
        location: {
          latitude: 45.0,
          longitude: 7.0,
        },
        photos: [
          'data:image/jpeg;base64,someBase64Data1',
        ],
      },
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  // Test for successful validation
  it('should call next() without error for a valid report request', () => {
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // Called with no arguments indicates success
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  // Line 19: 'Title is required and must be a string'
  it('should call next() with BadRequestError if title is missing', () => {
    mockRequest.body.title = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Title is required and must be a string'));
  });

  it('should call next() with BadRequestError if title is not a string', () => {
    mockRequest.body.title = 123;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Title is required and must be a string'));
  });

  // Line 24: 'Title must be between 5 and 200 characters'
  it('should call next() with BadRequestError if title is too short', () => {
    mockRequest.body.title = 'abcd'; // Less than 5 characters
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Title must be between 5 and 200 characters'));
  });

  it('should call next() with BadRequestError if title is too long', () => {
    mockRequest.body.title = 'a'.repeat(201); // More than 200 characters
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Title must be between 5 and 200 characters'));
  });

  // Line 33: 'Description is required and must be a string'
  it('should call next() with BadRequestError if description is missing', () => {
    mockRequest.body.description = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Description is required and must be a string'));
  });

  it('should call next() with BadRequestError if description is not a string', () => {
    mockRequest.body.description = 123;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Description is required and must be a string'));
  });

  // Line 37: 'Description must be between 10 and 2000 characters'
  it('should call next() with BadRequestError if description is too short', () => {
    mockRequest.body.description = 'short'; // Less than 10 characters
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Description must be between 10 and 2000 characters'));
  });

  it('should call next() with BadRequestError if description is too long', () => {
    mockRequest.body.description = 'a'.repeat(2001); // More than 2000 characters
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Description must be between 10 and 2000 characters'));
  });

  // Line 44: 'Category is required and must be a string'
  it('should call next() with BadRequestError if category is missing', () => {
    mockRequest.body.category = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Category is required and must be a string'));
  });

  it('should call next() with BadRequestError if category is not a string', () => {
    mockRequest.body.category = 123;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Category is required and must be a string'));
  });

  // Line 49: 'Invalid category. Must be one of: ...'
  it('should call next() with BadRequestError if category is invalid', () => {
    mockRequest.body.category = 'INVALID_CATEGORY';
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(
      new BadRequestError(
        `Invalid category. Must be one of: ${Object.values(ReportCategory).join(', ')}`
      )
    );
  });

  // Line 52: 'isAnonymous must be a boolean'
  it('should call next() with BadRequestError if isAnonymous is not a boolean', () => {
    mockRequest.body.isAnonymous = 'true';
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('isAnonymous is required and must be a boolean'));
  });

  // Line 55: 'Location is required and must be an object'
  it('should call next() with BadRequestError if location is missing', () => {
    mockRequest.body.location = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Location is required and must be an object'));
  });

  it('should call next() with BadRequestError if location is not an object', () => {
    mockRequest.body.location = 'not-an-object';
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Location is required and must be an object'));
  });

  // Line 58: 'Location must include numeric latitude and longitude'
  it('should call next() with BadRequestError if latitude is missing', () => {
    mockRequest.body.location.latitude = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Location must include numeric latitude and longitude'));
  });

  it('should call next() with BadRequestError if longitude is missing', () => {
    mockRequest.body.location.longitude = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Location must include numeric latitude and longitude'));
  });

  it('should call next() with BadRequestError if latitude is not a number', () => {
    mockRequest.body.location.latitude = 'not-a-number';
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Location must include numeric latitude and longitude'));
  });

  // Line 63: 'Latitude must be between -90 and 90'
  it('should call next() with BadRequestError if latitude is out of range (too high)', () => {
    mockRequest.body.location.latitude = 91;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Latitude must be between -90 and 90'));
  });

  it('should call next() with BadRequestError if latitude is out of range (too low)', () => {
    mockRequest.body.location.latitude = -91;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Latitude must be between -90 and 90'));
  });

  // Line 66: 'Longitude must be between -180 and 180'
  it('should call next() with BadRequestError if longitude is out of range (too high)', () => {
    mockRequest.body.location.longitude = 181;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Longitude must be between -180 and 180'));
  });

  it('should call next() with BadRequestError if longitude is out of range (too low)', () => {
    mockRequest.body.location.longitude = -181;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Longitude must be between -180 and 180'));
  });

  // Line 72: 'Photos are required and must be an array'
  it('should call next() with BadRequestError if photos are missing', () => {
    mockRequest.body.photos = undefined;
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Photos are required and must be an array'));
  });

  it('should call next() with BadRequestError if photos are not an array', () => {
    mockRequest.body.photos = 'not-an-array';
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Photos are required and must be an array'));
  });

  // Line 75: 'Photos must contain between 1 and 3 images'
  it('should call next() with BadRequestError if photos array is empty', () => {
    mockRequest.body.photos = [];
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Photos must contain between 1 and 3 images'));
  });

  it('should call next() with BadRequestError if photos array contains more than 3 images', () => {
    mockRequest.body.photos = [
      'data:image/jpeg;base64,someBase64Data1',
      'data:image/jpeg;base64,someBase64Data2',
      'data:image/jpeg;base64,someBase64Data3',
      'data:image/jpeg;base64,someBase64Data4',
    ];
    validateCreateReport(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(new BadRequestError('Photos must contain between 1 and 3 images'));
  });
});
