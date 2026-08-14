import nodemailer from "nodemailer";
import { getSettingValues } from "./settings";

async function createTransporter() {
  const cfg = await getSettingValues([
    "email_host", "email_port", "email_secure", "email_user", "email_pass",
  ]);

  const host = cfg.email_host ?? process.env.EMAIL_HOST ?? "";
  const port = Number(cfg.email_port ?? process.env.EMAIL_PORT ?? 465);
  const secure = (cfg.email_secure ?? process.env.EMAIL_SECURE ?? "true") === "true";
  const user = cfg.email_user ?? process.env.EMAIL_USER ?? "";
  const pass = cfg.email_pass ?? process.env.EMAIL_PASS ?? "";

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  const cfg = await getSettingValues(["email_from_name", "email_from_address", "email_user"]);
  const fromName = cfg.email_from_name ?? process.env.EMAIL_FROM_NAME ?? "HAGE CLUB";
  const fromAddr = cfg.email_from_address ?? process.env.EMAIL_FROM ?? cfg.email_user ?? process.env.EMAIL_USER ?? "";
  const from = `"${fromName}" <${fromAddr}>`;

  const transporter = await createTransporter();
  await transporter.sendMail({ from, to, subject, html, text: text ?? html.replace(/<[^>]*>/g, "") });
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

export function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verifikasi Email — HAGE CLUB</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 20px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#1C1C1E;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.3em;color:rgba(255,255,255,0.4);text-transform:uppercase;">Welcome to</p>
          <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.15em;color:#ffffff;text-transform:uppercase;">HAGE CLUB</h1>
          <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;">The Pinnacle of Refined Comfort</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#1C1C1E;">Verifikasi Alamat Email</h2>
          <p style="margin:0 0 8px;font-size:14px;color:#6B6B6B;line-height:1.6;">Halo, <strong style="color:#1C1C1E;">${name}</strong>!</p>
          <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;">
            Terima kasih telah mendaftar di HAGE CLUB. Klik tombol di bawah untuk memverifikasi alamat email kamu dan mulai berbelanja.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${verifyUrl}" style="display:inline-block;background:#1C1C1E;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.05em;">
                  Verifikasi Email Saya
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:28px 0 0;font-size:12px;color:#9B9B9B;line-height:1.6;">
            Atau salin dan tempel URL ini ke browser kamu:<br />
            <a href="${verifyUrl}" style="color:#1C1C1E;word-break:break-all;">${verifyUrl}</a>
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#9B9B9B;">
            Link verifikasi berlaku selama <strong>24 jam</strong>. Jika kamu tidak mendaftar, abaikan email ini.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#F5F5F5;padding:20px 40px;text-align:center;border-top:1px solid #E5E5EA;">
          <p style="margin:0;font-size:11px;color:#9B9B9B;">© 2025 HAGE CLUB. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
