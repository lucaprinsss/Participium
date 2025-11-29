import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";

export function validateDepartmentId(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const departmentId = Number(id);
  if (
    id.includes('.') ||
    Number.isNaN(departmentId) ||
    departmentId <= 0 ||
    !Number.isInteger(departmentId)
  ) {
    return next(new BadRequestError("Invalid department ID. Must be a positive integer."));
  }
  next();
}
