import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, client } from "./index";

async function main() {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations aplicadas com sucesso.");
  await client.end();
}

main().catch(async (e) => {
  console.error("Falha nas migrations:", e);
  await client.end().catch(() => {});
  process.exit(1);
});
