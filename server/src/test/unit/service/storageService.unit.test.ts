import * as path from 'node:path';

describe('StorageService (local provider)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
      PutObjectCommand: jest.fn(),
      DeleteObjectCommand: jest.fn(),
    }));
  });

  it('uploads photo to local and returns relative path', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1717171717171);
    jest.doMock('crypto', () => ({ randomBytes: () => Buffer.from('1234567890abcdef', 'utf8') }));
    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        uploadDir: 'uploads',
        reportsDir: 'reports',
      },
    }));

    const writeFile = jest.fn().mockResolvedValue(undefined);
    const existsSync = jest.fn().mockReturnValue(false);
    const mkdirSync = jest.fn();

    jest.doMock('fs', () => ({
      existsSync,
      mkdirSync,
      promises: { writeFile },
    }));

    const { storageService } = await import('../../../services/storageService');
    const buffer = Buffer.from('abc');
    const result = await storageService.uploadPhoto(buffer, 'image/png', 123);

    const expectedFilename = `1717171717171-31323334353637383930616263646566.png`;
    const expectedDir = path.join(process.cwd(), 'uploads', 'reports', '123');
    expect(existsSync).toHaveBeenCalledWith(expectedDir);
    expect(mkdirSync).toHaveBeenCalledWith(expectedDir, { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(path.join(expectedDir, expectedFilename), buffer);
    expect(result).toBe(`/uploads/reports/123/${expectedFilename}`);
  });

  it('deletes local report photos directory if exists', async () => {
    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        uploadDir: 'uploads',
        reportsDir: 'reports',
      },
    }));

    const rm = jest.fn().mockResolvedValue(undefined);
    const existsSync = jest.fn().mockReturnValue(true);

    jest.doMock('fs', () => ({
      existsSync,
      promises: { rm },
    }));

    const { storageService } = await import('../../../services/storageService');
    await storageService.deleteReportPhotos(123);
    const expectedDir = path.join(process.cwd(), 'uploads', 'reports', '123');
    expect(rm).toHaveBeenCalledWith(expectedDir, { recursive: true, force: true });
  });
});
