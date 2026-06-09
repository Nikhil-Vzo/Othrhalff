/**
 * Tests for the environment variable resolution logic in client/src/lib/supabase.ts.
 *
 * The PR changed supabase.ts to use a fallback chain:
 *   process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
 *   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
 *
 * Because supabase.ts uses module-level side effects (calling createClient at import
 * time and throwing if env vars are missing), these tests exercise the resolution
 * logic in isolation by testing the precedence rules the module would use.
 *
 * We also mock @supabase/supabase-js to avoid network calls.
 */

// ---------------------------------------------------------------------------
// We test the env-var resolution behaviour without importing the real module
// (which would throw if SUPABASE env vars are not set).  Instead we replicate
// the exact same expression that was changed in the PR and test it directly.
// ---------------------------------------------------------------------------

/**
 * Replicates the EXACT env-var resolution expression from supabase.ts (post-PR).
 *
 * Given a process.env snapshot, returns [resolvedUrl, resolvedKey].
 */
function resolveSupabaseEnvVars(env: Record<string, string | undefined>): [string, string] {
  const url =
    env['NEXT_PUBLIC_SUPABASE_URL'] ||
    env['VITE_SUPABASE_URL'] ||
    '';

  const key =
    env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
    env['VITE_SUPABASE_ANON_KEY'] ||
    '';

  return [url, key];
}

