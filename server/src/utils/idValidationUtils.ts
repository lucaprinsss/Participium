import { BadRequestError } from "@errors/BadRequestError";

/**
 * Parse and validate an ID parameter from request
 * @param id ID string from req.params
 * @param resourceName Name of the resource (e.g., "report", "department", "user")
 * @returns Parsed integer ID
 * @throws BadRequestError if ID is invalid
 */
export function parseAndValidateId(id: string, resourceName: string = "resource"): number {
  const parsedId = Number(id);
  
  if (
    id.includes('.') ||
    Number.isNaN(parsedId) ||
    parsedId <= 0 ||
    !Number.isInteger(parsedId)
  ) {
    throw new BadRequestError(`Invalid ${resourceName} ID. Must be a positive integer.`);
  }
  
  return parsedId;
}
