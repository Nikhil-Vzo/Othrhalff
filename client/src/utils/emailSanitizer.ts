/**
 * Email Sanitizer & Validation Utility
 *
 * Prevents deliverability penalties, hard bounces, and bot attacks by:
 * 1. Sanitizing whitespace, unicode formatting, and lowercasing.
 * 2. Blocking known disposable / temporary / burner email domains.
 * 3. Detecting and suggesting fixes for common domain typos (e.g., gmai.com -> gmail.com).
 * 4. Strict syntax validation to ensure RFC-compliant format before triggering SMTP/Supabase.
 */

// Common domain typo correction mapping
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmaio.com': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmaill.co': 'gmail.com',
  'gmaill.in': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cpm': 'gmail.com',
  'gmail.vom': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gamail.com': 'gmail.com',
  'gmaiil.com': 'gmail.com',

  // Hotmail / Outlook typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotamail.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmaik.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'msnn.com': 'msn.com',
  'livee.com': 'live.com',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'ymail.con': 'ymail.com',

  // iCloud / Apple typos
  'iclud.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'iclou.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.con': 'icloud.com',

  // Proton typos
  'prton.me': 'proton.me',
  'prtonmail.com': 'protonmail.com',
  'protomail.com': 'protonmail.com',
  'protonmai.com': 'protonmail.com',

  // Rediffmail typos
  'redifmail.com': 'rediffmail.com',
  'rediffmai.com': 'rediffmail.com',
  'redifffmail.com': 'rediffmail.com',
};

// Known high-volume disposable / temporary email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  '20minutemail.com',
  'burnermail.io',
  'crazymailing.com',
  'dispostable.com',
  'dropmail.me',
  'fakemailgenerator.com',
  'generator.email',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'inboxkitten.com',
  'internxt.com',
  'mailcatch.com',
  'mailinator.com',
  'mailnesia.com',
  'mohmal.com',
  'mytemp.email',
  'nada.ltd',
  'nada.pro',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
  'mytempemail.com',
  'tempinbox.com',
  'disposablemail.com',
  'temporarymail.com',
  'fakemail.net',
  'disposableemailaddress.com',
  'mailnull.com',
  'maildrop.cc',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
]);

export interface EmailValidationResult {
  isValid: boolean;
  cleanEmail: string;
  domain?: string;
  error?: string;
  suggestion?: string;
  isDisposable?: boolean;
}

/**
 * Sanitizes input text into a clean, normalized email address
 */
export function sanitizeEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  return rawEmail
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Strip zero-width invisible characters
}

/**
 * Validates syntax, checks for disposable providers, and detects common domain typos
 */
export function validateEmail(rawEmail: string): EmailValidationResult {
  const cleanEmail = sanitizeEmail(rawEmail);

  if (!cleanEmail) {
    return {
      isValid: false,
      cleanEmail: '',
      error: 'Please enter your email address.',
    };
  }

  // Length limits per RFC 5321
  if (cleanEmail.length > 254) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Email address is too long (maximum 254 characters).',
    };
  }

  // RFC-compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Invalid email format.',
    };
  }

  const [localPart, domain] = parts;

  // Local part length check (max 64 chars)
  if (localPart.length > 64) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Email username is too long.',
    };
  }

  // Top level domain (TLD) minimum length check
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Email domain is missing a valid extension (e.g. .com, .edu).',
    };
  }

  // Check for disposable / burner domain
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      cleanEmail,
      domain,
      isDisposable: true,
      error: 'Temporary/disposable email addresses are not supported. Please use your personal or university email.',
    };
  }

  // Check for common typo suggestions
  let suggestion: string | undefined;
  if (COMMON_DOMAIN_TYPOS[domain]) {
    suggestion = `${localPart}@${COMMON_DOMAIN_TYPOS[domain]}`;
  }

  return {
    isValid: true,
    cleanEmail,
    domain,
    suggestion,
  };
}
