import { beforeAll, afterAll } from 'vitest';
import { pool } from '../db/pool';

beforeAll(async () => {
  // Keep light for now.
  // Assumes DB is already migrated + seeded before test run.
  await pool.query('SELECT 1');
});

afterAll(async () => {
  await pool.end();
});
