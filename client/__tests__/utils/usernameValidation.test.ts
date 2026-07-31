import { sanitizeUsername, validateUsernameRules } from '../../src/utils/usernameValidation';

describe('usernameValidation', () => {
  it('sanitizes raw username strings correctly', () => {
    expect(sanitizeUsername('JohnDoe_123!')).toBe('johndoe_123');
    expect(sanitizeUsername('User.Name#1')).toBe('user.name1');
    expect(sanitizeUsername('')).toBe('');
  });

  it('validates a valid username', () => {
    const result = validateUsernameRules('student_alex.99');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.reasons.length).toBe(true);
    expect(result.reasons.format).toBe(true);
    expect(result.reasons.noConsecutiveDots).toBe(true);
    expect(result.reasons.validStartEnd).toBe(true);
  });

  it('rejects consecutive dots', () => {
    const result = validateUsernameRules('alex..smith');
    expect(result.isValid).toBe(false);
    expect(result.reasons.noConsecutiveDots).toBe(false);
  });

  it('rejects leading or trailing dots', () => {
    const startResult = validateUsernameRules('.alexsmith');
    expect(startResult.isValid).toBe(false);
    expect(startResult.reasons.validStartEnd).toBe(false);

    const endResult = validateUsernameRules('alexsmith.');
    expect(endResult.isValid).toBe(false);
    expect(endResult.reasons.validStartEnd).toBe(false);
  });

  it('rejects empty or over 30 chars username', () => {
    const emptyResult = validateUsernameRules('');
    expect(emptyResult.isValid).toBe(false);

    const longResult = validateUsernameRules('a'.repeat(31));
    expect(longResult.isValid).toBe(false);
    expect(longResult.reasons.length).toBe(false);
  });
});
