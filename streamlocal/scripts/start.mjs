// Arranque em produção: espera pela BD, corre migrations + seed e inicia o Next standalone.
import { execFileSync, spawnSync } from "node:child_process";
import net from "node:net";

function dbHostPort() {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return { host: u.hostname, port: Number(u.port || 5432) };
  } catch {
    return { host: "db", port: 5432 };
  }
}

async function waitForDb() {
  const { host, port } = dbHostPort();
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const s = net.connect({ host, port });
      s.on("connect", () => { s.end(); resolve(true); });
      s.on("error", () => resolve(false));
      setTimeout(() => { try { s.destroy(); } catch {} resolve(false); }, 3000);
    });
    if (ok) { console.log("[start] BD acessível."); return; }
    console.log("[start] A aguardar BD…");
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("[start] Timeout à espera da BD, a continuar…");
}

await waitForDb();
try {
  console.log("[start] A correr migrations…");
  execFileSync("npx", ["tsx", "src/db/migrate.ts"], { stdio: "inherit" });
} catch (e) {
  console.error("[start] Falha nas migrations (fatal em dev, segue em prod).", e);
}
try {
  console.log("[start] A correr seed (idempotente)…");
  execFileSync("npx", ["tsx", "src/db/seed.ts"], { stdio: "inherit" });
} catch (e) {
  console.error("[start] Seed falhou (não fatal).", e);
}
console.log("[start] A iniciar Next.js…");
const r = spawnSync("node", ["server.js"], { stdio: "inherit" });
process.exit(r.status ?? 0);
