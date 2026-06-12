/**
 * Tests for the Next.js navigation pattern migration.
 *
 * The PR replaced react-router-dom's useNavigate/navigate() with
 * next/navigation's useRouter/router.push(). These tests verify the
 * new expected navigation patterns are consistent and correct.
 *
 * Because the actual page components have heavy dependencies (Supabase,
 * sockets, etc.) that make full rendering impractical in a unit-test
 * environment, these tests focus on:
 *
 *  1. Verifying that next/navigation is imported (not react-router-dom)
 *  2. Verifying the router.push() pattern is used for navigation
 *  3. Verifying router.back() is used instead of navigate(-1)
 *
 * We do this by reading the source code of each changed file and
 * asserting the presence / absence of specific patterns. This is a
 * lightweight but highly effective regression guard for the migration.
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '../../src/views');

function readPage(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8');
}

// ---------------------------------------------------------------------------
// Helper: assert file uses next/navigation, not react-router-dom
// ---------------------------------------------------------------------------
function assertNextNavigation(source: string, filename: string) {
  expect(source).not.toContain("from 'react-router-dom'");
  expect(source).not.toContain('from "react-router-dom"');

  // Should import from next/navigation
  const hasNextNavigation =
    source.includes("from 'next/navigation'") ||
    source.includes('from "next/navigation"') ||
    // Some files alias useRouter via "useRouter as useNavigate"
    source.includes('next/navigation');

  // Not all pages use navigation - only those that have navigation calls
  // We only assert this for pages that we know use navigation
  return hasNextNavigation;
}

// ---------------------------------------------------------------------------
// Helper: assert navigate(-1) was replaced by navigate.back() / router.back()
// ---------------------------------------------------------------------------
function assertNoNavigateMinusOne(source: string) {
  // navigate(-1) is the old react-router pattern
  expect(source).not.toMatch(/navigate\(-1\)/);
}

// ---------------------------------------------------------------------------
// Helper: assert navigate('/path') was replaced by navigate.push('/path')
// ---------------------------------------------------------------------------
function assertNavigatePushPattern(source: string) {
  // If the file calls navigate.push(), the pattern is correct
  // If it calls navigate('/path') directly, that's the old react-router pattern
  // Note: navigate.back() is also valid for navigate(-1) replacement
  const hasPushPattern =
    source.includes('navigate.push(') || source.includes('router.push(');
  const hasBackPattern =
    source.includes('navigate.back(') || source.includes('router.back(');

  // At least one navigation call should use the new pattern if navigation is used
  return { hasPushPattern, hasBackPattern };
}

// ---------------------------------------------------------------------------
// Blog.tsx
// ---------------------------------------------------------------------------
describe('Blog.tsx migration (src/views/Blog.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Blog.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports Link from next/link (not react-router-dom)', () => {
    expect(source).toContain("from 'next/link'");
  });

  it('uses Link href= attribute (not to=)', () => {
    // Next.js Link uses href, not to
    expect(source).not.toMatch(/<Link to=/);
    expect(source).toMatch(/<Link[^>]*href=/);
  });

  it('has "use client" directive (required for client-side features)', () => {
    expect(source).toContain('"use client"');
  });
});

// ---------------------------------------------------------------------------
// Careers.tsx
// ---------------------------------------------------------------------------
describe('Careers.tsx migration (src/views/Careers.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Careers.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports useRouter from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.back() instead of navigate(-1)', () => {
    assertNoNavigateMinusOne(source);
    expect(source).toContain('navigate.back()');
  });
});

// ---------------------------------------------------------------------------
// Chat.tsx
// ---------------------------------------------------------------------------
describe('Chat.tsx migration (src/views/Chat.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Chat.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() for programmatic navigation', () => {
    expect(source).toContain('navigate.push(');
  });

  it('does not use the old navigate(-1) pattern', () => {
    assertNoNavigateMinusOne(source);
  });
});

// ---------------------------------------------------------------------------
// Confessions.tsx
// ---------------------------------------------------------------------------
describe('Confessions.tsx migration (src/views/Confessions.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Confessions.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() to navigate home', () => {
    expect(source).toContain("navigate.push('/home')");
  });
});

// ---------------------------------------------------------------------------
// Contact.tsx
// ---------------------------------------------------------------------------
describe('Contact.tsx migration (src/views/Contact.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Contact.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.back() instead of navigate(-1)', () => {
    assertNoNavigateMinusOne(source);
    expect(source).toContain('navigate.back()');
  });

  it('navigate.back() appears at least twice (submit + back button)', () => {
    const count = (source.match(/navigate\.back\(\)/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Developers.tsx
// ---------------------------------------------------------------------------
describe('Developers.tsx migration (src/views/Developers.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Developers.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports Link from next/link', () => {
    expect(source).toContain("import Link from 'next/link'");
  });

  it('uses Link href= attribute (not to=)', () => {
    expect(source).not.toMatch(/<Link to=/);
    expect(source).toMatch(/<Link[^>]*href=/);
  });
});

// ---------------------------------------------------------------------------
// Home.tsx
// ---------------------------------------------------------------------------
describe('Home.tsx migration (src/views/Home.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Home.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() for navigation', () => {
    expect(source).toContain('navigate.push(');
  });
});

// ---------------------------------------------------------------------------
// Landing.tsx
// ---------------------------------------------------------------------------
describe('Landing.tsx migration (src/views/Landing.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Landing.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports Link from next/link', () => {
    expect(source).toContain("import Link from 'next/link'");
  });

  it('imports useRouter from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() for programmatic navigation', () => {
    expect(source).toContain('navigate.push(');
  });

  it('uses Link href= attribute (not to=)', () => {
    expect(source).not.toMatch(/<Link to=/);
    expect(source).toMatch(/<Link[^>]*href=/);
  });

  it('has "use client" directive', () => {
    expect(source).toContain('"use client"');
  });
});

// ---------------------------------------------------------------------------
// Login.tsx
// ---------------------------------------------------------------------------
describe('Login.tsx migration (src/views/Login.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Login.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports Link from next/link', () => {
    expect(source).toContain("import Link from 'next/link'");
  });

  it('imports useRouter from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() to go home', () => {
    expect(source).toContain("navigate.push('/')");
  });

  it('uses Link href= attribute for terms and privacy links', () => {
    expect(source).not.toMatch(/<Link to=/);
    expect(source).toMatch(/<Link[^>]*href=/);
  });
});

// ---------------------------------------------------------------------------
// Matches.tsx
// ---------------------------------------------------------------------------
describe('Matches.tsx migration (src/views/Matches.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Matches.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() to navigate to home', () => {
    expect(source).toContain("navigate.push('/home')");
  });

  it('uses navigate.push() for chat navigation', () => {
    // Navigate to chat with just the route, no state object
    expect(source).toContain('navigate.push(`/chat/${');
  });

  it('does not pass route state object to navigation (state not supported in Next.js router)', () => {
    // The old pattern was: navigate(`/chat/${id}`, { state: { partner: chat.partner } })
    // The new pattern is: navigate.push(`/chat/${id}`) with no state
    expect(source).not.toMatch(/navigate\.push\(`\/chat\/\$\{.*\}`,\s*\{/);
  });
});

// ---------------------------------------------------------------------------
// Notifications.tsx
// ---------------------------------------------------------------------------
describe('Notifications.tsx migration (src/views/Notifications.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Notifications.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() to navigate to matches', () => {
    expect(source).toContain("navigate.push('/matches')");
  });

  it('uses navigate.push() to navigate to chat', () => {
    expect(source).toContain('navigate.push(`/chat/');
  });

  it('does not use navigate(-1)', () => {
    assertNoNavigateMinusOne(source);
  });
});

// ---------------------------------------------------------------------------
// Onboarding.tsx
// ---------------------------------------------------------------------------
describe('Onboarding.tsx migration (src/views/Onboarding.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Onboarding.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.push() to navigate to home after onboarding', () => {
    expect(source).toContain("navigate.push('/home')");
  });
});

// ---------------------------------------------------------------------------
// Profile.tsx
// ---------------------------------------------------------------------------
describe('Profile.tsx migration (src/views/Profile.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Profile.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses navigate.back() instead of navigate(-1)', () => {
    assertNoNavigateMinusOne(source);
    expect(source).toContain('navigate.back()');
  });

  it('uses navigate.push() for internal navigation', () => {
    expect(source).toContain('navigate.push(');
  });

  it('uses navigate.push() for chat navigation from profile', () => {
    expect(source).toContain('navigate.push(`/chat/');
  });
});

// ---------------------------------------------------------------------------
// StaticPages.tsx
// ---------------------------------------------------------------------------
describe('StaticPages.tsx migration (src/views/StaticPages.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('StaticPages.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports Link from next/link', () => {
    expect(source).toContain("import Link from 'next/link'");
  });

  it('uses Link href= attribute (not to=)', () => {
    expect(source).not.toMatch(/<Link to=/);
    expect(source).toMatch(/<Link[^>]*href=/);
  });
});

// ---------------------------------------------------------------------------
// Sparx.tsx
// ---------------------------------------------------------------------------
describe('Sparx.tsx migration (src/views/Sparx.tsx)', () => {
  let source: string;

  beforeAll(() => {
    source = readPage('Sparx.tsx');
  });

  it('does not import from react-router-dom', () => {
    expect(source).not.toContain("from 'react-router-dom'");
    expect(source).not.toContain('from "react-router-dom"');
  });

  it('imports from next/navigation', () => {
    expect(source).toContain("from 'next/navigation'");
  });

  it('uses router.push() for sparx/vibe room routing', () => {
    expect(source).toContain('router.push(');
  });

  it('passes route to router.push() for sparx routes', () => {
    expect(source.includes("router.push('/sparx/") || source.includes("router.push(`/sparx/")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: none of the migrated files import react-router-dom
// ---------------------------------------------------------------------------
describe('No react-router-dom imports in migrated files', () => {
  const migratedFiles = [
    'Blog.tsx',
    'Careers.tsx',
    'Chat.tsx',
    'Confessions.tsx',
    'Contact.tsx',
    'Developers.tsx',
    'Home.tsx',
    'Landing.tsx',
    'Login.tsx',
    'Matches.tsx',
    'Notifications.tsx',
    'Onboarding.tsx',
    'Profile.tsx',
    'StaticPages.tsx',
    'Sparx.tsx',
  ];

  migratedFiles.forEach((filename) => {
    it(`${filename} has no react-router-dom import`, () => {
      const source = readPage(filename);
      expect(source).not.toContain("from 'react-router-dom'");
      expect(source).not.toContain('from "react-router-dom"');
    });
  });
});