import { parseAndValidateId } from '@utils/idValidationUtils';
import { BadRequestError } from '@errors/BadRequestError';

describe('parseAndValidateId', () => {
  it('should parse a valid integer string', () => {
    expect(parseAndValidateId('42')).toBe(42);
  });

  it('should throw BadRequestError for decimal id', () => {
    expect(() => parseAndValidateId('3.14')).toThrow(BadRequestError);
  });

  it('should throw BadRequestError for NaN', () => {
    expect(() => parseAndValidateId('abc')).toThrow(BadRequestError);
  });

  it('should throw BadRequestError for zero', () => {
    expect(() => parseAndValidateId('0')).toThrow(BadRequestError);
  });

  it('should throw BadRequestError for negative number', () => {
    expect(() => parseAndValidateId('-5')).toThrow(BadRequestError);
  });

  it('should throw BadRequestError for non-integer string', () => {
    expect(() => parseAndValidateId('7.0')).toThrow(BadRequestError);
  });

  it('should use custom resourceName in error message', () => {
    try {
      parseAndValidateId('abc', 'user');
    } catch (e: any) {
      expect(e).toBeInstanceOf(BadRequestError);
      expect(e.message).toContain('user ID');
    }
  });
});
