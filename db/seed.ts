// scripts/seed.ts
import { SBJ_FINAL } from '@/lib/utils';
import { db } from './db.server';

// import your tables (adjust the path to your project)
import { primitiveSubjectsTable, primitiveUsersTable } from './schema';
// import { USERS } from '@/lib/secrets';

async function main() {

  try {
      await db.insert(primitiveSubjectsTable).values(
        SBJ_FINAL.map((p) => ({
          id: p.id,
          name: p.name,
          quadri: p.quadri,
          year: p.year,
          professors: p.professors,
          emails: p.emails,
          credits: p.credits,
          info: {'a': 'a'}
        }))
      );

      // await db.insert(primitiveUsersTable).values(
      //   USERS.map((user) => ({
      //     name: user.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      //   }))
      // );

    
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  }
}

main();
