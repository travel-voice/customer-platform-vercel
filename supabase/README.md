# Supabase Database Setup

## Running Migrations

To set up the database schema in your Supabase project:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/gmnzujwabnwjkjrprwlb
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref gmnzujwabnwjkjrprwlb

# Run migrations
supabase db push
```

## Database Schema Overview

### Tables

- **organizations**: Stores organization/company data
- **users**: Extends Supabase Auth users with custom fields (first_name, last_name, organization, etc.)
- **agents**: Voice agents created by users
- **calls**: Call recordings and transcripts from Vapi

### Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access data from their own organization
- Policies enforce multi-tenant data isolation

## Next Steps

After running the migration, the application will automatically:
1. Create organizations when new users sign up
2. Link users to their organizations
3. Sync agents with Vapi
4. Store call data from Vapi webhooks
