-- Cleanup script to remove Role_old type and its dependencies
-- This is needed because a previous migration left dangling references

-- Drop the old users table if it exists (it's been replaced by separate tables)
DROP TABLE IF EXISTS users CASCADE;

-- Drop the Role_old type if it exists
DROP TYPE IF EXISTS "Role_old" CASCADE;
