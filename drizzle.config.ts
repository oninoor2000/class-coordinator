import type { Config } from 'drizzle-kit';

import 'dotenv/config';

export default {
  schema: './app/lib/server/db/schema.ts',
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
} satisfies Config;
