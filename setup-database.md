# Database Setup: temporary_assignments Table

Since MCP Supabase tools are not available in the current environment, here are several ways to create the `temporary_assignments` table:

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://xniocmtnfkaxvzfzrnna.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create-table.sql` 
4. Click "Run" to execute the SQL

## Option 2: Install and Use Supabase CLI

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xniocmtnfkaxvzfzrnna

# Run the SQL file
supabase db reset --linked
# Or execute SQL directly:
supabase db sql --file create-table.sql
```

## Option 3: Use psql (if you have PostgreSQL client)

```bash
# Connect using psql with the database URL from your Supabase project
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xniocmtnfkaxvzfzrnna.supabase.co:5432/postgres" -f create-table.sql
```

## Option 4: Use the API Script (Attempt via REST API)

I've created a Node.js script that attempts to execute the SQL, but due to Supabase security restrictions, DDL operations need to be performed through the dashboard or CLI.

## Verification

After creating the table, you can verify it exists by:

1. **Through Supabase Dashboard**: Check the Table Editor
2. **Through your application**: Try to query the table
3. **SQL Query**: Run `SELECT * FROM information_schema.tables WHERE table_name = 'temporary_assignments';`

## Table Structure Created

The `create-table.sql` file will create:

```sql
CREATE TABLE public.temporary_assignments (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL,
  driver_name TEXT NOT NULL,
  vehicle_id INTEGER NOT NULL,
  plate_number TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);
```

Plus indexes and RLS policies for performance and security.

## Next Steps

After creating the table, you may want to:

1. Update your TypeScript types in `src/types/supabase.ts`
2. Create service functions in `src/services/temporaryAssignmentService.ts`
3. Test the table with your application