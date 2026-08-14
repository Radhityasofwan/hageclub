import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountSettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true, lastName: true, birthDate: true },
  });

  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    session.user.name?.slice(0, 2).toUpperCase() ||
    "HC";

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    session.user.name ||
    "";

  return (
    <AccountSettingsClient
      initials={initials}
      fullName={fullName}
      email={session.user.email ?? ""}
      birthDate={profile?.birthDate?.toISOString() ?? null}
    />
  );
}
