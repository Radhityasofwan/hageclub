import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettingValues, updateSettings } from "@/lib/settings";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/popup-config
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const settings = await getSettingValues([
    "popup_display_mode",
    "popup_rotation_minutes",
    "popup_delay_seconds",
    "popup_cooldown_hours",
    "popup_reminder_days",
  ]);
  return success({
    displayMode: settings.popup_display_mode ?? "priority",
    rotationMinutes: Number(settings.popup_rotation_minutes) || 30,
    delaySeconds: Number(settings.popup_delay_seconds) || 2,
    cooldownHours: Number(settings.popup_cooldown_hours) || 24,
    reminderDays: Number(settings.popup_reminder_days) ?? 1,
  });
}

// PUT /api/admin/popup-config
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const { displayMode, rotationMinutes, delaySeconds, cooldownHours, reminderDays } = body as {
    displayMode?: string;
    rotationMinutes?: number;
    delaySeconds?: number;
    cooldownHours?: number;
    reminderDays?: number;
  };

  if (displayMode !== "priority" && displayMode !== "rotation") {
    return error("displayMode must be 'priority' or 'rotation'", 400);
  }
  const minutes = Math.max(1, Number(rotationMinutes) || 30);
  const delay = Math.max(0, Number(delaySeconds) || 2);
  const cooldown = Math.max(1, Number(cooldownHours) || 24);
  const reminder = Math.max(0, Number(reminderDays ?? 1));

  await updateSettings([
    { key: "popup_display_mode", value: displayMode },
    { key: "popup_rotation_minutes", value: String(minutes) },
    { key: "popup_delay_seconds", value: String(delay) },
    { key: "popup_cooldown_hours", value: String(cooldown) },
    { key: "popup_reminder_days", value: String(reminder) },
  ], session.user.id);

  return success({ displayMode, rotationMinutes: minutes, delaySeconds: delay, cooldownHours: cooldown, reminderDays: reminder }, "Popup config saved");
}
