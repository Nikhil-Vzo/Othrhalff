import {
  blockUser,
  unblockUser,
  isUserBlocked,
  isBlockedBy,
  getBlockList,
  checkBlockStatus,
} from '../../src/services/blockService';

const mockGetUser = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockSelect = jest.fn();
const mockMatch = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();
const mockMaybeSingle = jest.fn();

const mockFromBuilder: any = {
  insert: mockInsert,
  delete: mockDelete,
  select: mockSelect,
  match: mockMatch,
  eq: mockEq,
  or: mockOr,
  maybeSingle: mockMaybeSingle,
};

// Setup chaining mocks
mockDelete.mockReturnValue(mockFromBuilder);
mockSelect.mockReturnValue(mockFromBuilder);
mockMatch.mockReturnValue(mockFromBuilder);
mockEq.mockReturnValue(mockFromBuilder);
mockOr.mockReturnValue(mockFromBuilder);

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => mockFromBuilder,
  },
}));

describe('blockService', () => {
  const CURRENT_USER_ID = 'current-user-123';
  const TARGET_USER_ID = 'target-user-456';

  beforeEach(() => {
    jest.restoreAllMocks();

    // Reset mock implementations and return values to prevent test pollution
    mockGetUser.mockReset();
    mockInsert.mockReset();
    mockDelete.mockReset();
    mockSelect.mockReset();
    mockMatch.mockReset();
    mockEq.mockReset();
    mockOr.mockReset();
    mockMaybeSingle.mockReset();

    // Re-establish default chaining behaviors
    mockDelete.mockReturnValue(mockFromBuilder);
    mockSelect.mockReturnValue(mockFromBuilder);
    mockMatch.mockReturnValue(mockFromBuilder);
    mockEq.mockReturnValue(mockFromBuilder);
    mockOr.mockReturnValue(mockFromBuilder);

    // Default mock behaviors
    mockGetUser.mockResolvedValue({ data: { user: { id: CURRENT_USER_ID } } });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('blockUser', () => {
    it('returns false if current user is not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await blockUser(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('inserts a block record and returns true on success', async () => {
      mockInsert.mockResolvedValue({ error: null });
      const result = await blockUser(TARGET_USER_ID);
      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        blocker_id: CURRENT_USER_ID,
        blocked_id: TARGET_USER_ID,
      });
    });

    it('returns false and logs an error if insert fails', async () => {
      mockInsert.mockResolvedValue({ error: new Error('Insert failed') });
      const result = await blockUser(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('unblockUser', () => {
    it('returns false if current user is not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await unblockUser(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes block record and returns true on success', async () => {
      mockMatch.mockResolvedValue({ error: null });
      const result = await unblockUser(TARGET_USER_ID);
      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockMatch).toHaveBeenCalledWith({
        blocker_id: CURRENT_USER_ID,
        blocked_id: TARGET_USER_ID,
      });
    });

    it('returns false if delete fails', async () => {
      mockMatch.mockResolvedValue({ error: new Error('Delete failed') });
      const result = await unblockUser(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isUserBlocked', () => {
    it('returns false if not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await isUserBlocked(TARGET_USER_ID);
      expect(result).toBe(false);
    });

    it('returns true if query finds a matching row', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'block-id-1' }, error: null });
      const result = await isUserBlocked(TARGET_USER_ID);
      expect(result).toBe(true);
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockMatch).toHaveBeenCalledWith({
        blocker_id: CURRENT_USER_ID,
        blocked_id: TARGET_USER_ID,
      });
    });

    it('returns false if query does not find a row', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      const result = await isUserBlocked(TARGET_USER_ID);
      expect(result).toBe(false);
    });

    it('returns false and logs error if query fails', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('Query failed') });
      const result = await isUserBlocked(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isBlockedBy', () => {
    it('resolves current user ID from session if not provided and checks block', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'block-id-2' }, error: null });
      const result = await isBlockedBy(TARGET_USER_ID);
      expect(result).toBe(true);
      expect(mockMatch).toHaveBeenCalledWith({
        blocker_id: TARGET_USER_ID,
        blocked_id: CURRENT_USER_ID,
      });
    });

    it('uses provided currentUserId and checks block', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: 'block-id-3' }, error: null });
      const result = await isBlockedBy(TARGET_USER_ID, 'provided-user-999');
      expect(result).toBe(true);
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockMatch).toHaveBeenCalledWith({
        blocker_id: TARGET_USER_ID,
        blocked_id: 'provided-user-999',
      });
    });

    it('returns false if current user is not logged in and not provided', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await isBlockedBy(TARGET_USER_ID);
      expect(result).toBe(false);
    });

    it('returns false and ignores PGRST116 (JSON empty result) error code', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      const result = await isBlockedBy(TARGET_USER_ID);
      expect(result).toBe(false);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('getBlockList', () => {
    it('returns blocked IDs on successful query', async () => {
      mockEq.mockResolvedValue({
        data: [{ blocked_id: 'user-a' }, { blocked_id: 'user-b' }],
        error: null,
      });
      const result = await getBlockList();
      expect(result).toEqual(['user-a', 'user-b']);
      expect(mockSelect).toHaveBeenCalledWith('blocked_id');
      expect(mockEq).toHaveBeenCalledWith('blocker_id', CURRENT_USER_ID);
    });

    it('returns empty array if not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await getBlockList();
      expect(result).toEqual([]);
    });

    it('returns empty array and logs error on query failure', async () => {
      mockEq.mockResolvedValue({ data: null, error: new Error('Query error') });
      const result = await getBlockList();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('checkBlockStatus', () => {
    it('returns both isBlocked and isBlockedBy statuses correctly', async () => {
      // Setup mock data where CURRENT_USER blocked TARGET_USER
      mockOr.mockResolvedValue({
        data: [
          { blocker_id: CURRENT_USER_ID, blocked_id: TARGET_USER_ID },
        ],
        error: null,
      });

      const result = await checkBlockStatus(TARGET_USER_ID);
      expect(result).toEqual({ isBlocked: true, isBlockedBy: false });
      expect(mockSelect).toHaveBeenCalledWith('blocker_id, blocked_id');
      expect(mockOr).toHaveBeenCalledWith(
        `and(blocker_id.eq.${CURRENT_USER_ID},blocked_id.eq.${TARGET_USER_ID}),and(blocker_id.eq.${TARGET_USER_ID},blocked_id.eq.${CURRENT_USER_ID})`
      );
    });

    it('returns false for both if not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await checkBlockStatus(TARGET_USER_ID);
      expect(result).toEqual({ isBlocked: false, isBlockedBy: false });
    });

    it('returns false for both and logs error if query fails', async () => {
      mockOr.mockResolvedValue({ data: null, error: new Error('Status check error') });
      const result = await checkBlockStatus(TARGET_USER_ID);
      expect(result).toEqual({ isBlocked: false, isBlockedBy: false });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
