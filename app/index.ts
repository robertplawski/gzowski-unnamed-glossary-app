import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { usersTable } from './db/schema';
async function main() {
  console.log(process.env.TURSO_URL)
  console.log(process.env.TURSO_TOKEN)
  const client = createClient({
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_TOKEN!
  });
  const db = drizzle({ client });
  const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };

  await db.insert(usersTable).values(user);
  console.log('New user created!')

  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users)

  await db
    .update(usersTable)
    .set({
      age: 31,
    })
    .where(eq(usersTable.email, user.email));
  console.log('User info updated!')

  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('User deleted!')
}
main();

