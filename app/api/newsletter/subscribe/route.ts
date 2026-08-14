import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { newsletterWelcomeEmail, renderEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

// POST /api/newsletter/subscribe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return error("Invalid email address", 400);
    }

    const { email } = parsed.data;

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return success(null, "You're already subscribed!");
    }

    await db.newsletterSubscriber.create({ data: { email } });

    sendEmail(
      email,
      "Welcome to HAGE CLUB Newsletter",
      renderEmail(newsletterWelcomeEmail()).html,
      renderEmail(newsletterWelcomeEmail()).text
    ).catch((err) => console.error("[newsletter/subscribe] email error:", err));

    return success(null, "Thank you for subscribing!", 201);
  } catch (err) {
    console.error("[POST /api/newsletter/subscribe]", err);
    return error("Something went wrong", 500);
  }
}
