import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettingValues } from "@/lib/settings";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const now = new Date();
    const nowTs = now.getTime();

    const settings = await getSettingValues([
      "popup_display_mode",
      "popup_rotation_minutes",
      "popup_delay_seconds",
      "popup_cooldown_hours",
      "popup_reminder_days",
    ]);
    const mode = settings.popup_display_mode ?? "priority";
    const rotationMinutes = Math.max(1, Number(settings.popup_rotation_minutes) || 30);
    const delaySeconds = Math.max(0, Number(settings.popup_delay_seconds) || 2);
    const cooldownHours = Math.max(1, Number(settings.popup_cooldown_hours) || 24);
    const reminderDays = Math.max(0, Number(settings.popup_reminder_days) ?? 1);

    const where = {
      showAsPopup: true,
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    const orderBy = [
      { popupPriority: { sort: "asc" as const, nulls: "last" as const } },
      { createdAt: "desc" as const },
    ];
    const select = {
      id: true, popupTitle: true, type: true, value: true,
      minPurchase: true, maxDiscount: true,
      usageLimit: true, endDate: true,
      code: true,
      usedCount: true,
    };

    // Load all candidates: priority mode also needs to skip claimed ones
    const all = await db.coupon.findMany({ where, select, orderBy });
    if (all.length === 0) return success(null);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    // couponId → claimed by this user
    const claimedMap = new Map<string, boolean>();
    if (userId) {
      const claims = await db.voucherClaim.findMany({
        where: { userId, couponId: { in: all.map((c) => c.id) } },
        select: { couponId: true },
      });
      claims.forEach((c) => claimedMap.set(c.couponId, true));
    }

    const startIdx =
      mode === "rotation"
        ? Math.floor(nowTs / (rotationMinutes * 60 * 1000)) % all.length
        : 0;

    // Pick the first candidate this user may see: unclaimed, or claimed but
    // inside the reminder window (H-N before expiry).
    let coupon: Awaited<ReturnType<typeof db.coupon.findFirst<{ select: typeof select }>>> = null;
    for (let i = 0; i < all.length; i++) {
      const candidate = all[(startIdx + i) % all.length];
      const claimed = claimedMap.get(candidate.id) ?? false;
      if (!claimed) { coupon = candidate; break; }
      const endTs = candidate.endDate ? new Date(candidate.endDate).getTime() : null;
      const msLeft = endTs ? endTs - nowTs : null;
      const inReminder =
        reminderDays > 0 && msLeft != null && msLeft > 0 && msLeft < reminderDays * DAY_MS;
      if (inReminder) { coupon = candidate; break; }
    }

    // Claimed vouchers are permanently suppressed outside the reminder window
    if (!coupon) return success(null);

    const userClaimedCode = claimedMap.get(coupon.id) ? coupon.code : null;

    return success({
      id: coupon.id,
      popupTitle: coupon.popupTitle,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      endDate: coupon.endDate,
      userClaimedCode,
      delaySeconds,
      cooldownHours,
      reminderDays,
    });
  } catch (err) {
    console.error("[GET /api/promotions/active]", err);
    return error("Failed to fetch promotion", 500);
  }
}
