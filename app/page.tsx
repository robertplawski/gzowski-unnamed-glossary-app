import { getDb } from "./index";
import { usersTable } from "./db/schema";

export default async function Home() {
  "use server"
  const db = await getDb()
  return (

    <div>
      {JSON.stringify(await db.select().from(usersTable))}
    </div >
  );
}
