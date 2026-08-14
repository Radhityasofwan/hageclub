"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/client";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  async function fetchProfile() {
    try {
      const res = await fetch("/api/account/profile");
      const json = await res.json();
      const data = json.data ?? {};
      setFirstName(data.firstName ?? "");
      setLastName(data.lastName ?? "");
      setPhone(data.phone ?? "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user) fetchProfile();
  }, [session]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const json = await res.json();
      setProfileMsg(
        json.message ?? (res.ok ? t("account.profileUpdated") : t("account.profileUpdateFailed"))
      );
    } catch {
      setProfileMsg(t("account.errorOccurred"));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg(t("account.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg(t("account.passwordMinLength"));
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      setPasswordMsg(
        json.message ?? (res.ok ? t("account.passwordUpdated") : t("account.passwordUpdateFailed"))
      );
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      setPasswordMsg(t("account.errorOccurred"));
    } finally {
      setPasswordSaving(false);
    }
  }

  const isErrorMsg = (msg: string) => {
    const id = msg.includes("Gagal") || msg.includes("kesalahan") || msg.includes("cocok") || msg.includes("minimal");
    const en = /failed|error|match|at least/i.test(msg);
    return id || en;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
        <h1 className="text-xl font-bold">{t("account.profileTitle")}</h1>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-8 md:max-w-3xl md:py-10">
      <h1 className="text-xl font-bold">{t("account.profileTitle")}</h1>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted">{t("account.personalInfo")}</h2>

        <Input
          label={t("auth.email")}
          value={session?.user?.email ?? ""}
          disabled
        />
        <p className="text-[10px] text-muted -mt-2">{t("account.emailLocked")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("account.firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label={t("account.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label={t("account.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} required />

        {profileMsg && (
          <p className={`text-xs ${isErrorMsg(profileMsg) ? "text-destructive" : "text-success"}`}>{profileMsg}</p>
        )}

        <Button variant="primary" type="submit" loading={profileSaving}>
          {t("account.saveChanges")}
        </Button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePasswordSubmit} className="border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted">{t("account.changePassword")}</h2>

        <Input
          label={t("account.currentPassword")}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("account.newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label={t("account.confirmPassword")}
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>

        {passwordMsg && (
          <p className={`text-xs ${isErrorMsg(passwordMsg) ? "text-destructive" : "text-success"}`}>{passwordMsg}</p>
        )}

        <Button variant="primary" type="submit" loading={passwordSaving}>
          {t("account.updatePassword")}
        </Button>
      </form>
    </div>
  );
}
