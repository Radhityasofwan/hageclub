"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ productId, className, size = "md" }: WishlistButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { data: session, status } = useSession();
  const wishlistIds = useWishlistStore((s) => s.ids);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const resetWishlist = useWishlistStore((s) => s.reset);
  const toggleWishlistApi = useWishlistStore((s) => s.toggle);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const isWishlisted = wishlistIds.includes(productId);

  useEffect(() => {
    if (session?.user?.id) {
      hydrate(session.user.id);
    } else {
      resetWishlist();
    }
  }, [session?.user?.id, hydrate, resetWishlist]);

  async function doToggle() {
    const result = await toggleWishlistApi(productId);
    if (!result.ok) {
      if (result.needsAuth) {
        router.push("/account");
        return;
      }
      toast(t("product.wishlistError"), { variant: "error" });
      return;
    }
    toast(
      result.added ? t("product.savedToWishlist") : t("product.removedFromWishlist"),
      {
        variant: "info",
        ...(result.added && { action: { label: t("product.viewWishlist"), href: "/account?tab=wishlist" } }),
      }
    );
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status === "loading" || saving) return;
    if (!session?.user) {
      router.push("/account");
      return;
    }
    setSaving(true);
    doToggle().finally(() => setSaving(false));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? t("product.removeFromWishlist") : t("product.addToWishlist")}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5",
        "text-primary backdrop-blur transition-all hover:bg-white hover:shadow-md active:scale-90",
        size === "md" ? "w-10 h-10" : "w-9 h-9",
        className
      )}
    >
      <svg
        width={size === "md" ? 18 : 16}
        height={size === "md" ? 18 : 16}
        viewBox="0 0 16 16"
        fill={isWishlisted ? "currentColor" : "none"}
        aria-hidden="true"
      >
        <path
          d="M8 14S2 10 2 6C2 4 3.5 3 5.5 3c1 0 1.9.5 2.5 1.2C8.6 3.5 9.5 3 10.5 3c2 0 3.5 1 3.5 3C14 10 8 14 8 14Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
