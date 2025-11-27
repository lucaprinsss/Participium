import * as path from 'path';

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
        provider: 'local',
        local: { uploadDir: 'uploads', reportsDir: 'reports' },
        r2: { endpoint: '', accessKeyId: '', secretAccessKey: '', bucket: 'b', region: 'auto', publicUrl: '' },
      },
      validateStorageConfig: jest.fn(),
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
    expect(result).toBe(`reports/123/${expectedFilename}`);
  });

  it('deletes local report photos directory if exists', async () => {
    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        provider: 'local',
        local: { uploadDir: 'uploads', reportsDir: 'reports' },
        r2: { endpoint: '', accessKeyId: '', secretAccessKey: '', bucket: 'b', region: 'auto', publicUrl: '' },
      },
      validateStorageConfig: jest.fn(),
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

describe('StorageService (R2 provider)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('uploads photo to R2 using publicUrl when configured', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1717171717171);
    jest.doMock('crypto', () => ({ randomBytes: () => Buffer.from('1234567890abcdef', 'utf8') }));

    const send = jest.fn().mockResolvedValue(undefined);
    const PutObjectCommand = jest.fn().mockImplementation((args) => args);
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send })),
      PutObjectCommand,
      DeleteObjectCommand: jest.fn(),
    }));

    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        provider: 'r2',
        local: { uploadDir: 'uploads', reportsDir: 'reports' },
        r2: {
          endpoint: 'https://r2.example',
          accessKeyId: 'AK',
          secretAccessKey: 'SK',
          bucket: 'bucket',
          region: 'auto',
          publicUrl: 'https://cdn.example',
        },
      },
      validateStorageConfig: jest.fn(),
    }));

    const { storageService } = await import('../../../services/storageService');
    const buffer = Buffer.from('abc');
    const result = await storageService.uploadPhoto(buffer, 'image/jpeg', 123);

    const expectedKey = `reports/123/1717171717171-31323334353637383930616263646566.jpg`;
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ Bucket: 'bucket', Key: expectedKey, Body: buffer, ContentType: 'image/jpeg' }));
    expect(result).toBe(`https://cdn.example/${expectedKey}`);
  });

  it('uploads to R2 and returns key when publicUrl not set', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1717171717171);
    jest.doMock('crypto', () => ({ randomBytes: () => Buffer.from('1234567890abcdef', 'utf8') }));

    const send = jest.fn().mockResolvedValue(undefined);
    const PutObjectCommand = jest.fn().mockImplementation((args) => args);
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send })),
      PutObjectCommand,
      DeleteObjectCommand: jest.fn(),
    }));

    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        provider: 'r2',
        local: { uploadDir: 'uploads', reportsDir: 'reports' },
        r2: {
          endpoint: 'https://r2.example',
          accessKeyId: 'AK',
          secretAccessKey: 'SK',
          bucket: 'bucket',
          region: 'auto',
          publicUrl: '',
        },
      },
      validateStorageConfig: jest.fn(),
    }));

    const { storageService } = await import('../../../services/storageService');
    const buffer = Buffer.from('abc');
    const result = await storageService.uploadPhoto(buffer, 'image/webp', 123);

    const expectedKey = `reports/123/1717171717171-31323334353637383930616263646566.webp`;
    expect(result).toBe(expectedKey);
  });

  it('deleteReportPhotos warns for R2 provider', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.doMock('../../../config/storage', () => ({
      storageConfig: {
        provider: 'r2',
        local: { uploadDir: 'uploads', reportsDir: 'reports' },
        r2: {
          endpoint: 'https://r2.example',
          accessKeyId: 'AK',
          secretAccessKey: 'SK',
          bucket: 'bucket',
          region: 'auto',
          publicUrl: 'https://cdn.example',
        },
      },
      validateStorageConfig: jest.fn(),
    }));

    const { storageService } = await import('../../../services/storageService');
    await storageService.deleteReportPhotos(123);
    expect(warn).toHaveBeenCalled();
  });
});

