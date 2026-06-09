/**
 * Tests for Next.js page metadata exports.
 *
 * The PR added metadata exports to several Next.js App Router pages.
 * These tests verify that each page exports the correct title, description,
 * and optional OpenGraph fields.
 *
 * All heavy dependencies are mocked so that supabase, sockets, and
 * context providers do not interfere.
 */

// ---------------------------------------------------------------------------
// Mock all dependencies that would otherwise cause side effects at import time
// ---------------------------------------------------------------------------
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) },
  },
}));

jest.mock('../../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isAuthenticated: false, isLoading: false, currentUser: null }),
}));

jest.mock('../../src/context/PresenceContext', () => ({
  PresenceProvider: ({ children }: { children: React.ReactNode }) => children,
  usePresence: () => ({}),
}));

jest.mock('../../src/context/CallContext', () => ({
  CallProvider: ({ children }: { children: React.ReactNode }) => children,
  useCall: () => ({}),
}));

jest.mock('../../src/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/views/Landing', () => ({
  Landing: () => null,
}));

jest.mock('../../src/views/Blog', () => ({
  Blog: () => null,
}));

jest.mock('../../src/views/StaticPages', () => ({
  About: () => null,
  Privacy: () => null,
  Terms: () => null,
  Safety: () => null,
  Guidelines: () => null,
}));

jest.mock('../../src/views/Careers', () => ({
  Careers: () => null,
}));

