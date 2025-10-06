import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon("postgres://neondb_owner:npg_APZna3uoWtM0@ep-billowing-queen-a2rd41pm-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require");
export const db = drizzle(sql);