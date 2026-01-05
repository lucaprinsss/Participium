import { saveBase64Image, deleteImage } from '@utils/fileUploadUtils';
import { BadRequestError } from '@models/errors/BadRequestError';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FileUploadUtils Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBase64Image', () => {
    const validJpegBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const validGifBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const validWebpBase64 = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    
    beforeEach(() => {
      // Mock fs methods
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.writeFileSync.mockImplementation(() => undefined);
    });

    it('should save a valid JPEG image', async () => {
      const userId = 123;
      const result = await saveBase64Image(validJpegBase64, userId);

      expect(result).toBe('/uploads/photos/user_123_profile.jpg');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('user_123_profile.jpg'),
        expect.any(Buffer)
      );
    });

    it('should save a valid PNG image', async () => {
      const userId = 456;
      const result = await saveBase64Image(validPngBase64, userId);

      expect(result).toBe('/uploads/photos/user_456_profile.png');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should save a valid GIF image', async () => {
      const userId = 789;
      const result = await saveBase64Image(validGifBase64, userId);

      expect(result).toBe('/uploads/photos/user_789_profile.gif');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should save a valid WebP image', async () => {
      const userId = 999;
      const result = await saveBase64Image(validWebpBase64, userId);

      expect(result).toBe('/uploads/photos/user_999_profile.webp');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('should handle image/jpg MIME type and convert to jpg extension', async () => {
      const jpgBase64 = 'data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const userId = 111;
      const result = await saveBase64Image(jpgBase64, userId);

      expect(result).toBe('/uploads/photos/user_111_profile.jpg');
    });

    it('should create upload directory if it does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      const userId = 123;

      await saveBase64Image(validJpegBase64, userId);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'photos')),
        { recursive: true }
      );
    });

    it('should not create directory if it already exists', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      const userId = 123;

      await saveBase64Image(validJpegBase64, userId);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid base64 format - missing data prefix', async () => {
      const invalidBase64 = 'invalidbase64string';
      const userId = 123;

      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow('Invalid base64 image format');
    });

    it('should throw BadRequestError for invalid base64 format - missing semicolon', async () => {
      const invalidBase64 = 'data:image/jpegbase64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const userId = 123;

      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow('Invalid base64 image format');
    });

    it('should throw BadRequestError for invalid base64 format - missing comma', async () => {
      const invalidBase64 = 'data:image/jpeg;base64/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const userId = 123;

      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(invalidBase64, userId)).rejects.toThrow('Invalid base64 image format');
    });

    it('should throw BadRequestError for invalid MIME type', async () => {
      const invalidMimeBase64 = 'data:application/pdf;base64,JVBERi0xLjQK';
      const userId = 123;

      await expect(saveBase64Image(invalidMimeBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(invalidMimeBase64, userId)).rejects.toThrow('Invalid image type');
    });

    it('should throw BadRequestError for text/plain MIME type', async () => {
      const textBase64 = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
      const userId = 123;

      await expect(saveBase64Image(textBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(textBase64, userId)).rejects.toThrow('Invalid image type');
    });

    it('should throw BadRequestError for image that exceeds size limit', async () => {
      // Create a base64 string that will result in >5MB buffer
      const largeBase64Data = 'A'.repeat(7 * 1024 * 1024); // ~7MB when decoded
      const largeImageBase64 = `data:image/jpeg;base64,${largeBase64Data}`;
      const userId = 123;

      await expect(saveBase64Image(largeImageBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(largeImageBase64, userId)).rejects.toThrow('Image too large');
    });

    it('should accept image at exactly 5MB size limit', async () => {
      // Create a base64 string that results in exactly 5MB
      const fiveMBData = 'A'.repeat((5 * 1024 * 1024 * 4) / 3); // base64 is 4/3 of original
      const exactSizeBase64 = `data:image/jpeg;base64,${fiveMBData}`;
      const userId = 123;

      // This should not throw
      await expect(saveBase64Image(exactSizeBase64, userId)).resolves.toBeDefined();
    });

    it('should throw BadRequestError when writeFileSync fails', async () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });
      const userId = 123;

      await expect(saveBase64Image(validJpegBase64, userId)).rejects.toThrow(BadRequestError);
      await expect(saveBase64Image(validJpegBase64, userId)).rejects.toThrow('Failed to save image');
    });

    it('should handle write errors with console.error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });
      const userId = 123;

      await expect(saveBase64Image(validJpegBase64, userId)).rejects.toThrow(BadRequestError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving image:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should use correct file path format', async () => {
      const userId = 123;
      await saveBase64Image(validJpegBase64, userId);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/uploads[\/\\]photos[\/\\]user_123_profile\.jpg$/),
        expect.any(Buffer)
      );
    });

    it('should decode base64 data correctly into buffer', async () => {
      const userId = 123;
      await saveBase64Image(validJpegBase64, userId);

      const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
      const buffer = writeCall[1];
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockImplementation(() => undefined);
    });

    it('should delete an existing image file', () => {
      const photoUrl = '/uploads/photos/user_123_profile.jpg';
      
      deleteImage(photoUrl);

      expect(mockedFs.existsSync).toHaveBeenCalledWith(
        expect.stringMatching(/uploads[\/\\]photos[\/\\]user_123_profile\.jpg$/)
      );
      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringMatching(/uploads[\/\\]photos[\/\\]user_123_profile\.jpg$/)
      );
    });

    it('should not throw error if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      const photoUrl = '/uploads/photos/nonexistent.jpg';

      expect(() => deleteImage(photoUrl)).not.toThrow();
      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle deletion errors without throwing', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const photoUrl = '/uploads/photos/user_123_profile.jpg';

      // Should not throw
      expect(() => deleteImage(photoUrl)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting image:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should construct correct file path from relative URL', () => {
      const photoUrl = '/uploads/photos/test_image.png';
      
      deleteImage(photoUrl);

      expect(mockedFs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads')
      );
    });

    it('should handle different image extensions', () => {
      const extensions = ['jpg', 'png', 'gif', 'webp'];
      
      extensions.forEach(ext => {
        jest.clearAllMocks();
        const photoUrl = `/uploads/photos/user_123_profile.${ext}`;
        
        deleteImage(photoUrl);
        
        expect(mockedFs.existsSync).toHaveBeenCalled();
        expect(mockedFs.unlinkSync).toHaveBeenCalled();
      });
    });

    it('should handle nested paths', () => {
      const photoUrl = '/uploads/photos/subfolder/user_456_profile.jpg';
      
      deleteImage(photoUrl);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should not call unlinkSync if file check throws error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      const photoUrl = '/uploads/photos/user_123_profile.jpg';

      expect(() => deleteImage(photoUrl)).not.toThrow();
      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});
