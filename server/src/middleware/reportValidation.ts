import { Request, Response, NextFunction } from 'express';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { BadRequestError } from '../models/errors/BadRequestError';

/**
 * Middleware to validate create report request
 */
export const validateCreateReport = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const data: CreateReportRequest = req.body;

    // Validate location
    if (!data.location || typeof data.location !== 'object') {
      throw new BadRequestError('Location is required and must be an object');
    }
    if (typeof data.location.latitude !== 'number' || typeof data.location.longitude !== 'number') {
      throw new BadRequestError('Location must include numeric latitude and longitude');
    }
    if (data.location.latitude < -90 || data.location.latitude > 90) {
      throw new BadRequestError('Latitude must be between -90 and 90');
    }
    if (data.location.longitude < -180 || data.location.longitude > 180) {
      throw new BadRequestError('Longitude must be between -180 and 180');
    }

    // Validate photos
    if (!data.photos || !Array.isArray(data.photos)) {
      throw new BadRequestError('Photos are required and must be an array');
    }
    if (data.photos.length < 1 || data.photos.length > 3) {
      throw new BadRequestError('Photos must contain between 1 and 3 images');
    }
    
    const dataUriPattern = /^data:image\/(jpeg|png|webp);base64,/;
    for (let i = 0; i < data.photos.length; i++) {
      if (typeof data.photos[i] !== 'string') {
        throw new BadRequestError(`Photo at index ${i} must be a string`);
      }
      if (!dataUriPattern.test(data.photos[i])) {
        throw new BadRequestError(
          `Photo at index ${i} must be a valid data URI with format: data:image/(jpeg|png|webp);base64,...`
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
