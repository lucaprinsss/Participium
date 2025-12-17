import { Request, Response, NextFunction } from 'express';
import { validateCreateReport } from '@middleware/reportMiddleware';
import { BadRequestError } from '@errors/BadRequestError';
import { ReportCategory } from '@dto/ReportCategory';

describe('reportMiddleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {
                title: 'Valid Title for Report',
                description: 'This is a valid description for the report, it is long enough.',
                category: ReportCategory.OTHER,
                isAnonymous: false,
                location: {
                    latitude: 45.0,
                    longitude: 7.0,
                },
                photos: [
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                ],
            },
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });

    // Covers line 72 (next())
    it('should call next() if validation passes', () => {
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    // Covers line 19 (title length < 5)
    it('should throw BadRequestError if title is too short', () => {
        mockRequest.body.title = 'abcd';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Title must be between 5 and 200 characters');
    });

    // Covers line 19 (title length > 200)
    it('should throw BadRequestError if title is too long', () => {
        mockRequest.body.title = 'a'.repeat(201);
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Title must be between 5 and 200 characters');
    });

    // Covers line 24 (description length < 10)
    it('should throw BadRequestError if description is too short', () => {
        mockRequest.body.description = 'short';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Description must be between 10 and 2000 characters');
    });

    // Covers line 24 (description length > 2000)
    it('should throw BadRequestError if description is too long', () => {
        mockRequest.body.description = 'a'.repeat(2001);
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Description must be between 10 and 2000 characters');
    });

    // Covers line 33 (invalid category)
    it('should throw BadRequestError if category is invalid', () => {
        mockRequest.body.category = 'INVALID_CATEGORY';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toContain('Invalid category.');
    });

    // Covers line 37 (isAnonymous not boolean)
    it('should throw BadRequestError if isAnonymous is not a boolean', () => {
        mockRequest.body.isAnonymous = 'true'; // Not a boolean
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('isAnonymous must be a boolean');
    });

    // Covers line 44 (location latitude not number)
    it('should throw BadRequestError if location latitude is not a number', () => {
        mockRequest.body.location.latitude = 'not_a_number';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Location must include numeric latitude and longitude');
    });

    // Covers line 44 (location longitude not number)
    it('should throw BadRequestError if location longitude is not a number', () => {
        mockRequest.body.location.longitude = 'not_a_number';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Location must include numeric latitude and longitude');
    });

    // Covers line 49 (latitude < -90)
    it('should throw BadRequestError if latitude is less than -90', () => {
        mockRequest.body.location.latitude = -91;
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Latitude must be between -90 and 90');
    });

    // Covers line 49 (latitude > 90)
    it('should throw BadRequestError if latitude is greater than 90', () => {
        mockRequest.body.location.latitude = 91;
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Latitude must be between -90 and 90');
    });

    // Covers line 52 (longitude < -180)
    it('should throw BadRequestError if longitude is less than -180', () => {
        mockRequest.body.location.longitude = -181;
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Longitude must be between -180 and 180');
    });

    // Covers line 52 (longitude > 180)
    it('should throw BadRequestError if longitude is greater than 180', () => {
        mockRequest.body.location.longitude = 181;
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Longitude must be between -180 and 180');
    });

    // Covers line 55 (photos missing)
    it('should throw BadRequestError if photos are missing', () => {
        delete mockRequest.body.photos;
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Photos are required and must be an array');
    });

    // Covers line 55 (photos not array)
    it('should throw BadRequestError if photos are not an array', () => {
        mockRequest.body.photos = 'not_an_array';
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Photos are required and must be an array');
    });

    // Covers line 58 (photos length < 1)
    it('should throw BadRequestError if photos array is empty', () => {
        mockRequest.body.photos = [];
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Photos must contain between 1 and 3 images');
    });

    // Covers line 58 (photos length > 3)
    it('should throw BadRequestError if photos array contains more than 3 images', () => {
        mockRequest.body.photos = [
            'data:image/png;base64,a',
            'data:image/png;base64,b',
            'data:image/png;base64,c',
            'data:image/png;base64,d',
        ];
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Photos must contain between 1 and 3 images');
    });

    // Covers line 63 (photo not string)
    it('should throw BadRequestError if a photo is not a string', () => {
        mockRequest.body.photos = [123];
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toBe('Photo at index 0 must be a string');
    });

    // Covers line 66 (photo not valid data URI)
    it('should throw BadRequestError if a photo is not a valid data URI', () => {
        mockRequest.body.photos = ['invalid_data_uri'];
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect((nextFunction as jest.Mock).mock.calls[0][0].message).toContain('Photo at index 0 must be a valid data URI');
    });

    // Covers line 75 (catch block for errors)
    it('should call next with error if any validation fails', () => {
        mockRequest.body.title = null; // This will trigger a BadRequestError
        validateCreateReport(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
});
