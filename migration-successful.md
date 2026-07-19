# Othrhalff Database and Storage Migration Report

This document records the complete steps, details, and results of the data migration from the old Supabase project (`htepqqigtzmllailykas`) to the new production Supabase project (`cthyiegohnvqtepzoqjf`).

---

## 1. Migration Overview
- **Source Project Ref:** `htepqqigtzmllailykas`
- **Target Project Ref:** `cthyiegohnvqtepzoqjf`
- **Objects Migrated:**
  - 212 authentication users
  - 20 storage objects (4 in `images`, 16 in `glimpses` buckets)
  - 17 schema tables containing user profiles, swipes, matches, messages, confessions, reactions, polls, and active rooms.

---

## 2. Database Table Row Counts
Below is a comparison of the final row counts between the source database and the target database.

| Table Name | Source Row Count | Target Row Count | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `auth.users` | 212 | 212 | Successful | All users migrated with original UUIDs |
| `profiles` | 161 | 161 | Successful | Core profiles synced |
| `user_presence` | 161 | 161 | Successful | Presence records matched |
| `blocked_users` | 21 | 21 | Successful | Block records synced |
| `swipes` | 12,321 | 12,321 | Successful | Swipes fully recovered (see Section 3) |
| `matches` | 337 | 337 | Successful | Mutual matches synced |
| `messages` | 3 | 5 | Successful | 3 original + 2 test messages on target |
| `confessions` | 25 | 25 | Successful | Confessions synced |
| `confession_comments` | 26 | 26 | Successful | Comments synced |
| `confession_reactions` | 33 | 33 | Successful | Reactions synced |
| `poll_options` | 2 | 2 | Successful | Poll structures synced |
| `poll_votes` | 15 | 15 | Successful | Votes matched |
| `glimpses` | 16 | 16 | Successful | Glimpse feed records synced |
| `glimpse_reactions` | 20 | 20 | Successful | Glimpse reactions synced |
| `notifications` | 4,033 | 3,995 | Successful | 38 orphaned rows omitted (see Section 4) |
| `call_sessions` | 52 | 52 | Successful | Video/audio logs synced |
| `active_rooms` | 1 | 1 | Successful | Active session structure synced |
| `verification_requests` | 38 | 38 | Successful | ID verification logs synced |
| `career_inquiries` | 0 | 0 | Successful | Empty table |
| `support_tickets` | 0 | 0 | Successful | Empty table |

---

## 3. Resolving the PostgREST 1,000 Row Limit
The initial backups were truncated at exactly 1,000 rows for tables like `swipes` and `notifications`. This was due to the default row-limit capping implemented in Supabase's PostgREST API (queries without pagination return a maximum of 1,000 rows).
- **Issue:** The original export scripts used a simple limit parameter of 2,000, which still returned exactly 1,000 rows.
- **Solution:** We updated the extraction script to perform offset-based pagination (`limit=1000&offset=N` in a loop). This allowed us to successfully extract all 12,321 swipes and all 4,033 notifications from the source database.

---

## 4. Orphaned Notifications Handling
During insertion of the `notifications` table into the new database, the script encountered foreign key constraint violations:
- **Issue:** 38 notification rows in the source database referenced user profiles (`user_id`) that no longer existed in the `profiles` table.
- **Solution:** We filtered out the 38 orphaned rows before batch insertion. This allowed the remaining 3,995 valid notification records to insert successfully in batches of 200 without raising foreign key constraint errors or causing timeouts.

---

## 5. Auth Users & Dashboard Visibility
All 212 authentication users were extracted from the source database (including email logins and Google OAuth profiles) and inserted into the target database's `auth.users` table.
- **Issue:** Initially, the users did not show up in the Supabase Auth Dashboard, although they existed in the database and could log in.
- **Solution:** Supabase requires the `instance_id` column in the `auth.users` table to be set to `'00000000-0000-0000-0000-000000000000'` (all zeros) for dashboard indexation. Running a SQL update to assign this value immediately made all 212 users visible in the Supabase Auth dashboard.

---

## 6. Storage Bucket Migration
The source database contained 20 storage assets across two buckets:
- `images` (4 assets)
- `glimpses` (16 assets)

### Migration Steps:
1. Created identical storage buckets (`images` and `glimpses`) in the target Supabase project.
2. Enabled public access policies for both buckets in the new database.
3. Downloaded the files from the source project locally, preserving the directory paths and UUID structures.
4. Uploaded each asset to the target project's storage bucket using correct MIME headers (e.g., `image/png`, `image/jpeg`, `video/mp4`) and setting appropriate cache controls.
5. All 20 assets are fully operational in the new environment.

---

## 7. Functions, Triggers, and RLS Policies
All database schemas, constraints, custom PostgreSQL functions, RLS (Row Level Security) policies, and triggers were verified and confirmed working on the target project. This includes the `handle_updated_at` trigger on the `profiles` table, which automatically handles timestamp updates.

---

## 8. Directory Structure Cleanup
To keep the project repository clean, the following directory reorganizations were executed:
- The old partial database backups (`db_backup`) were deleted.
- The complete database backup directory (`db_backup_live`) was renamed to `db_backup` to serve as the single source of truth for the final backups.
- The data migration script (`server/migrate_data.cjs`) was relocated to `db_backup/scripts/migrate_data.cjs`.
- The temporary storage directory (`temp_storage`) was deleted.
- The temporary scratch folder (`scratch`) in the workspace root was deleted.
- Temporary files like `scorecard.png` were deleted.
