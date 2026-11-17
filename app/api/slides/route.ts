import { api, bad, exec, getTenant, imagePath, loadSlides, requireAdmin, str, tx } from "../../server";
import type { Slide } from "../../store";

// Main hero slides. Nothing else references a slide, so the whole list is simply replaced.
export const PUT = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const list = ((await req.json()).list ?? []) as Slide[];
  if (list.length > 10) throw bad("슬라이드는 10장까지 넣을 수 있습니다.");
  return tx(async (c) => {
    await exec("DELETE FROM slides WHERE franchise_id = ?", [t.id], c);
    for (const [n, s] of list.entries()) {
      const image = imagePath(s.image);
      if (!image) throw bad(`${n + 1}번 슬라이드에 사진을 올려주세요.`);
      const pos = /^\d{1,3}% \d{1,3}%$/.test(s.pos) ? s.pos : "50% 50%"; // object-position, e.g. "50% 15%"
      await exec("INSERT INTO slides (franchise_id, image_path, eyebrow, title, body, pos, sort_order) VALUES (?,?,?,?,?,?,?)", [t.id, image, str(s.eyebrow, 100), str(s.title, 200), str(s.text, 300), pos, n], c);
    }
    return { slides: await loadSlides(t.id, c) };
  });
});
