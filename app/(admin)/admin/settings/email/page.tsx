import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllSettings } from "@/lib/settings";
import { EmailSettingsForm } from "./email-settings-form";

export const metadata: Metadata = { title: "Email Settings" };
export const dynamic = "force-dynamic";

export default async function AdminEmailSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/admin");

  const allSettings = await getAllSettings();
  const emailSettings = allSettings.filter((s) => s.group === "email");

  const settings = emailSettings.map((s) => ({
    key: s.key,
    label: s.label,
    hint: s.hint ?? "",
    isSecret: s.isSecret,
    value: s.isSecret && s.value ? "••••••••" : (s.value ?? ""),
    hasValue: s.isSecret ? Boolean(s.value) : undefined,
  }));

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Email Settings</h1>
        <p className="text-sm text-muted mt-1">
          Konfigurasi SMTP untuk pengiriman email otomatis (verifikasi akun, notifikasi pesanan, reset password).
        </p>
      </div>
      <EmailSettingsForm settings={settings} adminEmail={session.user.email} />
    </div>
  );
}
