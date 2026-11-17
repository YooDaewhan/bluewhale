import { api, getAdmin, getTenant, loadBaskets, loadFranchises, loadMembers, loadOrders, loadProducts, loadReservations, loadSlides } from "../../server";
import { HQ } from "../../tenant";

// everything the store needs on load, trimmed to what this visitor may see
export const GET = api(async () => {
  const t = await getTenant();
  const user = await getAdmin(t);
  const [products, baskets, slides, reservations] = await Promise.all([loadProducts(t.id), loadBaskets(t.id), loadSlides(t.id), loadReservations(t.id, !!user)]);
  return {
    tenant: t.slug,
    settings: { fruitsEnabled: t.fruitsEnabled },
    products,
    baskets,
    slides,
    reservations,
    user,
    orders: user ? await loadOrders(t.id) : [],
    members: user ? await loadMembers(t) : [],
    franchises: user && t.slug === HQ ? await loadFranchises() : [],
  };
});
