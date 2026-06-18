# Othrhalff Project Rules and Database Reference

This file contains behavioral constraints and reference information for the Othrhalff codebase, database, and migration details.

## 1. Project Reference Keys
- **Old Supabase Project ID:** `htepqqigtzmllailykas`
- **New Supabase Project ID:** `cthyiegohnvqtepzoqjf`
- **Rule:** When updating environment configurations, preserve the old project URLs and anon/service keys by commenting them out at the bottom of the `.env` files. Do not delete them.

## 2. Database Migration Cheatsheet
When executing queries or data transfers between the environments:
- **Pagination Limit:** Supabase's PostgREST API restricts SELECT results to 1,000 rows by default. To dump or select large tables (like `swipes` or `notifications`), use offset-based pagination in a loop (`limit=1000&offset=N`) to avoid silent truncation.
- **Orphaned Row Handling:** Pre-filter foreign key relationships (e.g., `user_id` in `notifications`) to exclude records pointing to non-existent profiles, avoiding constraint errors during batch insertion.
- **Dashboard Visibility:** Any directly inserted user in `auth.users` must have their `instance_id` column explicitly set to `'00000000-0000-0000-0000-000000000000'` (all zeros) for the Supabase Auth Dashboard to index and display them.

## 3. General constraints
- **Emojis:** Do not write emojis in code, commits, pull requests, comments, or logs.
- **Workspace cleanliness:**
  - Database JSON backups must reside in `db_backup/`, which is ignored by Git.
  - Custom assets must reside in `othrhalff_assets/` (using underscores instead of spaces to avoid shell scripting path escape errors).
  - Use the utility script at `db_backup/scripts/dump_schema.cjs` to refresh the database schema reference in `db infra.ignore` when schema changes occur.
