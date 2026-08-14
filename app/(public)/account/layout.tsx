import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountPreLogin } from "@/components/account/account-pre-login";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <AccountPreLogin />;
  }

  return <>{children}</>;
}
