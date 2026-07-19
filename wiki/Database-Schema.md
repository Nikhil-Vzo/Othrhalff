# Othrhalff Database Schema

This document outlines the complete database schema, Row-Level Security (RLS) policies, PostgreSQL triggers, and stored RPC procedures (functions) that form the backend data layer for the Othrhalff application. The database is hosted on Supabase, leveraging PostgreSQL for relational storage, real-time replication, and advanced security.

---

## 🛠️ Extensions & Core Configuration

Othrhalff relies on standard PostgreSQL extensions to handle UUID generation.

```sql
-- Required for generating secure unique identifiers
create extension if not exists "uuid-ossp";
```

---

## 🗄️ Table Definitions & Schema Maps

Othrhalff contains 16 core tables handling authentication mappings, matching logic, real-time messaging, confessions, polling, calling, and support pipelines.

### 1. `profiles`
Stores the core user details. Each profile maps directly to an authenticated Supabase user (`auth.users`).

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, FK `auth.users(id)` ON DELETE CASCADE | *None* | Unique ID mapping directly to Supabase Auth. |
| `anonymous_id` | `text` | Unique, Not Null | *None* | A unique generated handle used for anonymous interactions. |
| `real_name` | `text` | Not Null | *None* | The user's real name (provided during onboarding). |
| `gender` | `text` | Not Null | *None* | The user's gender identification. |
| `university` | `text` | Not Null | *None* | The university the user is enrolled in. |
| `university_email`| `text` | *None* | *None* | The official student email (used for verification). |
| `branch` | `text` | *None* | *None* | The user's major/academic branch. |
| `year` | `text` | *None* | *None* | The current academic year of study. |
| `interests` | `text[]` | *None* | `'{}'` | Array of user interests/hobbies. |
| `looking_for` | `text[]` | *None* | `'{}'` | Array of preferences/reasons for using the app. |
| `bio` | `text` | *None* | *None* | A short personal biography. |
| `dob` | `date` | *None* | *None* | The user's date of birth (used for age calculation/verification). |
| `avatar` | `text` | *None* | *None* | URI path or Base64 representation of the user's avatar. |
| `is_verified` | `boolean` | *None* | `false` | Indicator of student email verification status. |
| `is_premium` | `boolean` | *None* | `false` | Indicator of subscription/premium status. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the profile was created. |
| `updated_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the profile was last modified. |

#### DDL Definition
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  anonymous_id text not null unique,
  real_name text not null,
  gender text not null,
  university text not null,
  university_email text,
  branch text,
  year text,
  interests text[] default '{}',
  looking_for text[] default '{}',
  bio text,
  dob date,
  avatar text,
  is_verified boolean default false,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly viewable by all authenticated users (required for profiles list/swiping deck).
    ```sql
    create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
    ```
*   **Insert**: Users can only insert their own profile matching their Supabase Auth UID.
    ```sql
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
    ```
*   **Update**: Users can only update their own profile matching their Supabase Auth UID.
    ```sql
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
    ```

---

### 2. `user_presence`
Tracks user connectivity states (online, offline, in-call) and when they were last active.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, FK `public.profiles(id)` ON DELETE CASCADE | *None* | Unique ID linked directly to the user's profile. |
| `status` | `text` | Check Constraint | `'offline'` | Must be `'online'`, `'offline'`, or `'in-call'`. |
| `last_seen` | `timestamptz`| *None* | `timezone('utc', now())` | Timestamp when user heartbeat was last received. |
| `updated_at` | `timestamptz`| *None* | `timezone('utc', now())` | Timestamp when presence was last updated. |

#### DDL Definition
```sql
create table public.user_presence (
  id uuid references public.profiles(id) on delete cascade primary key,
  status text check (status in ('online', 'offline', 'in-call')) default 'offline',
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
```

#### Row-Level Security (RLS)
*   **Select**: Viewable by everyone to show online bubbles in chats.
    ```sql
    create policy "Allow read all presence" on public.user_presence for select using (true);
    ```
*   **All Operations**: Users can perform all operations (insert, update, delete) on their own presence entry.
    ```sql
    create policy "Allow upsert own presence" on public.user_presence for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    ```

---

### 3. `blocked_users`
Maintains user-configured blocks to ensure privacy and moderation.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique ID for the block record. |
| `blocker_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | The ID of the user executing the block. |
| `blocked_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | The ID of the target blocked user. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the block was initiated. |

> [!NOTE]
> A unique constraint is enforced on `(blocker_id, blocked_id)` to prevent duplicate block entries.

#### DDL Definition
```sql
create table public.blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id)
);
```

#### Row-Level Security (RLS)
*   **Select**: Users can only view blocks where they are either the blocker or the blocked user.
    ```sql
    create policy "Users can view their blocks" on public.blocked_users for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
    ```
*   **Insert**: Users can only block others if they are the blocker.
    ```sql
    create policy "Users can insert blocks" on public.blocked_users for insert with check (auth.uid() = blocker_id);
    ```
*   **Delete**: Users can only remove blocks they initiated.
    ```sql
    create policy "Users can delete their blocks" on public.blocked_users for delete using (auth.uid() = blocker_id);
    ```

---

### 4. `swipes`
Tracks swiping actions (likes and passes) between profiles.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique ID for the swipe. |
| `liker_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the user performing the swipe. |
| `target_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the user receiving the swipe. |
| `action` | `text` | Check Constraint, Not Null | *None* | Must be either `'like'` or `'pass'`. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the swipe occurred. |

> [!NOTE]
> Enforces a unique constraint on `(liker_id, target_id)` to ensure a user can only swipe once per target profile.

#### DDL Definition
```sql
create table public.swipes (
  id uuid default uuid_generate_v4() primary key,
  liker_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  action text check (action in ('like', 'pass')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(liker_id, target_id)
);
```

#### Row-Level Security (RLS)
*   **Select**: Users can only see swipes that they have cast.
    ```sql
    create policy "Allow read own swipes" on public.swipes for select using (auth.uid() = liker_id);
    ```
*   **All Operations**: Users can perform inserts or updates on swipes they initiate.
    ```sql
    create policy "Allow upsert own swipes" on public.swipes for all using (auth.uid() = liker_id) with check (auth.uid() = liker_id);
    ```

---

### 5. `matches`
Represents successfully established mutual likes between users.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique ID of the match session (acts as chat room ID). |
| `user1_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the first participant in the match. |
| `user2_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the second participant in the match. |
| `status` | `text` | Check Constraint, Default | `'matched'` | Must be `'matched'` or `'unmatched'`. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when match was registered. |
| `updated_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when match was last updated. |

> [!NOTE]
> Enforces a unique constraint on `(user1_id, user2_id)` to prevent multiple matches between the same pair of users.

#### DDL Definition
```sql
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('matched', 'unmatched')) default 'matched',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user1_id, user2_id)
);
```

#### Row-Level Security (RLS)
*   **Select**: Restricted to either participant of the match.
    ```sql
    create policy "Users can view their matches" on public.matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);
    ```
*   **Update**: Restricted to either participant (e.g., when unmatching or blocking).
    ```sql
    create policy "Users can update their matches" on public.matches for update using (auth.uid() = user1_id or auth.uid() = user2_id);
    ```
*   **Insert**: Restricted to either participant (typically triggered by swipes/backend matching mechanism).
    ```sql
    create policy "Users can trigger match creation" on public.matches for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
    ```

---

### 6. `messages`
Stores chat messages associated with a match (chat room).

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique message ID. |
| `match_id` | `uuid` | FK `public.matches(id)` ON DELETE CASCADE, Not Null | *None* | Parent match/chat-room ID. |
| `sender_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the sender. |
| `content` | `text` | Not Null | *None* | Text content of the message or image URL. |
| `type` | `text` | Check Constraint, Default | `'text'` | Must be `'text'`, `'image'`, or `'system'`. |
| `is_read` | `boolean` | Default | `false` | Read status. Used to display unread indicator badges. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the message was sent. |

#### DDL Definition
```sql
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  type text check (type in ('text', 'image', 'system')) default 'text',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Only participants of the parent match can view messages.
    ```sql
    create policy "Users can view messages of their matches" on public.messages for select using (
      exists (
        select 1 from public.matches 
        where matches.id = messages.match_id 
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
      )
    );
    ```
*   **Insert**: A user can insert messages if they are the designated sender.
    ```sql
    create policy "Users can insert messages to their matches" on public.messages for insert with check (auth.uid() = sender_id);
    ```
*   **Update**: A user can update messages only if they are NOT the sender (used for marking incoming messages as read).
    ```sql
    create policy "Users can update (mark as read) their received messages" on public.messages for update using (auth.uid() != sender_id);
    ```

---

### 7. `call_sessions`
Orchestrates signaling and metadata for Agora-powered audio and video calls.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique session ID (used as Agora channel name). |
| `caller_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | User initiating the call. |
| `receiver_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Target user of the call. |
| `status` | `text` | Check Constraint, Default | `'initiating'` | Status tracking: `'initiating'`, `'ringing'`, `'accepted'`, `'rejected'`, `'ended'`, or `'missed'`. |
| `type` | `text` | Check Constraint, Not Null | *None* | Call type: `'video'` or `'audio'`. |
| `started_at` | `timestamptz`| *None* | *None* | Timestamp when the call was accepted. |
| `ended_at` | `timestamptz`| *None* | *None* | Timestamp when the call terminated. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp when the call request was created. |

#### DDL Definition
```sql
create table public.call_sessions (
  id uuid default uuid_generate_v4() primary key,
  caller_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('initiating', 'ringing', 'accepted', 'rejected', 'ended', 'missed')) default 'initiating',
  type text check (type in ('video', 'audio')) not null,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Allowed only if the user is the caller or receiver.
    ```sql
    create policy "Users can view their calls" on public.call_sessions for select using (auth.uid() = caller_id or auth.uid() = receiver_id);
    ```
*   **Insert**: Allowed if the user is initiating the call (caller).
    ```sql
    create policy "Users can insert calls" on public.call_sessions for insert with check (auth.uid() = caller_id);
    ```
*   **Update**: Allowed for either participant (caller or receiver) to change states (ringing, accepted, ended, etc.).
    ```sql
    create policy "Users can update their calls" on public.call_sessions for update using (auth.uid() = caller_id or auth.uid() = receiver_id);
    ```

---

### 8. `notifications`
Powers in-app alerts, swiping matches, updates, and moderation warnings.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique notification ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Target recipient user. |
| `type` | `text` | Not Null | *None* | Notification category (e.g., `'match'`, `'like'`, `'system'`). |
| `title` | `text` | Not Null | *None* | Title of the notification overlay. |
| `message` | `text` | Not Null | *None* | Body description. |
| `data` | `jsonb` | Default | `'{}'` | JSON metadata container (e.g., source IDs, redirects). |
| `is_read` | `boolean` | Default | `false` | Read status tracking. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Creation timestamp. |

#### DDL Definition
```sql
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Users can only see their own notifications.
    ```sql
    create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
    ```
*   **Update**: Users can update only their own notifications (e.g., marking them as read).
    ```sql
    create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
    ```
*   **Insert**: Unrestricted system insert policy. Allows background services, functions, and guest proxies to generate notifications.
    ```sql
    create policy "System can insert notifications" on public.notifications for insert with check (true);
    ```

---

### 9. `confessions`
Handles the anonymous feed posts displayed across campus nodes.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique confession ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Owner ID (stored securely, hidden in UI/views). |
| `anonymous_name` | `text` | Not Null | *None* | Randomized display alias (e.g., "Anon Panda"). |
| `content` | `text` | Not Null | *None* | The main confession text. |
| `color` | `text` | Default | `'gray'` | Feed card background color classification. |
| `theme` | `text` | Default | `'default'` | Text overlay typography theme selection. |
| `likes_count` | `integer` | Default | `0` | Live reaction counter (automatically incremented via triggers). |
| `comments_count`| `integer` | Default | `0` | Live comment counter (automatically incremented via triggers). |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Publish timestamp. |

#### DDL Definition
```sql
create table public.confessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  anonymous_name text not null,
  content text not null,
  color text default 'gray',
  theme text default 'default',
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly viewable by anyone.
    ```sql
    create policy "Confessions are viewable by everyone" on public.confessions for select using (true);
    ```
*   **Insert**: Users can write confessions linked to their authenticated UID.
    ```sql
    create policy "Users can insert confessions" on public.confessions for insert with check (auth.uid() = user_id);
    ```
*   **Update**: Users can modify their own confessions.
    ```sql
    create policy "Users can update their own confessions" on public.confessions for update using (auth.uid() = user_id);
    ```
*   **Delete**: Users can delete their own confessions.
    ```sql
    create policy "Users can delete their own confessions" on public.confessions for delete using (auth.uid() = user_id);
    ```

---

### 10. `confession_reactions`
Tracks custom reactions and likes on confession posts.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique reaction record ID. |
| `confession_id` | `uuid` | FK `public.confessions(id)` ON DELETE CASCADE, Not Null | *None* | Parent confession ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | ID of the reacting user. |
| `emoji` | `text` | Not Null | *None* | Emoji character representation of the reaction. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Reaction timestamp. |

> [!NOTE]
> Enforces a unique constraint on `(confession_id, user_id)` to limit users to one reaction per confession.

#### DDL Definition
```sql
create table public.confession_reactions (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(confession_id, user_id)
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly readable.
    ```sql
    create policy "Reactions are viewable by everyone" on public.confession_reactions for select using (true);
    ```
*   **Insert**: Users can react to posts using their authenticated UID.
    ```sql
    create policy "Users can insert own reactions" on public.confession_reactions for insert with check (auth.uid() = user_id);
    ```
*   **Delete**: Users can remove their own reactions.
    ```sql
    create policy "Users can delete own reactions" on public.confession_reactions for delete using (auth.uid() = user_id);
    ```

---

### 11. `confession_comments`
Tracks nested anonymous comments under confession posts.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique comment ID. |
| `confession_id` | `uuid` | FK `public.confessions(id)` ON DELETE CASCADE, Not Null | *None* | Parent confession ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Commenter's profile ID. |
| `anonymous_name` | `text` | Not Null | *None* | Display alias for the comment session. |
| `content` | `text` | Not Null | *None* | Content text. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Comment timestamp. |

#### DDL Definition
```sql
create table public.confession_comments (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  anonymous_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly viewable by anyone.
    ```sql
    create policy "Comments are viewable by everyone" on public.confession_comments for select using (true);
    ```
*   **Insert**: Authenticated users can write comments.
    ```sql
    create policy "Users can insert comments" on public.confession_comments for insert with check (auth.uid() = user_id);
    ```

---

### 12. `poll_options`
Defines interactive options attached to confession posts.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique option ID. |
| `confession_id` | `uuid` | FK `public.confessions(id)` ON DELETE CASCADE, Not Null | *None* | Parent confession post. |
| `text` | `text` | Not Null | *None* | Option label display text. |
| `votes` | `integer` | Default | `0` | Aggregated vote counter. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Option creation timestamp. |

#### DDL Definition
```sql
create table public.poll_options (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references public.confessions(id) on delete cascade not null,
  text text not null,
  votes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly viewable by anyone.
    ```sql
    create policy "Poll options are viewable by everyone" on public.poll_options for select using (true);
    ```
*   **Insert**: Unrestricted insert policy to allow clients to publish polls alongside confessions.
    ```sql
    create policy "Users can insert poll options" on public.poll_options for insert with check (true);
    ```

---

### 13. `poll_votes`
Tracks individual votes to prevent multiple voting.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique vote ID. |
| `option_id` | `uuid` | FK `public.poll_options(id)` ON DELETE CASCADE, Not Null | *None* | Target option voted on. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Voter profile ID. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Timestamp of the vote. |

> [!NOTE]
> Enforces a unique constraint on `(option_id, user_id)` to prevent a user from voting on the same option multiple times.

#### DDL Definition
```sql
create table public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(option_id, user_id)
);
```

#### Row-Level Security (RLS)
*   **Select**: Publicly viewable by anyone.
    ```sql
    create policy "Poll votes are viewable by everyone" on public.poll_votes for select using (true);
    ```
*   **Insert**: Authenticated users can vote using their own profile ID.
    ```sql
    create policy "Users can cast votes" on public.poll_votes for insert with check (auth.uid() = user_id);
    ```

---

### 14. `verification_requests`
Maintains records for student email domain verification.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique request ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE CASCADE, Not Null | *None* | Requesting user. |
| `email` | `text` | Not Null | *None* | Submitted student email (e.g. name@university.edu). |
| `status` | `text` | Check Constraint, Default | `'pending'` | Must be `'pending'`, `'approved'`, or `'rejected'`. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Request timestamp. |

#### DDL Definition
```sql
create table public.verification_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Select**: Users can only view their own verification request.
    ```sql
    create policy "Users can view own verification requests" on public.verification_requests for select using (auth.uid() = user_id);
    ```
*   **Insert**: Users can submit request entries for their own profile ID.
    ```sql
    create policy "Users can insert verification requests" on public.verification_requests for insert with check (auth.uid() = user_id);
    ```

---

### 15. `support_tickets`
Tracks custom feedback, bug reports, and support requests.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique ticket ID. |
| `user_id` | `uuid` | FK `public.profiles(id)` ON DELETE SET NULL | *None* | Optional profile link if logged in. |
| `email` | `text` | Not Null | *None* | Contact email address. |
| `category` | `text` | Not Null | *None* | Category classification (e.g., `'feedback'`, `'bug'`). |
| `message` | `text` | Not Null | *None* | Message details. |
| `status` | `text` | Default | `'open'` | Current ticket status. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Submission timestamp. |

#### DDL Definition
```sql
create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  category text not null,
  message text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Insert**: Unrestricted insert policy to allow anyone (both guest and registered users) to submit support requests.
    ```sql
    create policy "Anyone can insert support tickets" on public.support_tickets for insert with check (true);
    ```

---

### 16. `career_inquiries`
Handles applicant submissions from the Othrhalff careers portal.

#### Schema Map
| Column | Type | Constraints / Keys | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `uuid_generate_v4()` | Unique application ID. |
| `role` | `text` | Not Null | *None* | Target role selection. |
| `full_name` | `text` | Not Null | *None* | Applicant's full name. |
| `email` | `text` | Not Null | *None* | Contact email address. |
| `phone` | `text` | Not Null | *None* | Contact phone number. |
| `college` | `text` | Not Null | *None* | Applicant's college name. |
| `created_at` | `timestamptz`| Not Null | `timezone('utc', now())` | Submission timestamp. |

#### DDL Definition
```sql
create table public.career_inquiries (
  id uuid default uuid_generate_v4() primary key,
  role text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  college text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row-Level Security (RLS)
*   **Insert**: Unrestricted insert policy to allow applicants to submit their forms.
    ```sql
    create policy "Anyone can insert career inquiries" on public.career_inquiries for insert with check (true);
    ```

---

## ⚡ Database Triggers & Automation Functions

To keep client logic lightweight, standard updates and stat accumulations are performed asynchronously via PostgreSQL database triggers.

### 1. Auto-updating Timestamps (`handle_updated_at`)
Automatically updates the `updated_at` column to the current timestamp before a row update occurs.

```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profile Updates
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Matches Updates
create trigger on_matches_updated
  before update on public.matches
  for each row execute procedure public.handle_updated_at();
```

### 2. Aggregating Confession Stats (`increment_confession_stats`)
Increment or decrement likes and comment counts on parent `confessions` tables automatically upon insertion/deletion of responses and reactions.

```sql
create or replace function public.increment_confession_stats()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'confession_comments' then
    if TG_OP = 'INSERT' then
      update public.confessions set comments_count = comments_count + 1 where id = new.confession_id;
    elsif TG_OP = 'DELETE' then
      update public.confessions set comments_count = comments_count - 1 where id = old.confession_id;
    end if;
  elsif TG_TABLE_NAME = 'confession_reactions' then
    if TG_OP = 'INSERT' then
      update public.confessions set likes_count = likes_count + 1 where id = new.confession_id;
    elsif TG_OP = 'DELETE' then
      update public.confessions set likes_count = likes_count - 1 where id = old.confession_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

-- Comment Counter Trigger
create trigger on_comment_added
  after insert or delete on public.confession_comments
  for each row execute procedure public.increment_confession_stats();

-- Reaction Counter Trigger
create trigger on_reaction_added
  after insert or delete on public.confession_reactions
  for each row execute procedure public.increment_confession_stats();
```

---

## 📞 Stored RPC Procedures (Remote Procedure Calls)

These stored procedures run directly on the database server, optimizing network queries and bypassing Row-Level Security safely (`security definer`).

### 1. `get_potential_matches`
Generates a list of target profiles the user has not yet interacted with. It dynamically processes filters depending on the chosen matchmaking mode (Campus vs. Global) and excludes swiped or blocked accounts.

*   **Security Context**: `security definer`
*   **Parameters**:
    *   `user_id` (`uuid`): Current requesting user.
    *   `match_mode` (`text`): Queue filter, either `'campus'` or `'global'`.
    *   `user_university` (`text`): Current user's registered university.
    *   `display_limit` (`integer`, defaults to `20`): Maximum matches to return.
*   **Returns**: `setof public.profiles`

```sql
create or replace function public.get_potential_matches(
  user_id uuid,
  match_mode text,
  user_university text,
  display_limit integer default 20
)
returns setof public.profiles
language plpgsql
security definer
as $$
begin
  if match_mode = 'campus' then
    return query
    select p.*
    from public.profiles p
    where p.id != user_id
      and lower(trim(split_part(p.university, ',', 1))) = lower(trim(split_part(user_university, ',', 1)))
      -- Exclude people they've already swiped on
      and not exists (
        select 1 from public.swipes s 
        where s.liker_id = user_id and s.target_id = p.id
      )
      -- Exclude blocked users (both directions)
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = user_id and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = user_id)
      )
    order by p.created_at desc
    limit display_limit;
  else -- Global mode
    return query
    select p.*
    from public.profiles p
    where p.id != user_id
      and lower(trim(split_part(p.university, ',', 1))) != lower(trim(split_part(user_university, ',', 1)))
      -- Exclude people they've already swiped on
      and not exists (
        select 1 from public.swipes s 
        where s.liker_id = user_id and s.target_id = p.id
      )
      -- Exclude blocked users (both directions)
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = user_id and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = user_id)
      )
    order by p.created_at desc
    limit display_limit;
  end if;
