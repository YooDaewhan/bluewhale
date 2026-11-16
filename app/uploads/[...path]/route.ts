import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "../../server";

// Serves /uploads/<tenant>/<16 hex>.jpg written by /api/upload. The strict pattern is the path-traversal guard.
// ponytail: served by Node; add an nginx `location /uploads/` alias if photo traffic ever matters.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [tenant, file, ...rest] = (await params).path;
  if (rest.length || !/^[a-z0-9-]{1,30}$/.test(tenant ?? "") || !/^[a-f0-9]{16}\.jpg$/.test(file ?? "")) return new Response(null, { status: 404 });
  try {
    const buf = await readFile(path.join(uploadDir(), tenant, file));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
