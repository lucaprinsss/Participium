import { Request, Response, NextFunction } from 'express';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportCategory } from '../models/dto/ReportCategory';
import { BadRequestError } from '../models/errors/BadRequestError';

/**
 * Middleware to validate create report request
 */
export const validateCreateReport = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const data: CreateReportRequest = req.body;

    // Validate title
    if (!data.title || typeof data.title !== 'string') {
      throw new BadRequestError('Title is required and must be a string');
    }
    const trimmedTitle = data.title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      throw new BadRequestError('Title must be between 5 and 200 characters');
    }

    // Validate description
    if (!data.description || typeof data.description !== 'string') {
      throw new BadRequestError('Description is required and must be a string');
    }
    const trimmedDescription = data.description.trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      throw new BadRequestError('Description must be between 10 and 2000 characters');
    }

    // Validate category
    if (!data.category || typeof data.category !== 'string') {
      throw new BadRequestError('Category is required and must be a string');
    }
    const validCategories = Object.values(ReportCategory);
    if (!validCategories.includes(data.category as ReportCategory)) {
      throw new BadRequestError(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`
      );
    }

    // Validate isAnonymous (optional)
    if (data.isAnonymous !== undefined && typeof data.isAnonymous !== 'boolean') {
      throw new BadRequestError('isAnonymous must be a boolean');
    }

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

