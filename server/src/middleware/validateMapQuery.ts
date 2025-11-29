import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";
import { validateBoundingBox, validateZoomLevel } from "@utils/geoValidationUtils";

/**
 * Middleware to validate map query parameters
 * Validates zoom level and bounding box coordinates
 */
export function validateMapQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const { zoom, minLat, maxLat, minLng, maxLng } = req.query;

    // Validate zoom level (optional, 1-20)
    if (zoom) {
      try {
        const zoomLevel = validateZoomLevel(zoom as string);
        // Store validated value in request for controller
        (req as any).validatedZoom = zoomLevel;
      } catch (error) {
        return next(new BadRequestError((error as Error).message));
      }
    }

    // Validate bounding box coordinates (all or none must be provided)
    if (minLat || maxLat || minLng || maxLng) {
      // Check if all bounding box parameters are provided
      if (!minLat || !maxLat || !minLng || !maxLng) {
        return next(new BadRequestError('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng'));
      }

      try {
        const boundingBox = validateBoundingBox(
          minLat as string,
          maxLat as string,
          minLng as string,
          maxLng as string
        );
        // Store validated values in request for controller
        (req as any).validatedBoundingBox = boundingBox;
      } catch (error) {
        return next(new BadRequestError((error as Error).message));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
