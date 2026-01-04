import { Request, Response, NextFunction } from 'express';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportCategory } from '../models/dto/ReportCategory';
import { BadRequestError } from '../models/errors/BadRequestError';

/**
 * Validates the title field
 */
const validateTitle = (title: any): void => {
  if (!title || typeof title !== 'string') {
    throw new BadRequestError('Title is required and must be a string');
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
    throw new BadRequestError('Title must be between 5 and 200 characters');
  }
};

/**
 * Validates the description field
 */
const validateDescription = (description: any): void => {
  if (!description || typeof description !== 'string') {
    throw new BadRequestError('Description is required and must be a string');
  }
  const trimmedDescription = description.trim();
  if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
    throw new BadRequestError('Description must be between 10 and 2000 characters');
  }
};

/**
 * Validates the category field
 */
const validateCategory = (category: any): void => {
  if (!category || typeof category !== 'string') {
    throw new BadRequestError('Category is required and must be a string');
  }
  const validCategories = Object.values(ReportCategory);
  if (!validCategories.includes(category as ReportCategory)) {
    throw new BadRequestError(
      `Invalid category. Must be one of: ${validCategories.join(', ')}`
    );
  }
};

/**
 * Validates the isAnonymous field
 */
const validateIsAnonymous = (isAnonymous: any): void => {
  if (isAnonymous === undefined || isAnonymous === null || typeof isAnonymous !== 'boolean') {
    throw new BadRequestError('isAnonymous is required and must be a boolean');
  }
};

/**
 * Validates the location field
 */
const validateLocation = (location: any): void => {
  if (!location || typeof location !== 'object') {
    throw new BadRequestError('Location is required and must be an object');
  }
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw new BadRequestError('Location must include numeric latitude and longitude');
  }
  if (location.latitude < -90 || location.latitude > 90) {
    throw new BadRequestError('Latitude must be between -90 and 90');
  }
  if (location.longitude < -180 || location.longitude > 180) {
    throw new BadRequestError('Longitude must be between -180 and 180');
  }
};

/**
 * Validates the photos field
 */
const validatePhotos = (photos: any): void => {
  if (!photos || !Array.isArray(photos)) {
    throw new BadRequestError('Photos are required and must be an array');
  }
  if (photos.length < 1 || photos.length > 3) {
    throw new BadRequestError('Photos must contain between 1 and 3 images');
  }
  
  const dataUriPattern = /^data:image\/(jpeg|png|webp);base64,/;
  for (let i = 0; i < photos.length; i++) {
    if (typeof photos[i] !== 'string') {
      throw new BadRequestError(`Photo at index ${i} must be a string`);
    }
    if (!dataUriPattern.test(photos[i])) {
      throw new BadRequestError(
        `Photo at index ${i} must be a valid data URI with format: data:image/(jpeg|png|webp);base64,...`
      );
    }
  }
};

/**
 * Middleware to validate create report request
 */
export const validateCreateReport = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const data: CreateReportRequest = req.body;

    validateTitle(data.title);
    validateDescription(data.description);
    validateCategory(data.category);
    validateIsAnonymous(data.isAnonymous);
    validateLocation(data.location);
    validatePhotos(data.photos);

    next();
  } catch (error) {
    next(error);
  }
};

