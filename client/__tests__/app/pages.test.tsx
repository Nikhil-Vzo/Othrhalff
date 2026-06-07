/**
 * Tests for Next.js App Router page components (client/app/*\/page.tsx).
 *
 * Each page in the app directory is a thin wrapper that renders the corresponding
 * src/views/ component. These tests verify:
 *  - Each Page() component renders without throwing
 *  - Each page delegates rendering to the correct underlying component
 *
 * All underlying page components are mocked to return a unique identifier,
 * making it simple to assert which component is rendered.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Mock next/navigation so page components that import it don't throw
// ---------------------------------------------------------------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next/link
// ---------------------------------------------------------------------------
jest.mock('next/link', () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ---------------------------------------------------------------------------
// Mock all underlying src/views components
// ---------------------------------------------------------------------------
jest.mock('../../src/views/Landing', () => ({
  Landing: () => <div data-testid="landing-page">Landing</div>,
}));

jest.mock('../../src/views/Login', () => ({
  Login: () => <div data-testid="login-page">Login</div>,
}));

jest.mock('../../src/views/Onboarding', () => ({
  Onboarding: () => <div data-testid="onboarding-page">Onboarding</div>,
}));

jest.mock('../../src/views/Home', () => ({
  Home: () => <div data-testid="home-page">Home</div>,
}));

jest.mock('../../src/views/Matches', () => ({
  Matches: () => <div data-testid="matches-page">Matches</div>,
}));

jest.mock('../../src/views/Chat', () => ({
  Chat: () => <div data-testid="chat-page">Chat</div>,
}));

jest.mock('../../src/views/Notifications', () => ({
  Notifications: () => <div data-testid="notifications-page">Notifications</div>,
}));

jest.mock('../../src/views/VirtualDate', () => ({
  VirtualDate: () => <div data-testid="virtual-date-page">VirtualDate</div>,
}));

jest.mock('../../src/views/virtual-dates/CinemaDate', () => ({
  CinemaDate: () => <div data-testid="cinema-date-page">CinemaDate</div>,
}));

jest.mock('../../src/views/virtual-dates/MusicDate', () => ({
  MusicDate: () => <div data-testid="music-date-page">MusicDate</div>,
}));

jest.mock('../../src/views/Profile', () => ({
  Profile: () => <div data-testid="profile-page">Profile</div>,
}));

jest.mock('../../src/views/Developers', () => ({
  Developers: () => <div data-testid="developers-page">Developers</div>,
}));

jest.mock('../../src/views/Confessions', () => ({
  Confessions: () => <div data-testid="confessions-page">Confessions</div>,
}));

jest.mock('../../src/views/Blog', () => ({
  Blog: () => <div data-testid="blog-page">Blog</div>,
}));

jest.mock('../../src/views/StaticPages', () => ({
  About: () => <div data-testid="about-page">About</div>,
  Privacy: () => <div data-testid="privacy-page">Privacy</div>,
  Terms: () => <div data-testid="terms-page">Terms</div>,
  Safety: () => <div data-testid="safety-page">Safety</div>,
  Guidelines: () => <div data-testid="guidelines-page">Guidelines</div>,
}));

jest.mock('../../src/views/Careers', () => ({
  Careers: () => <div data-testid="careers-page">Careers</div>,
}));

jest.mock('../../src/views/Contact', () => ({
  Contact: () => <div data-testid="contact-page">Contact</div>,
}));

// ---------------------------------------------------------------------------
// Import page components under test AFTER mocks are registered
// ---------------------------------------------------------------------------
import RootPage from '../../app/page';
import LoginPage from '../../app/login/page';
import OnboardingPage from '../../app/onboarding/page';
import HomePage from '../../app/home/page';
import MatchesPage from '../../app/matches/page';
import ChatPage from '../../app/chat/[id]/page';
import NotificationsPage from '../../app/notifications/page';
import VirtualDateCinemaPage from '../../app/virtual-date/cinema/page';
import VirtualDateMusicPage from '../../app/virtual-date/music/page';
import ProfilePage from '../../app/profile/page';
import ProfileByIdPage from '../../app/profile/[id]/page';
import DevelopersPage from '../../app/developers/page';
import ConfessionsPage from '../../app/confessions/page';
import BlogPage from '../../app/blog/page';
import AboutPage from '../../app/about/page';
import PrivacyPage from '../../app/privacy/page';
import TermsPage from '../../app/terms/page';
import SafetyPage from '../../app/safety/page';
import GuidelinesPage from '../../app/guidelines/page';
import CareersPage from '../../app/careers/page';
import ContactPage from '../../app/contact/page';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Root page (app/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<RootPage />)).not.toThrow();
  });

  it('renders the Landing component', () => {
    render(<RootPage />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });
});

describe('Login page (app/login/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<LoginPage />)).not.toThrow();
  });

  it('renders the Login component', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('Onboarding page (app/onboarding/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<OnboardingPage />)).not.toThrow();
  });

  it('renders the Onboarding component', () => {
    render(<OnboardingPage />);
    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
  });
});

describe('Home page (app/home/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });

  it('renders the Home component', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});

describe('Matches page (app/matches/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<MatchesPage />)).not.toThrow();
  });

  it('renders the Matches component', () => {
    render(<MatchesPage />);
    expect(screen.getByTestId('matches-page')).toBeInTheDocument();
  });
});

describe('Chat page (app/chat/[id]/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<ChatPage />)).not.toThrow();
  });

  it('renders the Chat component', () => {
    render(<ChatPage />);
    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
  });
});

describe('Notifications page (app/notifications/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<NotificationsPage />)).not.toThrow();
  });

  it('renders the Notifications component', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
  });
});

describe('Virtual Date Cinema page (app/virtual-date/cinema/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<VirtualDateCinemaPage />)).not.toThrow();
  });

  it('renders the CinemaDate component', () => {
    render(<VirtualDateCinemaPage />);
    expect(screen.getByTestId('cinema-date-page')).toBeInTheDocument();
  });
});

describe('Virtual Date Music page (app/virtual-date/music/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<VirtualDateMusicPage />)).not.toThrow();
  });

  it('renders the MusicDate component', () => {
    render(<VirtualDateMusicPage />);
    expect(screen.getByTestId('music-date-page')).toBeInTheDocument();
  });
});

describe('Profile page (app/profile/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<ProfilePage />)).not.toThrow();
  });

  it('renders the Profile component', () => {
    render(<ProfilePage />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });
});

describe('Profile [id] page (app/profile/[id]/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<ProfileByIdPage />)).not.toThrow();
  });

  it('renders the Profile component', () => {
    render(<ProfileByIdPage />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('reuses the same Profile component as the base profile page', () => {
    // Both /profile and /profile/[id] use the same Profile component
    render(<ProfileByIdPage />);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });
});

describe('Developers page (app/developers/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<DevelopersPage />)).not.toThrow();
  });

  it('renders the Developers component', () => {
    render(<DevelopersPage />);
    expect(screen.getByTestId('developers-page')).toBeInTheDocument();
  });
});

describe('Confessions page (app/confessions/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<ConfessionsPage />)).not.toThrow();
  });

  it('renders the Confessions component', () => {
    render(<ConfessionsPage />);
    expect(screen.getByTestId('confessions-page')).toBeInTheDocument();
  });
});

describe('Blog page (app/blog/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<BlogPage />)).not.toThrow();
  });

  it('renders the Blog component', () => {
    render(<BlogPage />);
    expect(screen.getByTestId('blog-page')).toBeInTheDocument();
  });
});

describe('About page (app/about/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<AboutPage />)).not.toThrow();
  });

  it('renders the About component', () => {
    render(<AboutPage />);
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });
});

describe('Privacy page (app/privacy/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<PrivacyPage />)).not.toThrow();
  });

  it('renders the Privacy component', () => {
    render(<PrivacyPage />);
    expect(screen.getByTestId('privacy-page')).toBeInTheDocument();
  });
});

describe('Terms page (app/terms/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<TermsPage />)).not.toThrow();
  });

  it('renders the Terms component', () => {
    render(<TermsPage />);
    expect(screen.getByTestId('terms-page')).toBeInTheDocument();
  });
});

describe('Safety page (app/safety/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<SafetyPage />)).not.toThrow();
  });

  it('renders the Safety component', () => {
    render(<SafetyPage />);
    expect(screen.getByTestId('safety-page')).toBeInTheDocument();
  });
});

describe('Guidelines page (app/guidelines/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<GuidelinesPage />)).not.toThrow();
  });

  it('renders the Guidelines component', () => {
    render(<GuidelinesPage />);
    expect(screen.getByTestId('guidelines-page')).toBeInTheDocument();
  });
});

describe('Careers page (app/careers/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<CareersPage />)).not.toThrow();
  });

  it('renders the Careers component', () => {
    render(<CareersPage />);
    expect(screen.getByTestId('careers-page')).toBeInTheDocument();
  });
});

describe('Contact page (app/contact/page.tsx)', () => {
  it('renders without throwing', () => {
    expect(() => render(<ContactPage />)).not.toThrow();
  });

  it('renders the Contact component', () => {
    render(<ContactPage />);
    expect(screen.getByTestId('contact-page')).toBeInTheDocument();
  });
});