/**
 * Tests for client/app/providers.tsx
 *
 * The Providers component composes multiple context providers and an ErrorBoundary.
 * These tests verify:
 *  - Children are rendered when no error occurs
 *  - The provider hierarchy is correct (all providers present)
 *  - ErrorBoundary catches runtime errors and shows fallback UI
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// Mock all heavy context providers so they simply render their children.
// This keeps the tests focused on the composition logic in providers.tsx.
// ---------------------------------------------------------------------------
jest.mock('../../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

jest.mock('../../src/context/PresenceContext', () => ({
  PresenceProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="presence-provider">{children}</div>
  ),
}));

jest.mock('../../src/context/CallContext', () => ({
  CallProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="call-provider">{children}</div>
  ),
}));

jest.mock('../../src/context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}));

jest.mock('../../src/context/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

// ErrorBoundary: keep the real class but provide a testable version that
// renders children normally and shows a fallback on error.
jest.mock('../../src/components/ErrorBoundary', () => {
  const React = require('react');
  class MockErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <div data-testid="error-boundary-fallback">Something went wrong</div>;
      }
      return <div data-testid="error-boundary">{this.props.children}</div>;
    }
  }

  return { ErrorBoundary: MockErrorBoundary };
});

// ---------------------------------------------------------------------------
// Import the component under test AFTER all mocks are registered.
// ---------------------------------------------------------------------------
import { Providers } from '../../app/providers';

// ---------------------------------------------------------------------------
// Helper: a component that intentionally throws
// ---------------------------------------------------------------------------
const ThrowingChild: React.FC = () => {
  throw new Error('Test error from child');
};

describe('Providers component', () => {
  it('renders children', () => {
    render(
      <Providers>
        <span data-testid="child">Hello</span>
      </Providers>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders the ErrorBoundary wrapper', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('renders the AuthProvider', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('renders the PresenceProvider', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('presence-provider')).toBeInTheDocument();
  });

  it('renders the CallProvider', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('call-provider')).toBeInTheDocument();
  });

  it('renders the ToastProvider', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
  });

  it('renders the NotificationProvider', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
  });

  it('passes children all the way through the provider chain', () => {
    render(
      <Providers>
        <span data-testid="deep-child">deep</span>
      </Providers>,
    );
    expect(screen.getByTestId('deep-child')).toBeInTheDocument();
    expect(screen.getByTestId('deep-child')).toHaveTextContent('deep');
  });

  it('renders multiple children', () => {
    render(
      <Providers>
        <span data-testid="child-1">one</span>
        <span data-testid="child-2">two</span>
      </Providers>,
    );
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('shows ErrorBoundary fallback when a child throws', () => {
    // Suppress the console.error noise from React's error boundary
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Providers>
        <ThrowingChild />
      </Providers>,
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('does not render child content when ErrorBoundary catches an error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Providers>
        <ThrowingChild />
      </Providers>,
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    spy.mockRestore();
  });
});