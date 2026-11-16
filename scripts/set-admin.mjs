// Creates an admin account, or resets its password if the login id already exists.
//   node --env-file=.env.local scripts/set-admin.mjs <franchise-slug> <login-id> [name]
// Password comes from $ADMIN_PW; without it a random one is generated and printed once.
// Hash format matches hashPassword() in app/server.ts: "scrypt$<salt hex>$<hash hex>".
import mysql from "mysql2/promise";
import { randomBytes, scryptSync } from "node:crypto";

const [slug, login, name = "관리자"] = process.argv.slice(2);
if (!slug || !login || !process.env.DATABASE_URL) {
  console.error("usage: DATABASE_URL=... [ADMIN_PW=...] node scripts/set-admin.mjs <franchise-slug> <login-id> [name]");
  process.exit(1);
}
const pw = process.env.ADMIN_PW || randomBytes(9).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;

const db = await mysql.createConnection(process.env.DATABASE_URL);
const [[f]] = await db.query("SELECT id FROM franchises WHERE slug = ?", [slug]);
if (!f) {
  console.error(`franchise '${slug}' not found`);
  process.exit(1);
}
await db.query(
  "INSERT INTO admins (franchise_id, login_id, password_hash, name) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), franchise_id = VALUES(franchise_id)",
  [f.id, login, hash, name],
);
await db.end();
console.log(process.env.ADMIN_PW ? `admin '${login}' (${slug}) saved` : `admin '${login}' (${slug}) saved, password: ${pw}`);
