import { Request, Response, NextFunction } from 'express';

export function validateRegisterInput(req: Request, res: Response, next: NextFunction) {
  const { first_name, last_name, email, username, password, confirmPassword } = req.body;

  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return res.status(400).json({ message: 'Please enter your first name' });
  }
  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    return res.status(400).json({ message: 'Please enter your last name' });
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'Please enter your email' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ message: 'Please enter a username' });
  }
  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long' });
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ message: 'Please enter a password' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  next();
}
