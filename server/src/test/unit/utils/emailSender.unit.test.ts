import nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Set up mock before any module imports
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
const mockTransporter = {
  sendMail: mockSendMail,
};
mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

// Now import the module that uses nodemailer
import { sendVerificationEmail } from '@utils/emailSender';

describe('EmailSender Unit Tests', () => {
  beforeAll(() => {
    process.env.EMAIL_USER = 'test.user@example.com';
  });

  beforeEach(() => {
    mockSendMail.mockClear();
  });

  afterEach(() => {
    // jest.clearAllMocks(); // This was clearing the createTransport call which happens on module load.
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const to = 'test@example.com';
      const verificationToken = 'test-token-123';

      await sendVerificationEmail(to, verificationToken);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const received = mockSendMail.mock.calls[0][0];

      expect(received.from).toBe(`"Participium Team" <${process.env.EMAIL_USER}>`);
      expect(received.to).toBe(to);
      expect(received.subject).toBe('Verify your email for Participium');
      expect(received.html).toContain(verificationToken);
    });

    it('should include verification token in email body', async () => {
      const to = 'test@example.com';
      const verificationToken = 'unique-token-456';

      await sendVerificationEmail(to, verificationToken);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(verificationToken);
    });

    it('should handle email sending errors', async () => {
      const to = 'test@example.com';
      const verificationToken = 'test-token';

      mockSendMail.mockImplementationOnce(() => Promise.reject(new Error('SMTP error')));
      await expect(sendVerificationEmail(to, verificationToken)).rejects.toThrow('SMTP error');
    });

    it('should use correct email format', async () => {
      const to = 'test@example.com';
      const verificationToken = 'token';

      await sendVerificationEmail(to, verificationToken);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe(to);
      expect(callArgs.from).toBeDefined();
      expect(callArgs.subject).toBeDefined();
      expect(callArgs.html).toBeDefined();
    });
  });

  describe('Transporter Configuration', () => {
    it('should create transporter on module load', () => {
      jest.resetModules();
      const nodemailer = require('nodemailer');
      (nodemailer.createTransport as jest.Mock).mockClear(); // Clear any previous calls

      // Now, when we require the module, createTransport should be called.
      require('@utils/emailSender');

      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });
  
});