jest.mock('../../src/services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(() => null),
    logout: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import pages AFTER all mocks are set up
// ---------------------------------------------------------------------------
import { metadata as rootMetadata } from '../../app/page';
import { metadata as aboutMetadata } from '../../app/about/page';
import { metadata as blogMetadata } from '../../app/blog/page';
import { metadata as careersMetadata } from '../../app/careers/page';
import { metadata as layoutMetadata } from '../../app/layout';

// Type alias for convenience
type OGMeta = { title?: string; description?: string; images?: string[] };

// ---------------------------------------------------------------------------
// Root page metadata tests
// ---------------------------------------------------------------------------
describe('Root page metadata (client/app/page.tsx)', () => {
  it('exports a metadata object', () => {
    expect(rootMetadata).toBeDefined();
  });

  it('has a title', () => {
    expect(rootMetadata.title).toBeTruthy();
  });

  it('has the correct title', () => {
    expect(rootMetadata.title).toBe('OthrHalff - Where anonymous meets destiny.');
  });

  it('has a description', () => {
    expect(rootMetadata.description).toBeTruthy();
  });

  it('description mentions university students', () => {
    expect((rootMetadata.description as string).toLowerCase()).toContain('university');
  });

  it('description mentions anonymous dating', () => {
    expect((rootMetadata.description as string).toLowerCase()).toContain('anonymous');
  });

  it('has openGraph metadata', () => {
    expect(rootMetadata.openGraph).toBeDefined();
  });

  it('openGraph has a title', () => {
    const og = rootMetadata.openGraph as OGMeta;
    expect(og.title).toBeTruthy();
  });

  it('openGraph title mentions OthrHalff', () => {
    const og = rootMetadata.openGraph as OGMeta;
    expect(og.title).toContain('OthrHalff');
  });

  it('openGraph has a description', () => {
    const og = rootMetadata.openGraph as OGMeta;
    expect(og.description).toBeTruthy();
  });

  it('openGraph includes an image array', () => {
    const og = rootMetadata.openGraph as OGMeta;
    expect(og.images).toBeDefined();
    const images = og.images as string[];
    expect(images.length).toBeGreaterThan(0);
  });

  it('openGraph image references the blog home-screen', () => {
    const og = rootMetadata.openGraph as OGMeta;
    const images = og.images as string[];
    expect(images[0]).toContain('home-screen.png');
  });

  it('openGraph image path starts with /', () => {
    const og = rootMetadata.openGraph as OGMeta;
    const images = og.images as string[];
    expect(images[0]).toMatch(/^\//);
  });
});

// ---------------------------------------------------------------------------
// About page metadata tests
// ---------------------------------------------------------------------------
describe('About page metadata (client/app/about/page.tsx)', () => {
  it('exports a metadata object', () => {
    expect(aboutMetadata).toBeDefined();
  });

  it('has a title', () => {
    expect(aboutMetadata.title).toBeTruthy();
  });

  it('title references OthrHalff', () => {
    expect((aboutMetadata.title as string)).toContain('OthrHalff');
  });

  it('has a description', () => {
    expect(aboutMetadata.description).toBeTruthy();
  });

  it('description mentions campus', () => {
    expect((aboutMetadata.description as string).toLowerCase()).toContain('campus');
  });

  it('description mentions connection', () => {
    expect((aboutMetadata.description as string).toLowerCase()).toContain('connect');
  });

  it('does not include openGraph (simple informational page)', () => {
    expect((aboutMetadata as Record<string, unknown>).openGraph).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Blog page metadata tests
// ---------------------------------------------------------------------------
describe('Blog page metadata (client/app/blog/page.tsx)', () => {
  it('exports a metadata object', () => {
    expect(blogMetadata).toBeDefined();
  });

  it('has a title', () => {
    expect(blogMetadata.title).toBeTruthy();
  });

  it('title contains OthrHalff Blog', () => {
    expect((blogMetadata.title as string)).toContain('OthrHalff Blog');
  });

  it('has a description', () => {
    expect(blogMetadata.description).toBeTruthy();
  });

  it('description mentions engineering students or dorm room origin', () => {
    const desc = (blogMetadata.description as string).toLowerCase();
    expect(desc.includes('engineering') || desc.includes('dorm') || desc.includes('students')).toBe(true);
  });

  it('has openGraph metadata', () => {
    expect(blogMetadata.openGraph).toBeDefined();
  });

  it('openGraph has a title', () => {
    const og = blogMetadata.openGraph as OGMeta;
    expect(og.title).toBeTruthy();
  });

  it('openGraph title references origin story', () => {
    const og = blogMetadata.openGraph as OGMeta;
    expect((og.title as string).toLowerCase()).toContain('origin');
  });

  it('openGraph has a description', () => {
    const og = blogMetadata.openGraph as OGMeta;
    expect(og.description).toBeTruthy();
  });

  it('openGraph description is non-empty', () => {
    const og = blogMetadata.openGraph as OGMeta;
    expect((og.description as string).length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// Careers page metadata tests
// ---------------------------------------------------------------------------
describe('Careers page metadata (client/app/careers/page.tsx)', () => {
  it('exports a metadata object', () => {
    expect(careersMetadata).toBeDefined();
  });

  it('has a title', () => {
    expect(careersMetadata.title).toBeTruthy();
  });

  it('title contains OthrHalff', () => {
    expect((careersMetadata.title as string)).toContain('OthrHalff');
  });

  it('title mentions Careers', () => {
    expect((careersMetadata.title as string)).toContain('Careers');
  });

  it('has a description', () => {
    expect(careersMetadata.description).toBeTruthy();
  });

  it('description mentions team or crew', () => {
    const desc = (careersMetadata.description as string).toLowerCase();
    expect(desc.includes('team') || desc.includes('crew')).toBe(true);
  });

  it('description is meaningful (length > 20)', () => {
    expect((careersMetadata.description as string).length).toBeGreaterThan(20);
  });
});

// ---------------------------------------------------------------------------
// Layout metadata tests (client/app/layout.tsx)
// ---------------------------------------------------------------------------
describe('Layout metadata (client/app/layout.tsx)', () => {
  it('exports a metadata object', () => {
    expect(layoutMetadata).toBeDefined();
  });

  it('has a title', () => {
    expect(layoutMetadata.title).toBeTruthy();
  });

  it('title is OthrHalff', () => {
    expect(layoutMetadata.title).toBe('OthrHalff');
  });

  it('has a description', () => {
    expect(layoutMetadata.description).toBeTruthy();
  });

  it('description contains "anonymous"', () => {
    expect((layoutMetadata.description as string).toLowerCase()).toContain('anonymous');
  });

  it('description contains "destiny"', () => {
    expect((layoutMetadata.description as string).toLowerCase()).toContain('destiny');
  });
});