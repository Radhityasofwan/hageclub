import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries/order";
import { getI18n } from "@/lib/i18n/server";
import { OrderCard, type OrderCardOrder } from "@/components/account/order-card";
import { OrderFilterChips } from "@/components/account/order-filter-chips";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { t } = await getI18n();
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;

  // PAID masuk grup Diproses: webhook set order.status = "PAID" saat pembayaran
  // diterima, sebelum admin memproses — filter harus tetap menampilkan order tsb.
  const FILTERS: Array<{ key: string; label: string; statuses: string[] }> = [
    { key: "", label: t("account.filterAll"), statuses: [] },
    { key: "PENDING", label: t("account.statPendingPayment"), statuses: ["PENDING"] },
    { key: "PROCESSING", label: t("account.statProcessing"), statuses: ["PAID", "PROCESSING", "PACKED"] },
    { key: "SHIPPED", label: t("account.filterShipped"), statuses: ["SHIPPED"] },
    { key: "COMPLETED", label: t("account.filterCompleted"), statuses: ["DELIVERED", "COMPLETED"] },
    { key: "CANCELLED", label: t("account.filterCancelled"), statuses: ["CANCELLED", "REFUNDED"] },
  ];

  const activeFilter = FILTERS.find((f) => f.key === raw) ?? FILTERS[0];
  const result = await getUserOrders(session.user.id, 1, 50, activeFilter.statuses);
  const orders = result.orders;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
      <h1 className="text-xl font-bold">{t("account.orders")}</h1>

      {/* Status filter chips — scroll horizontal tanpa scrollbar, panah kecil di kanan */}
      <OrderFilterChips
        filters={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
        activeKey={activeFilter.key}
      />

      {orders.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-xl">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-muted mb-3">
            <path d="M3 6h18l-1.5 12H4.5L3 6zM7 6V4a2 2 0 014 0v2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {activeFilter.key !== "" ? (
            <>
              <p className="text-sm text-muted mb-1">{t("account.noOrdersFiltered")}</p>
              <p className="text-xs text-muted mb-4">{t("account.noOrdersFilteredDesc")}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted mb-1">{t("account.noOrders")}</p>
              <p className="text-xs text-muted mb-4">{t("account.noOrdersDesc")}</p>
            </>
          )}
          <Link href="/shop" className="text-sm text-primary hover:underline font-medium">
            {t("account.startShopping")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order as unknown as OrderCardOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
