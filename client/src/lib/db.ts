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
}

export class ChatDatabase extends Dexie {
  messages!: Table<LocalMessage, string>;

  constructor() {
    super('OthrhalffChatDB');
    // Define the schema. We index by id (primary key), match_id (to query by chat room), and created_at (for sorting)
    this.version(1).stores({
      messages: 'id, match_id, created_at, status'
    });
  }
}

export const db = new ChatDatabase();
