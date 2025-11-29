import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";

export function validateRoleId(req: Request, res: Response, next: NextFunction) {
  const { roleId } = req.params;
  const id = Number(roleId);
  if (
    roleId.includes('.') ||
    Number.isNaN(id) ||
    id <= 0 ||
    !Number.isInteger(id)
  ) {
    return next(new BadRequestError("Invalid role ID. Must be a positive integer."));
  }
  next();
}
