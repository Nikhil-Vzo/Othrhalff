const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

const mockRpc = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: () => mockFrom(),
    rpc: (...args: any[]) => mockRpc(...args),
    channel: () => ({
      send: jest.fn(),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn()
    })
  }
}));

import {
  getPcoLiveSchedule,
  checkIsPcoAdmin,
  fetchPcoRadioState,
  updatePcoRadioState,
  setManualRadioOverride,
  returnToAutoRadioSchedule,
  updateRadioQueue,
  getServerTimeMs
} from '../../src/services/pcoAdmin';
import { curatedRomanticTracks } from '../../src/data/pcoRomanticTracks';

describe('Campus PCO Radio Deterministic Scheduler & Admin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  test('curatedRomanticTracks dataset is non-empty and well-formed', () => {
    expect(curatedRomanticTracks.length).toBeGreaterThan(10);
    curatedRomanticTracks.forEach(track => {
      expect(track.id).toBeDefined();
      expect(track.song).toBeDefined();
      expect(track.media_url).toMatch(/^https?:\/\//);
      expect(parseInt(track.duration, 10)).toBeGreaterThan(0);
    });
  });

  test('getPcoLiveSchedule produces a valid deterministic schedule', () => {
    const sched = getPcoLiveSchedule();
    expect(sched.currentTrack).toBeDefined();
    expect(sched.currentTrack.id).toBeDefined();
    expect(sched.offsetSec).toBeGreaterThanOrEqual(0);
    expect(sched.remainingSec).toBeGreaterThanOrEqual(0);
    expect(sched.durationSec).toBeGreaterThan(0);
    expect(sched.offsetSec + sched.remainingSec).toBe(sched.durationSec);
    expect(sched.upcomingTracks.length).toBe(20);
  });

  test('getPcoLiveSchedule is deterministic for the exact same timestamp', () => {
    const realNow = Date.now;
    const fixedTime = 1750000000000;
    Date.now = jest.fn(() => fixedTime);

    const sched1 = getPcoLiveSchedule();
    const sched2 = getPcoLiveSchedule();

    expect(sched1.currentTrack.id).toBe(sched2.currentTrack.id);
    expect(sched1.offsetSec).toBe(sched2.offsetSec);
    expect(sched1.remainingSec).toBe(sched2.remainingSec);

    Date.now = realNow;
  });

  test('checkIsPcoAdmin recognizes platform owner emails as admins', async () => {
    const primaryEmails = [
      'nikhilyadav200530@gmail.com',
      'avneeshkumarjha1506@gmail.com',
      'avneeshjha1506@gmail.com',
      'dpursuit14@gmail.com',
      'lachavzo11@gmail.com'
    ];

    for (const email of primaryEmails) {
      const isAdmin = await checkIsPcoAdmin(null, email);
      expect(isAdmin).toBe(true);
    }
  });

  test('checkIsPcoAdmin denies unauthorized emails when not in database', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const isAdmin = await checkIsPcoAdmin(null, 'random.student@campus.edu');
    expect(isAdmin).toBe(false);
  });

  test('checkIsPcoAdmin recognizes admin from database table', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'admin-1', role: 'admin' }, error: null });
    const isAdmin = await checkIsPcoAdmin(null, 'campus.dj@campus.edu');
    expect(isAdmin).toBe(true);
  });

  describe('Authoritative Radio State Management', () => {
    test('fetchPcoRadioState parses manual override state correctly for late joiners', async () => {
      const mockTrack = {
        id: 'track-kesariya',
        song: 'Kesariya',
        singers: 'Arijit Singh',
        image: 'https://image.com/art.jpg',
        media_url: 'https://cdn.com/song.mp3',
        duration: '268'
      };
      const startedAt = Date.now() - 30000; // Started 30 seconds ago

      mockMaybeSingle.mockResolvedValue({
        data: {
          room_id: 'Campus_PCO_247',
          mode: 'manual',
          current_track: mockTrack,
          started_at_ms: startedAt,
          paused: false,
          queue: [],
          version: 5,
          updated_at: new Date().toISOString()
        },
        error: null
      });

      const state = await fetchPcoRadioState('Campus_PCO_247');
      expect(state).not.toBeNull();
      expect(state?.mode).toBe('manual');
      expect(state?.current_track?.song).toBe('Kesariya');
      expect(state?.started_at_ms).toBe(startedAt);
      expect(state?.version).toBe(5);

      // Verify late joiner offset math
      const elapsedSec = (Date.now() - (state?.started_at_ms || 0)) / 1000;
      expect(elapsedSec).toBeGreaterThanOrEqual(30);
      expect(elapsedSec).toBeLessThan(268);
    });

    test('fetchPcoRadioState returns null gracefully if table is missing or errors', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation does not exist' } });
      const state = await fetchPcoRadioState('Campus_PCO_247');
      expect(state).toBeNull();
    });

    test('getServerTimeMs retrieves server timestamp from Supabase RPC to prevent clock skew', async () => {
      const serverTime = 1789000000000;
      mockRpc.mockResolvedValue({ data: serverTime, error: null });

      const time = await getServerTimeMs();
      expect(time).toBe(serverTime);
      expect(mockRpc).toHaveBeenCalledWith('get_server_time_ms');
    });

    test('getServerTimeMs falls back to Date.now() if RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'function not found' } });
      const before = Date.now();
      const time = await getServerTimeMs();
      const after = Date.now();

      expect(time).toBeGreaterThanOrEqual(before);
      expect(time).toBeLessThanOrEqual(after);
    });
  });
});
