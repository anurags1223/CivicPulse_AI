# Supabase backend

The application uses Supabase Auth, PostgreSQL, Storage and the generated REST
API. The executable backend logic is in supabase/schema.sql: server scoring,
authorization, status transitions, audit triggers, private evidence storage and
row-level security. No separate Node/Express server is needed for this app.

For a NEW Supabase project:
1. Replace bikeesah30@gmail.com in schema.sql with your approved staff email (if different).
2. Run schema.sql once in the Supabase SQL editor. Do not rerun it on the existing
   CivicPulse database; it has already been applied there.
3. Configure custom SMTP, leave email verification enabled, and set the Site URL
   and allowed Redirect URL to your frontend's deployed address.
4. Put the project URL and publishable key into frontend/.env.local.
5. Register and verify the approved staff email. Other accounts are citizens.

The schema contains SQL functions and policies, not a database data export.
No existing users, sessions, uploaded photos or report data are in this archive.
tests/database.sql exercises the real policies and workflow in a transaction,
then rolls back. Run it in the project's SQL editor for integration checks.