end;
$$;
```

---

### 2. `get_skipped_profiles`
Retrieves a chronological list of profiles the current user has previously swiped `'pass'` on, separated by queue context. Allows users to backtrack/review skipped profiles.

*   **Security Context**: `security definer`
*   **Parameters**:
    *   `current_user_id` (`uuid`): Requesting user.
    *   `match_mode` (`text`): Queue filter, either `'campus'` or `'global'`.
    *   `user_university` (`text`): Current user's registered university.
*   **Returns**: `setof public.profiles`

```sql
create or replace function public.get_skipped_profiles(
  current_user_id uuid,
  match_mode text,
  user_university text
)
returns setof public.profiles
language plpgsql
security definer
as $$
begin
  if match_mode = 'campus' then
    return query
    select p.*
    from public.profiles p
    join public.swipes s on s.target_id = p.id
    where s.liker_id = current_user_id
      and s.action = 'pass'
      and lower(trim(split_part(p.university, ',', 1))) = lower(trim(split_part(user_university, ',', 1)))
    order by s.created_at desc;
  else -- Global mode
    return query
    select p.*
    from public.profiles p
    join public.swipes s on s.target_id = p.id
    where s.liker_id = current_user_id
      and s.action = 'pass'
      and lower(trim(split_part(p.university, ',', 1))) != lower(trim(split_part(user_university, ',', 1)))
    order by s.created_at desc;
  end if;
