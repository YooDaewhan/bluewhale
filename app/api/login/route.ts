import { api, bad, clearSession, getTenant, q, setSession, verifyPassword } from "../../server";

// ponytail: brute force is throttled by nginx (limit_req on /api/login), not here
export const POST = api(async (req) => {
  const t = await getTenant();
  const { id, pw } = await req.json();
  const [a] = await q("SELECT id, login_id, name, password_hash FROM admins WHERE login_id = ? AND franchise_id = ?", [String(id), t.id]);
  if (!a || !verifyPassword(String(pw), a.password_hash)) throw bad("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  await setSession(a.id, t.id);
  return { user: { id: a.login_id, name: a.name, role: "admin" } };
});

export const DELETE = api(async () => {
  await clearSession();
});
