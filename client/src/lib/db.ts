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

export class ChatDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;

  constructor() {
    super('OthrhalffChatDB');
    this.version(1).stores({
      messages: 'id, match_id, created_at, status'
    });
    this.version(2).stores({
      messages: 'id, match_id, created_at, status, [match_id+created_at]'
    });
  }
}

export const db = new ChatDatabase();
