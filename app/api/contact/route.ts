import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { contactAutoReplyEmail, renderEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// POST /api/contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { name, email, phone, subject, message } = parsed.data;

    await db.contactMessage.create({
      data: { name, email, phone, subject, message },
    });

    const rendered = renderEmail(contactAutoReplyEmail({ name, subject }));
    sendEmail(email, "We've Received Your Message — HAGE CLUB", rendered.html, rendered.text)
      .catch((err) => console.error("[contact] auto-reply email error:", err));

    return success(null, "Message sent successfully!", 201);
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return error("Something went wrong", 500);
  }
}
