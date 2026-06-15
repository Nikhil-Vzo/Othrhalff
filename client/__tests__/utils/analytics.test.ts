import {
  trackEvent,
  trackPageView,
  trackUserProperties,
  analytics,
} from '../../src/utils/analytics';

describe('analytics.ts', () => {
  let mockGtag: jest.Mock;

  beforeEach(() => {
    mockGtag = jest.fn();
    // Setup global window and window.gtag
    global.window = {} as any;
    (global.window as any).gtag = mockGtag;
  });

  afterEach(() => {
    // Reset global window mock
    delete (global as any).window;
    jest.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('calls window.gtag with correct arguments when window.gtag is defined', () => {
      trackEvent('click', 'Button', 'Submit', 10);

      expect(mockGtag).toHaveBeenCalledWith('event', 'click', {
        event_category: 'Button',
        event_label: 'Submit',
        value: 10,
      });
    });

    it('works without throwing if window.gtag is missing', () => {
      delete (global.window as any).gtag;

      expect(() => {
        trackEvent('click', 'Button', 'Submit', 10);
      }).not.toThrow();
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('works without throwing if window itself is undefined (SSR environment)', () => {
      // Temporarily mock the environment where window is undefined.
      // In JS, typeof window is checked, so we delete it from global
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        trackEvent('click', 'Button', 'Submit', 10);
      }).not.toThrow();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('trackPageView', () => {
    it('calls window.gtag with config and path details when gtag is defined', () => {
      trackPageView('/matches', 'Matches Page');

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-1SMGFPR49Z', {
        page_path: '/matches',
        page_title: 'Matches Page',
      });
    });

    it('works without throwing if window.gtag or window is missing', () => {
      delete (global.window as any).gtag;
      expect(() => {
        trackPageView('/matches');
      }).not.toThrow();
    });
  });

  describe('trackUserProperties', () => {
    it('calls window.gtag with set user_properties when gtag is defined', () => {
      const props = { isPremium: true, gender: 'female' };
      trackUserProperties(props);

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', props);
    });

    it('works without throwing if window.gtag or window is missing', () => {
      delete (global.window as any).gtag;
      expect(() => {
        trackUserProperties({ user_id: '123' });
      }).not.toThrow();
    });
  });

  describe('analytics shortcut helper object', () => {
    // We can spy on trackEvent to assert the shortcut calls are mapped correctly
    let trackEventSpy: jest.SpyInstance;

    beforeEach(() => {
      // Re-importing might not be necessary if we just spy on the module exports.
      // However, since we import * as analyticsUtil, we can spy on trackEvent.
      // But trackEvent is a named export, so we can't directly mock it inside the same file
      // unless we mock the whole module or spy on window.gtag (which is simpler!).
      // We'll just verify window.gtag is called with correct parameters.
    });

    it('analytics.login triggers the expected Auth login event', () => {
      analytics.login('google');
      expect(mockGtag).toHaveBeenCalledWith('event', 'login', {
        event_category: 'Auth',
        event_label: 'google',
        value: undefined,
      });
    });

    it('analytics.signup triggers the expected Auth sign_up event', () => {
      analytics.signup('email');
      expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', {
        event_category: 'Auth',
        event_label: 'email',
        value: undefined,
      });
    });

    it('analytics.logout triggers the expected Auth logout event', () => {
      analytics.logout();
      expect(mockGtag).toHaveBeenCalledWith('event', 'logout', {
        event_category: 'Auth',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.profileView triggers the profile view event with user id label', () => {
      analytics.profileView('user-456');
      expect(mockGtag).toHaveBeenCalledWith('event', 'view_profile', {
        event_category: 'Profile',
        event_label: 'user-456',
        value: undefined,
      });
    });

    it('analytics.profileEdit triggers the edit profile event', () => {
      analytics.profileEdit();
      expect(mockGtag).toHaveBeenCalledWith('event', 'edit_profile', {
        event_category: 'Profile',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.swipeRight triggers swipe_right event', () => {
      analytics.swipeRight();
      expect(mockGtag).toHaveBeenCalledWith('event', 'swipe_right', {
        event_category: 'Discovery',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.match triggers match discovery event', () => {
      analytics.match();
      expect(mockGtag).toHaveBeenCalledWith('event', 'match', {
        event_category: 'Discovery',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.messageSent triggers message_sent event', () => {
      analytics.messageSent();
      expect(mockGtag).toHaveBeenCalledWith('event', 'message_sent', {
        event_category: 'Chat',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.videoCall triggers video_call_started event', () => {
      analytics.videoCall();
      expect(mockGtag).toHaveBeenCalledWith('event', 'video_call_started', {
        event_category: 'Chat',
        event_label: undefined,
        value: undefined,
      });
    });

    it('analytics.virtualDateStart triggers virtual_date_start with type label', () => {
      analytics.virtualDateStart('cinema');
      expect(mockGtag).toHaveBeenCalledWith('event', 'virtual_date_start', {
        event_category: 'VirtualDate',
        event_label: 'cinema',
        value: undefined,
      });
    });

    it('analytics.confessionPost triggers confession_post with type label', () => {
      analytics.confessionPost('poll');
      expect(mockGtag).toHaveBeenCalledWith('event', 'confession_post', {
        event_category: 'Confessions',
        event_label: 'poll',
        value: undefined,
      });
    });

    it('analytics.premiumPurchase triggers purchase event with plan label', () => {
      analytics.premiumPurchase('monthly');
      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        event_category: 'Premium',
        event_label: 'monthly',
        value: undefined,
      });
    });
  });
});
