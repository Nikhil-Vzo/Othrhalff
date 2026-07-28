import Dexie, { Table } from 'dexie';

export interface LocalMessage {
  id: string; // Either UUID from Supabase or temp string like temp-123
  match_id: string;
  sender_id: string;
  text: string;
  created_at: number; // Storing as timestamp number for easier sorting
  is_read: boolean;
  is_system: boolean;
  status: 'sent' | 'sending' | 'failed';
  reaction?: string;
}

export interface LocalProfile {
  id: string;
  real_name: string | null;
  anonymous_id: string;
  avatar: string | null;
  is_verified: boolean;
  university: string | null;
  last_fetched: number; // Storing as timestamp number for TTL checks
}

export class ChatDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;
  profiles!: Table<LocalProfile, string>;

  constructor() {
    super('OthrhalffCupidDB');
    this.version(1).stores({
      messages: 'id, match_id, created_at, status'
    });
    this.version(2).stores({
      messages: 'id, match_id, created_at, status, [match_id+created_at]'
    });
    this.version(3).stores({
      messages: 'id, match_id, created_at, status, [match_id+created_at]',
      profiles: 'id'
    });
  }
}

export const db = new ChatDatabase();
