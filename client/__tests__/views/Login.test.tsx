import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../../src/views/Login';
import { authService } from '../../src/services/auth';

// Mock next/navigation
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock AuthContext
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    needsOnboarding: false,
    isLoading: false,
  }),
}));

// Mock authService
jest.mock('../../src/services/auth', () => ({
  authService: {
    signInWithGoogle: jest.fn(),
    signInWithMagicLink: jest.fn(),
  },
}));

// Mock analytics
jest.mock('../../src/utils/analytics', () => ({
  analytics: {
    login: jest.fn(),
  },
}));

describe('Login Component Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Google and Magic Link options', () => {
    render(<Login />);
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Magic Link/i)).toBeInTheDocument();
  });

  it('triggers Google login when clicked', async () => {
    (authService.signInWithGoogle as jest.Mock).mockResolvedValueOnce({});
    render(<Login />);

    const googleBtn = screen.getByText(/Continue with Google/i);
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('sends magic link for valid email', async () => {
    (authService.signInWithMagicLink as jest.Mock).mockResolvedValueOnce({});
    render(<Login />);

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'student@harvard.edu' } });

    const submitBtn = screen.getByText(/Send Magic Link/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.signInWithMagicLink).toHaveBeenCalledWith('student@harvard.edu');
      expect(screen.getByText(/Magic Link sent to student@harvard.edu/i)).toBeInTheDocument();
    });
  });

  it('shows typo suggestion and auto-corrects domain', async () => {
    (authService.signInWithMagicLink as jest.Mock).mockResolvedValueOnce({});
    render(<Login />);

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'user@gmai.com' } });

    // Typo suggestion should be visible
    expect(screen.getByText(/Did you mean/i)).toBeInTheDocument();
    expect(screen.getByText(/user@gmail.com/i)).toBeInTheDocument();

    const submitBtn = screen.getByText(/Send Magic Link/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Should automatically use corrected email
      expect(authService.signInWithMagicLink).toHaveBeenCalledWith('user@gmail.com');
    });
  });

  it('blocks disposable emails before calling authService', async () => {
    render(<Login />);

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'bot@tempmail.com' } });

    const submitBtn = screen.getByText(/Send Magic Link/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.signInWithMagicLink).not.toHaveBeenCalled();
      expect(screen.getByText(/Temporary\/disposable email addresses are not supported/i)).toBeInTheDocument();
    });
  });

  it('enforces terms and conditions agreement on sign up mode', async () => {
    render(<Login />);

    // Switch to sign up mode
    const signupToggle = screen.getByRole('button', { name: /Sign up/i });
    fireEvent.click(signupToggle);

    const input = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(input, { target: { value: 'valid@university.edu' } });

    const submitBtn = screen.getByText(/Send Magic Link/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.signInWithMagicLink).not.toHaveBeenCalled();
      expect(screen.getByText(/You must agree to the Terms and Conditions/i)).toBeInTheDocument();
    });
  });
});
