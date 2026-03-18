import dotenv from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL not set in environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration SQL
    const migrationPath = join(__dirname, '../../migrations/001_init_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('✓ Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