end;
$$;
```

---

### 3. `get_matches_with_preview`
Optimized dashboard query mapping active matches, target profiles, and real-time previews (latest message, date/timestamp, and unread counts) in a single transactional database call.

*   **Security Context**: `security definer`
*   **Parameters**:
    *   `current_user_id` (`uuid`): Requesting user.
*   **Returns**: Table containing:
    *   `match_id` (`uuid`)
    *   `partner_id` (`uuid`)
    *   `partner_profile` (`json`)
    *   `last_message` (`json`)
    *   `last_message_time` (`timestamptz`)
    *   `unread_count` (`bigint`)

```sql
create or replace function public.get_matches_with_preview(current_user_id uuid)
returns table (
  match_id uuid,
  partner_id uuid,
  partner_profile json,
  last_message json,
  last_message_time timestamp with time zone,
  unread_count bigint
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    m.id as match_id,
    -- Determine who the partner is
    case 
      when m.user1_id = current_user_id then m.user2_id 
      else m.user1_id 
    end as partner_id,
    
    -- Bundle the partner's profile as JSON
    row_to_json(p.*) as partner_profile,
    
    -- Bundle the last message as JSON
    (
      select row_to_json(msg.*)
      from public.messages msg
      where msg.match_id = m.id
      order by msg.created_at desc
      limit 1
    ) as last_message,
    
    -- Extract the timestamp of the last message for sorting
    (
      select msg.created_at
      from public.messages msg
      where msg.match_id = m.id
      order by msg.created_at desc
      limit 1
    ) as last_message_time,
    
    -- Count unread messages sent by the partner
    (
      select count(*)
      from public.messages msg
      where msg.match_id = m.id 
      and msg.sender_id != current_user_id 
      and msg.is_read = false
    ) as unread_count
    
  from public.matches m
  join public.profiles p on p.id = (
    case 
      when m.user1_id = current_user_id then m.user2_id 
      else m.user1_id 
    end
  )
  where (m.user1_id = current_user_id or m.user2_id = current_user_id)
  and m.status = 'matched';
end;
$$;
```
