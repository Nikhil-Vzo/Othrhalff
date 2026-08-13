export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  reasons: {
    length: boolean;
    format: boolean;
    noConsecutiveDots: boolean;
    validStartEnd: boolean;
  };
}

export const sanitizeUsername = (raw: string): string => {
  if (!raw) return '';
  return raw.toLowerCase().replace(/[^a-z0-9_.]/g, '');
};

export const validateUsernameRules = (username: string): UsernameValidationResult => {
  const sanitized = sanitizeUsername(username);
  const length = sanitized.length >= 1 && sanitized.length <= 30;
  const format = /^[a-z0-9_.]+$/.test(sanitized);
  const noConsecutiveDots = !/\.\./.test(sanitized);
  const validStartEnd = !/^\./.test(sanitized) && !/\.$/.test(sanitized);

  const isValid = length && format && noConsecutiveDots && validStartEnd;

  let error: string | undefined;
  if (!length) error = 'Username must be between 1 and 30 characters.';
  else if (!format) error = 'Only lowercase letters, numbers, underscores, and dots are allowed.';
  else if (!noConsecutiveDots) error = 'Username cannot contain consecutive dots (..).';
  else if (!validStartEnd) error = 'Username cannot start or end with a dot.';

  return {
    isValid,
    error,
    reasons: {
      length,
      format,
      noConsecutiveDots,
      validStartEnd
    }
  };
};
