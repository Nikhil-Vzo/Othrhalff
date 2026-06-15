import { calculateMatchPercentage } from '../../src/utils/matchingAlgorithm';
import { UserProfile } from '../../src/types';

// Helper function to generate a partial UserProfile for testing
const createMockUser = (interests: string[], university: string): UserProfile => {
  return {
    id: 'test-user-id',
    anonymousId: 'Anon#1234',
    realName: 'Test User',
    gender: 'other',
    university,
    universityEmail: 'test@univ.edu',
    branch: 'Computer Science',
    year: '3rd Year',
    interests,
    bio: 'Test bio',
    dob: '2000-01-01',
    isVerified: true,
  };
};

describe('calculateMatchPercentage', () => {
  it('returns 0 if either user or candidate does not have interests', () => {
    const user = createMockUser(['Coding', 'Music'], 'Univ A');
    const candidate = createMockUser([], 'Univ A');
    
    // Temporarily delete interests to simulate undefined/null cases in JS
    const userWithNullInterests = { ...user, interests: undefined as any };
    const candidateWithNullInterests = { ...candidate, interests: undefined as any };

    expect(calculateMatchPercentage(userWithNullInterests, candidate)).toBe(0);
    expect(calculateMatchPercentage(user, candidateWithNullInterests)).toBe(0);
  });

  it('returns 100 for perfect match (same interests, same university)', () => {
    const user = createMockUser(['Coding', 'Music', 'Gaming'], 'Univ A');
    const candidate = createMockUser(['Coding', 'Music', 'Gaming'], 'Univ A');

    // Interest overlap: 100% * 0.7 = 70%
    // University match: 100% * 0.3 = 30%
    // Total = 100%
    expect(calculateMatchPercentage(user, candidate)).toBe(100);
  });

  it('returns 70 for same interests but different university', () => {
    const user = createMockUser(['Coding', 'Music', 'Gaming'], 'Univ A');
    const candidate = createMockUser(['Coding', 'Music', 'Gaming'], 'Univ B');

    // Interest overlap: 100% * 0.7 = 70%
    // University match: 0% * 0.3 = 0%
    // Total = 70%
    expect(calculateMatchPercentage(user, candidate)).toBe(70);
  });

  it('returns 30 for different interests but same university', () => {
    const user = createMockUser(['Coding', 'Music'], 'Univ A');
    const candidate = createMockUser(['Gaming', 'Sports'], 'Univ A');

    // Interest overlap: 0% * 0.7 = 0%
    // University match: 100% * 0.3 = 30%
    // Total = 30%
    expect(calculateMatchPercentage(user, candidate)).toBe(30);
  });

  it('is case-insensitive for interest comparison', () => {
    const user = createMockUser(['coding', 'MUSIC'], 'Univ A');
    const candidate = createMockUser(['CODING', 'music'], 'Univ A');

    // Case-insensitive match makes interests 100% identical
    // Total = 100%
    expect(calculateMatchPercentage(user, candidate)).toBe(100);
  });

  it('correctly calculates Jaccard Index with partial interest overlap', () => {
    // User interests: ['coding', 'music', 'movies'] (3 interests)
    // Candidate interests: ['music', 'gaming', 'books'] (3 interests)
    // Intersection: ['music'] (1 interest)
    // Union: ['coding', 'music', 'movies', 'gaming', 'books'] (5 unique interests)
    // Jaccard Index = 1 / 5 = 0.2 (20% compatibility score)
    // Interest score weight: 20 * 0.7 = 14%

    const user = createMockUser(['coding', 'music', 'movies'], 'Univ A');
    const candidate = createMockUser(['music', 'gaming', 'books'], 'Univ A');

    // 1. Same University (+30%) => 14 + 30 = 44%
    expect(calculateMatchPercentage(user, candidate)).toBe(44);

    // 2. Different University (+0%) => 14 + 0 = 14%
    const candidateDiffUniv = createMockUser(['music', 'gaming', 'books'], 'Univ B');
    expect(calculateMatchPercentage(user, candidateDiffUniv)).toBe(14);
  });

  it('rounds the compatibility score to the nearest integer', () => {
    // User interests: ['coding', 'music', 'movies'] (3 interests)
    // Candidate interests: ['music', 'gaming'] (2 interests)
    // Intersection: ['music'] (1 interest)
    // Union: ['coding', 'music', 'movies', 'gaming'] (4 unique interests)
    // Jaccard Index = 1 / 4 = 0.25 (25% compatibility score)
    // Interest score weight: 25 * 0.7 = 17.5%
    // Same University (+30%) => 17.5 + 30 = 47.5% -> rounds to 48%

    const user = createMockUser(['coding', 'music', 'movies'], 'Univ A');
    const candidate = createMockUser(['music', 'gaming'], 'Univ A');

    expect(calculateMatchPercentage(user, candidate)).toBe(48);
  });

  it('handles empty interest arrays gracefully', () => {
    const user = createMockUser([], 'Univ A');
    const candidate = createMockUser([], 'Univ A');

    // Union size is 0, Jaccard Index defaults to 0
    // Same University => 30%
    expect(calculateMatchPercentage(user, candidate)).toBe(30);
  });
});
