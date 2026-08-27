import { validateEmail, sanitizeEmail } from '../../src/utils/emailSanitizer';

describe('emailSanitizer', () => {
  describe('sanitizeEmail', () => {
    it('trims whitespace and converts to lowercase', () => {
      expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    });

    it('strips invisible zero-width characters', () => {
      const emailWithZeroWidth = 'user\u200B@gmail.com';
      expect(sanitizeEmail(emailWithZeroWidth)).toBe('user@gmail.com');
    });
  });

  describe('validateEmail', () => {
    it('accepts standard valid emails', () => {
      const result = validateEmail('student@harvard.edu');
      expect(result.isValid).toBe(true);
      expect(result.cleanEmail).toBe('student@harvard.edu');
      expect(result.suggestion).toBeUndefined();
    });

    it('detects common domain typos and suggests correct domain', () => {
      const result = validateEmail('student@gmai.com');
      expect(result.isValid).toBe(true);
      expect(result.suggestion).toBe('student@gmail.com');

      const yahooResult = validateEmail('alex@yaho.com');
      expect(yahooResult.isValid).toBe(true);
      expect(yahooResult.suggestion).toBe('alex@yahoo.com');

      const hotmailResult = validateEmail('user@hotmial.com');
      expect(hotmailResult.isValid).toBe(true);
      expect(hotmailResult.suggestion).toBe('user@hotmail.com');
    });

    it('blocks disposable burner emails', () => {
      const result = validateEmail('bot123@tempmail.com');
      expect(result.isValid).toBe(false);
      expect(result.isDisposable).toBe(true);
      expect(result.error).toContain('Temporary/disposable email');

      const mailinatorResult = validateEmail('spammer@mailinator.com');
      expect(mailinatorResult.isValid).toBe(false);
      expect(mailinatorResult.isDisposable).toBe(true);
    });

    it('rejects empty or malformed emails', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('not-an-email').isValid).toBe(false);
      expect(validateEmail('user@com').isValid).toBe(false);
      expect(validateEmail('user@.com').isValid).toBe(false);
    });
  });
});
