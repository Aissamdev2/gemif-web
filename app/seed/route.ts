import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { users, events, subjects, primitive_subjects } from '../lib/placeholder-data';
import { GITHUB_TOKENS } from '../lib/utils';

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      year VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#000000',
      logincount INTEGER NOT NULL DEFAULT 0,
      lastseen TIMESTAMP NOT NULL DEFAULT NOW(),
      password TEXT NOT NULL,
      assignedgithubtoken TEXT NOT NULL,
      FOREIGN KEY (assignedgithubtoken) REFERENCES githubtokens(githubtoken)
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, year, role, email, color, password, assignedgithubtoken) VALUES (${user.id}, ${user.name}, ${user.year}, ${user.role}, ${user.email}, ${user.color}, ${hashedPassword}, ${user.assignedgithubtoken})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  return insertedUsers;
}

async function seedGithubTokens() {

  await client.sql`
    CREATE TABLE IF NOT EXISTS githubtokens (
      githubtoken TEXT PRIMARY KEY,
      assigned BOOLEAN NOT NULL DEFAULT FALSE
    );
  `;

  const insertedTokens = await Promise.all(
    GITHUB_TOKENS.map(async (token, index) => {
      let assigned = false;
      if (index < 3) {
        assigned = true;
      }
      return client.sql`
        INSERT INTO githubtokens (githubtoken, assigned) VALUES (${token}, ${assigned})
        ON CONFLICT (githubtoken) DO NOTHING;
      `;
    }),
  );
  return insertedTokens;
}

async function seedMessages() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      scope VARCHAR(255) NOT NULL,
      year VARCHAR(255),
      createdat TIMESTAMP DEFAULT NOW(),
      userId UUID NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
}

async function seedSubjects() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS subjects (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color TEXT NOT NULL,
      bgColor TEXT NOT NULL,
      borderColor TEXT NOT NULL,
      year VARCHAR(255),
      quadri VARCHAR(255),
      archived BOOLEAN NOT NULL,
      score REAL,
      primitiveId VARCHAR(255) NOT NULL,
      userId UUID NOT NULL,
      FOREIGN KEY (primitiveId) REFERENCES primitive_subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  // const insertedSubjects = await Promise.all(
  //   subjects.map(async (subject) => {
  //     return client.sql`
  //       INSERT INTO subjects (id, name, color, bgColor, borderColor, userId)
  //       VALUES (${subject.id}, ${subject.name}, ${subject.color}, ${subject.bgColor}, ${subject.borderColor}, ${subject.userId})
  //       ON CONFLICT (id) DO NOTHING;
  //     `;
  //   }),
  // );
  return undefined;
}

async function seedPrimitiveSubjects() { 
  await client.sql`
    CREATE TABLE IF NOT EXISTS primitive_subjects (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color TEXT NOT NULL,
      bgColor TEXT NOT NULL,
      borderColor TEXT NOT NULL,
      year VARCHAR(255),
      quadri VARCHAR(255),
      professors TEXT[], -- Array of text
      emails TEXT[], -- Array of text
      credits VARCHAR(255) NOT NULL,
      userId UUID NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const insertedPrimitiveSubjects = await Promise.all(
    primitive_subjects.map(async (subject) => {
      // Convert the arrays to PostgreSQL-compatible array strings
      const professorsArray = `{${(subject.professors || []).map((p: string) => `"${p}"`).join(",")}}`;
      const emailsArray = `{${(subject.emails || []).map((e: string) => `"${e}"`).join(",")}}`;

      return client.sql`
        INSERT INTO primitive_subjects (
          id, name, color, bgColor, borderColor, year, quadri, professors, emails, credits, userId
        )
        VALUES (
          ${subject.id},
          ${subject.name},
          ${subject.color},
          ${subject.bgcolor},
          ${subject.bordercolor},
          ${subject.year},
          ${subject.quadri},
          ${professorsArray}, -- Formatted array for PostgreSQL
          ${emailsArray},     -- Formatted array for PostgreSQL
          ${subject.credits},
          ${subject.userid}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedPrimitiveSubjects;
}


async function seedEvents() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS events (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      time VARCHAR(255),
      scope VARCHAR(255) NOT NULL,
      userId UUID NOT NULL,
      subjectId UUID,
      primitiveId VARCHAR(255) NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `;

  // const insertedEvents = await Promise.all(
  //   events.map(async (event) => {
  //     return client.sql`
  //       INSERT INTO events (id, name, description, date, time, scope, userId, subjectId)
  //       VALUES (${event.id}, ${event.name}, ${event.description}, ${event.date}, ${event.time}, ${event.scope}, ${event.userId}, ${event.subjectId})
  //       ON CONFLICT (id) DO NOTHING;
  //     `;
  //   }),
  // );
  return undefined;
}

async function seedMainPosts() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS main_posts (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      fileName VARCHAR(255),
      link VARCHAR(255),
      userId UUID NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedGithubTokens();
    await seedUsers();
    await seedMainPosts();
    await seedMessages()
    await seedPrimitiveSubjects();
    await seedSubjects();
    await seedEvents();
    await client.sql`COMMIT`;

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}
