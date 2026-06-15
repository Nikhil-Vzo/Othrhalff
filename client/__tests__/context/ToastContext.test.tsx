import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../../src/context/ToastContext';

// Mock Lucide icons to simplify assertions and speed up render
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-close">X</span>,
  CheckCircle: () => <span data-testid="icon-success">SuccessIcon</span>,
  AlertOctagon: () => <span data-testid="icon-error">ErrorIcon</span>,
  Info: () => <span data-testid="icon-info">InfoIcon</span>,
  AlertTriangle: () => <span data-testid="icon-warning">WarningIcon</span>,
}));

// Test component that uses the useToast hook
const TestComponent: React.FC<{
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}> = ({ message = 'Test Toast Message', type = 'success', duration }) => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(message, type, duration)}>
      Trigger Toast
    </button>
  );
};

describe('ToastContext', () => {
  describe('useToast Guard', () => {
    it('throws an error when useToast is used outside of ToastProvider', () => {
      // Suppress console.error since React prints exception stack traces when errors are thrown during render
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      spy.mockRestore();
    });
  });

  describe('ToastProvider Features', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('renders child components correctly', () => {
      render(
        <ToastProvider>
          <div data-testid="child-element">Hello World</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('child-element')).toBeInTheDocument();
    });

    it('displays a success toast when triggered', () => {
      render(
        <ToastProvider>
          <TestComponent message="Operation Successful" type="success" />
        </ToastProvider>
      );

      // No toast should be visible initially
      expect(screen.queryByText('Operation Successful')).not.toBeInTheDocument();

      // Trigger showToast
      fireEvent.click(screen.getByText('Trigger Toast'));

      // Toast and success icon should now render
      expect(screen.getByText('Operation Successful')).toBeInTheDocument();
      expect(screen.getByTestId('icon-success')).toBeInTheDocument();
    });

    it('displays warning, error, and info types with correct icons', () => {
      const { rerender } = render(
        <ToastProvider>
          <TestComponent message="Alert Error" type="error" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Alert Error')).toBeInTheDocument();
      expect(screen.getByTestId('icon-error')).toBeInTheDocument();

      // Test Warning
      rerender(
        <ToastProvider>
          <TestComponent message="Alert Warning" type="warning" />
        </ToastProvider>
      );
      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Alert Warning')).toBeInTheDocument();
      expect(screen.getByTestId('icon-warning')).toBeInTheDocument();

      // Test Info
      rerender(
        <ToastProvider>
          <TestComponent message="Alert Info" type="info" />
        </ToastProvider>
      );
      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Alert Info')).toBeInTheDocument();
      expect(screen.getByTestId('icon-info')).toBeInTheDocument();
    });

    it('auto-clears toast after default duration (3000ms)', () => {
      render(
        <ToastProvider>
          <TestComponent message="Ephemeral Message" type="success" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Ephemeral Message')).toBeInTheDocument();

      // Fast-forward timers by 2999ms - toast should still be there
      act(() => {
        jest.advanceTimersByTime(2999);
      });
      expect(screen.getByText('Ephemeral Message')).toBeInTheDocument();

      // Fast-forward by 1ms more (3000ms total) - toast should get cleared
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.queryByText('Ephemeral Message')).not.toBeInTheDocument();
    });

    it('respects custom duration parameter', () => {
      render(
        <ToastProvider>
          <TestComponent message="Short Live Message" type="success" duration={1000} />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Short Live Message')).toBeInTheDocument();

      // Advance by 1000ms
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Short Live Message')).not.toBeInTheDocument();
    });

    it('does not auto-clear if duration is <= 0', () => {
      render(
        <ToastProvider>
          <TestComponent message="Persistent Message" type="success" duration={0} />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Persistent Message')).toBeInTheDocument();

      // Advance timers by large amount
      act(() => {
        jest.advanceTimersByTime(100000);
      });
      expect(screen.getByText('Persistent Message')).toBeInTheDocument();
    });

    it('removes toast immediately when clicking the close button', () => {
      render(
        <ToastProvider>
          <TestComponent message="Click Close Message" type="info" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Toast'));
      expect(screen.getByText('Click Close Message')).toBeInTheDocument();

      const closeButton = screen.getByTestId('icon-close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Click Close Message')).not.toBeInTheDocument();
    });

    it('can display and stack multiple toasts concurrently', () => {
      const MultiTriggerComponent: React.FC = () => {
        const { showToast } = useToast();
        return (
          <button onClick={() => {
            showToast('First Toast', 'success');
            showToast('Second Toast', 'error');
          }}>
            Trigger Multiple
          </button>
        );
      };

      render(
        <ToastProvider>
          <MultiTriggerComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Trigger Multiple'));

      expect(screen.getByText('First Toast')).toBeInTheDocument();
      expect(screen.getByText('Second Toast')).toBeInTheDocument();
    });
  });
});
