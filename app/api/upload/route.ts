import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { api, bad, getTenant, requireAdmin, uploadDir } from "../../server";

// Admin photo upload. The browser already re-encodes to a downscaled JPEG, so only JPEG up to 5 MB is accepted.
// ponytail: files are never deleted (a franchise's copied menu shares the HQ file); sweep unreferenced files if disk ever matters.
export const POST = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw bad("파일이 없습니다.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) throw bad("사진은 5MB 이하만 올릴 수 있습니다.");
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) throw bad("JPEG 이미지만 올릴 수 있습니다.");
  const name = `${randomBytes(8).toString("hex")}.jpg`;
  await mkdir(path.join(uploadDir(), t.slug), { recursive: true });
  await writeFile(path.join(uploadDir(), t.slug, name), buf);
  return { path: `/uploads/${t.slug}/${name}` };
});
