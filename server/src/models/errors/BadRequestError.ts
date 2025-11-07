import { AppError } from "@errors/AppError";

export class BadRequest extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "BadRequest";
  }
}
