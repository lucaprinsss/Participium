import { Request, Response, NextFunction } from 'express';
import { validateMapQuery } from '@middleware/validateMapQuery';
import { BadRequestError } from '@errors/BadRequestError';

describe('ValidateMapQuery Middleware Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('Zoom Level Validation', () => {
    it('should pass when zoom is not provided', () => {
      mockReq.query = {};

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBeUndefined();
    });

    it('should validate and store zoom level when provided', () => {
      mockReq.query = { zoom: '15' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBe(15);
    });

    it('should call next with BadRequestError for invalid zoom', () => {
      mockReq.query = { zoom: '25' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Zoom level must be between 1 and 20');
    });

    it('should call next with BadRequestError for non-numeric zoom', () => {
      mockReq.query = { zoom: 'abc' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('Zoom level must be a valid number');
    });
  });

  describe('Bounding Box Validation - Partial Parameters', () => {
    it('should call next with error when only minLat is provided', () => {
      mockReq.query = { minLat: '45.0' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
    });

    it('should call next with error when only maxLat is provided', () => {
      mockReq.query = { maxLat: '45.1' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
    });

    it('should call next with error when only minLng is provided', () => {
      mockReq.query = { minLng: '7.5' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
    });

    it('should call next with error when only maxLng is provided', () => {
      mockReq.query = { maxLng: '7.8' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
    });

    it('should call next with error when three out of four parameters are provided', () => {
      mockReq.query = { minLat: '45.0', maxLat: '45.1', minLng: '7.5' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
    });
  });

  describe('Bounding Box Validation - All Parameters Provided', () => {
    it('should validate and store bounding box when all parameters are valid', () => {
      mockReq.query = {
        minLat: '45.0',
        maxLat: '45.1',
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedBoundingBox).toEqual({
        minLat: 45.0,
        maxLat: 45.1,
        minLng: 7.5,
        maxLng: 7.8,
      });
    });

    it('should call next with error for invalid bounding box coordinates', () => {
      mockReq.query = {
        minLat: '45.0',
        maxLat: '95.0', // Invalid (> 90)
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBeDefined();
    });

    it('should call next with error for non-numeric bounding box values', () => {
      mockReq.query = {
        minLat: 'abc',
        maxLat: '45.1',
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('Combined Zoom and Bounding Box', () => {
    it('should validate both zoom and bounding box when both are provided', () => {
      mockReq.query = {
        zoom: '12',
        minLat: '45.0',
        maxLat: '45.1',
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBe(12);
      expect((mockReq as any).validatedBoundingBox).toBeDefined();
    });

    it('should work with only zoom, no bounding box', () => {
      mockReq.query = { zoom: '10' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBe(10);
      expect((mockReq as any).validatedBoundingBox).toBeUndefined();
    });

    it('should work with only bounding box, no zoom', () => {
      mockReq.query = {
        minLat: '45.0',
        maxLat: '45.1',
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBeUndefined();
      expect((mockReq as any).validatedBoundingBox).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors in catch block', () => {
      // Create a scenario that throws an unexpected error
      mockReq.query = {
        zoom: '12',
      };

      // Mock validateZoomLevel to throw a non-standard error
      jest.mock('@utils/geoValidationUtils', () => ({
        validateZoomLevel: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
        validateBoundingBox: jest.fn(),
      }));

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      // The catch block should pass any error to next
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass through errors from validateBoundingBox', () => {
      mockReq.query = {
        minLat: '91', // Invalid
        maxLat: '45.1',
        minLng: '7.5',
        maxLng: '7.8',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query object', () => {
      mockReq.query = {};

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle boundary zoom values', () => {
      mockReq.query = { zoom: '1' };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedZoom).toBe(1);
    });

    it('should handle boundary latitude values', () => {
      mockReq.query = {
        minLat: '-90',
        maxLat: '90',
        minLng: '-180',
        maxLng: '180',
      };

      validateMapQuery(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).validatedBoundingBox).toEqual({
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
      });
    });
  });
});
