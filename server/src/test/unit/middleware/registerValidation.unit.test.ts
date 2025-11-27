import { validateRegisterInput } from '../../../middleware/registerUserMiddleware';
import { Request, Response } from 'express';

describe('validateRegisterInput middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 400 if first_name is missing', () => {
    req.body = { last_name: 'Rossi', email: 'a@b.it', username: 'user', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/first name/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if last_name is missing', () => {
    req.body = { first_name: 'Mario', email: 'a@b.it', username: 'user', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/last name/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if email is missing', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', username: 'user', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/email/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if email is invalid', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', email: 'invalid', username: 'user', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/valid email/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if username is too short', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', email: 'a@b.it', username: 'ab', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/at least 3 characters/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if password is too short', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', email: 'a@b.it', username: 'user', password: '123', confirmPassword: '123' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/at least 6 characters/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if passwords do not match', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', email: 'a@b.it', username: 'user', password: 'Password123!', confirmPassword: 'Different123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/passwords do not match/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with no error for valid input', () => {
    req.body = { first_name: 'Mario', last_name: 'Rossi', email: 'a@b.it', username: 'user', password: 'Password123!', confirmPassword: 'Password123!' };
    validateRegisterInput(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
