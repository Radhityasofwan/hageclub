export function gaEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.gtag === "function") {
    (w.gtag as (...args: unknown[]) => void)("event", action, params);
  }
}

export function fbEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.fbq === "function") {
    (w.fbq as (...args: unknown[]) => void)("track", action, params);
  }
}

export function trackPageView() {
  if (typeof window === "undefined") return;
  gaEvent("page_view", { page_location: window.location.href });
  fbEvent("PageView");
}

interface TrackProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}

export function trackViewItem(product: TrackProduct) {
  gaEvent("view_item", {
    currency: "IDR",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
  });
  fbEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    value: product.price,
    currency: "IDR",
  });
}

interface TrackCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function trackAddToCart(product: TrackCartItem) {
  gaEvent("add_to_cart", {
    currency: "IDR",
    value: product.price * product.quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
  });
  fbEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price * product.quantity,
    currency: "IDR",
  });
}

interface TrackPurchaseOrder {
  id: string;
  total: number;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}

export function trackPurchase(order: TrackPurchaseOrder) {
  gaEvent("purchase", {
    transaction_id: order.id,
    value: order.total,
    currency: "IDR",
    items: order.items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  fbEvent("Purchase", {
    value: order.total,
    currency: "IDR",
    content_ids: order.items.map((i) => i.id),
  });
}

interface TrackSearch {
  searchTerm: string;
  resultsCount?: number;
}

export function trackSearch({ searchTerm, resultsCount }: TrackSearch) {
  gaEvent("search", { search_term: searchTerm });
  fbEvent("Search", {
    search_string: searchTerm,
    content_ids: resultsCount ? [resultsCount] : undefined,
  });
}