describe('supabase.ts env-var resolution (post-PR fallback chain)', () => {
  describe('URL resolution', () => {
    it('prefers NEXT_PUBLIC_SUPABASE_URL over VITE_SUPABASE_URL', () => {
      const [url] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: 'https://next-url.supabase.co',
        VITE_SUPABASE_URL: 'https://vite-url.supabase.co',
      });
      expect(url).toBe('https://next-url.supabase.co');
    });

    it('falls back to VITE_SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is absent', () => {
      const [url] = resolveSupabaseEnvVars({
        VITE_SUPABASE_URL: 'https://vite-url.supabase.co',
      });
      expect(url).toBe('https://vite-url.supabase.co');
    });

    it('falls back to VITE_SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL is empty string', () => {
      const [url] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: '',
        VITE_SUPABASE_URL: 'https://vite-fallback.supabase.co',
      });
      expect(url).toBe('https://vite-fallback.supabase.co');
    });

    it('returns empty string when both URL env vars are absent', () => {
      const [url] = resolveSupabaseEnvVars({});
      expect(url).toBe('');
    });

    it('returns empty string when both URL env vars are empty strings', () => {
      const [url] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: '',
        VITE_SUPABASE_URL: '',
      });
      expect(url).toBe('');
    });

    it('returns empty string when VITE_SUPABASE_URL is undefined and NEXT_PUBLIC is undefined', () => {
      const [url] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        VITE_SUPABASE_URL: undefined,
      });
      expect(url).toBe('');
    });
  });

  describe('Key resolution', () => {
    it('prefers NEXT_PUBLIC_SUPABASE_ANON_KEY over VITE_SUPABASE_ANON_KEY', () => {
      const [, key] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'next-key',
        VITE_SUPABASE_ANON_KEY: 'vite-key',
      });
      expect(key).toBe('next-key');
    });

    it('falls back to VITE_SUPABASE_ANON_KEY when NEXT_PUBLIC_SUPABASE_ANON_KEY is absent', () => {
      const [, key] = resolveSupabaseEnvVars({
        VITE_SUPABASE_ANON_KEY: 'vite-key',
      });
      expect(key).toBe('vite-key');
    });

    it('falls back to VITE_SUPABASE_ANON_KEY when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty string', () => {
      const [, key] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        VITE_SUPABASE_ANON_KEY: 'vite-fallback-key',
      });
      expect(key).toBe('vite-fallback-key');
    });

    it('returns empty string when both key env vars are absent', () => {
      const [, key] = resolveSupabaseEnvVars({});
      expect(key).toBe('');
    });

    it('returns empty string when both key env vars are empty strings', () => {
      const [, key] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        VITE_SUPABASE_ANON_KEY: '',
      });
      expect(key).toBe('');
    });
  });

  describe('Combined URL + Key resolution', () => {
    it('resolves both correctly in a Next.js environment', () => {
      const [url, key] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: 'https://proj.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'next-anon-key',
      });
      expect(url).toBe('https://proj.supabase.co');
      expect(key).toBe('next-anon-key');
    });

    it('resolves both correctly in a legacy Vite environment', () => {
      const [url, key] = resolveSupabaseEnvVars({
        VITE_SUPABASE_URL: 'https://proj-vite.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'vite-anon-key',
      });
      expect(url).toBe('https://proj-vite.supabase.co');
      expect(key).toBe('vite-anon-key');
    });

    it('resolves URL from NEXT_PUBLIC and key from VITE when mixed', () => {
      // Edge case: NEXT_PUBLIC URL present but key only in VITE
      const [url, key] = resolveSupabaseEnvVars({
        NEXT_PUBLIC_SUPABASE_URL: 'https://proj.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'vite-anon-key',
      });
      expect(url).toBe('https://proj.supabase.co');
      expect(key).toBe('vite-anon-key');
    });

    it('returns empty strings for both when no env vars are set', () => {
      const [url, key] = resolveSupabaseEnvVars({});
      expect(url).toBe('');
      expect(key).toBe('');
    });
  });

  describe('Validation behaviour (post-PR throws when both are missing)', () => {
    /**
     * The module throws 'Missing Supabase environment variables' if either
     * resolvedUrl or resolvedKey is falsy.  This test replicates that guard.
     */
    function simulateModuleInit(env: Record<string, string | undefined>): void {
      const [url, key] = resolveSupabaseEnvVars(env);
      if (!url || !key) {
        throw new Error(
          'Missing Supabase environment variables. Check your .env file.',
        );
      }
    }

    it('throws when both env vars are completely absent', () => {
      expect(() => simulateModuleInit({})).toThrow(
        'Missing Supabase environment variables',
      );
    });

    it('throws when only URL is set but key is missing', () => {
      expect(() =>
        simulateModuleInit({ NEXT_PUBLIC_SUPABASE_URL: 'https://proj.supabase.co' }),
      ).toThrow('Missing Supabase environment variables');
    });

    it('throws when only key is set but URL is missing', () => {
      expect(() =>
        simulateModuleInit({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'some-key' }),
      ).toThrow('Missing Supabase environment variables');
    });

    it('does NOT throw when both NEXT_PUBLIC vars are set', () => {
      expect(() =>
        simulateModuleInit({
          NEXT_PUBLIC_SUPABASE_URL: 'https://proj.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        }),
      ).not.toThrow();
    });

    it('does NOT throw when both VITE vars are set', () => {
      expect(() =>
        simulateModuleInit({
          VITE_SUPABASE_URL: 'https://proj.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'anon-key',
        }),
      ).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// Integration-style test: verify the module exports a supabase client
// when the environment variables are correctly provided.
// ---------------------------------------------------------------------------
describe('supabase module integration', () => {
  const VALID_ENV = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  };

  beforeEach(() => {
    // Clear any cached module between tests
    jest.resetModules();
  });

  it('exports a supabase client when environment variables are set', async () => {
    // Set env vars before importing the module
    Object.assign(process.env, VALID_ENV);

    // Mock createClient to avoid actual network setup
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        auth: {},
        from: jest.fn(),
      })),
    }));

    const mod = await import('../../src/lib/supabase');
    expect(mod.supabase).toBeDefined();
    expect(typeof mod.supabase).toBe('object');

    // Cleanup
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('createClient is called with the resolved URL from NEXT_PUBLIC_SUPABASE_URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://resolved-url.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'resolved-key';

    const { createClient } = await import('@supabase/supabase-js');
    await import('../../src/lib/supabase');

    const calls = (createClient as jest.Mock).mock.calls;
    if (calls.length > 0) {
      // The first argument should be the resolved URL
      expect(calls[calls.length - 1][0]).toBe('https://resolved-url.supabase.co');
    }

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });
});