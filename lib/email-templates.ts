import { formatPrice } from "./utils";

// =============================================================================
// UTILITY
// =============================================================================

const BRAND_COLOR = "#1C1C1E";

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HAGE CLUB</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:3px;margin:0;text-transform:uppercase;">HAGE CLUB</h1>
              <p style="color:#999;font-size:11px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">The Pinnacle of Refined Comfort</p>
            </td>
          </tr>
          <!-- Body -->
          <tr><td style="padding:32px;">${content}</td></tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0 0 4px;">HAGE CLUB — Premium Automotive Lifestyle</p>
              <p style="color:#bbb;font-size:11px;margin:0;">
                <a href="{{STORE_URL}}" style="color:${BRAND_COLOR};text-decoration:none;">Visit Store</a>
                &nbsp;·&nbsp; <a href="{{STORE_URL}}/account/orders" style="color:${BRAND_COLOR};text-decoration:none;">My Orders</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="color:#bbb;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} HAGE CLUB. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function spacer(height = 16): string {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:${height}px;"></td></tr></table>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:#eee;margin:16px 0;"></td></tr></table>`;
}

// =============================================================================
// TEMPLATES
// =============================================================================

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; sku: string; price: number; quantity: number; subtotal: number }>;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  courier: string | null;
  courierService: string | null;
  shippingAddress: {
    recipientName: string;
    street: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
  };
  paymentMethod: string;
}

export function orderConfirmationEmail(data: OrderEmailData): { html: string; text: string } {
  const itemsTable = data.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatPrice(i.subtotal)}</td>
    </tr>`
    )
    .join("");

  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:${BRAND_COLOR};">Order Confirmed</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Thank you for your order, ${data.customerName}.</p>

    <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:${BRAND_COLOR};font-family:monospace;">${data.orderNumber}</p>
    </div>

    <h3 style="font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Items Ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;color:#999;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #eee;">Item</th>
          <th style="text-align:center;font-size:11px;color:#999;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #eee;">Qty</th>
          <th style="text-align:right;font-size:11px;color:#999;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsTable}</tbody>
    </table>

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;padding:4px 0;">Subtotal</td><td style="font-size:13px;padding:4px 0;text-align:right;">${formatPrice(data.subtotal)}</td></tr>
      ${data.discount > 0 ? `<tr><td style="font-size:13px;padding:4px 0;color:#22c55e;">Discount</td><td style="font-size:13px;padding:4px 0;text-align:right;color:#22c55e;">-${formatPrice(data.discount)}</td></tr>` : ""}
      <tr><td style="font-size:13px;padding:4px 0;">Shipping</td><td style="font-size:13px;padding:4px 0;text-align:right;">${data.shippingCost > 0 ? formatPrice(data.shippingCost) : "FREE"}</td></tr>
      <tr><td style="font-size:13px;padding:8px 0 0;font-weight:700;border-top:2px solid #eee;">Total</td><td style="font-size:13px;padding:8px 0 0;text-align:right;font-weight:700;border-top:2px solid #eee;">${formatPrice(data.total)}</td></tr>
    </table>

    ${spacer(24)}

    <h3 style="font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;color:#999;">Shipping Address</h3>
    <p style="font-size:13px;color:#333;margin:0;line-height:1.6;">
      ${data.shippingAddress.recipientName}<br/>
      ${data.shippingAddress.street}<br/>
      ${data.shippingAddress.district}, ${data.shippingAddress.city}, ${data.shippingAddress.province} ${data.shippingAddress.postalCode}
    </p>
    ${data.courier ? `<p style="font-size:12px;color:#666;margin:8px 0 0;">Courier: ${data.courier.toUpperCase()} ${data.courierService}</p>` : ""}

    ${spacer(24)}

    <p style="font-size:13px;color:#666;margin:0;">Payment method: <strong>${data.paymentMethod}</strong></p>
    <p style="font-size:13px;color:#666;margin:8px 0 0;">
      Please complete your payment to process your order. You can track your order status at any time.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="{{STORE_URL}}/track-order?order=${data.orderNumber}" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Track Your Order</a>
        </td>
      </tr>
    </table>
  `);

  const text = `Order Confirmed\n\nThank you for your order, ${data.customerName}.\n\nOrder Number: ${data.orderNumber}\n\nItems:\n${data.items.map((i) => `  ${i.name} x${i.quantity} — ${formatPrice(i.subtotal)}`).join("\n")}\n\nTotal: ${formatPrice(data.total)}\n\nTrack your order: {{STORE_URL}}/track-order?order=${data.orderNumber}`;

  return { html, text };
}

export function paymentConfirmedEmail(data: { orderNumber: string; customerName: string; total: number }): { html: string; text: string } {
  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:#22c55e;">Payment Confirmed ✓</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Thank you, ${data.customerName}. Your payment has been confirmed.</p>

    <div style="background:#f9f9f9;padding:16px;border-radius:4px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:${BRAND_COLOR};font-family:monospace;">${data.orderNumber}</p>
      <p style="margin:0;font-size:14px;color:#666;">Total Paid: <strong>${formatPrice(data.total)}</strong></p>
    </div>

    ${spacer()}

    <p style="font-size:13px;color:#666;margin:0;">We are now processing your order. You will receive another email when your order has been shipped.</p>

    <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="{{STORE_URL}}/track-order?order=${data.orderNumber}" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Track Your Order</a>
        </td>
      </tr>
    </table>
  `);

  const text = `Payment Confirmed\n\nThank you, ${data.customerName}. Your payment has been confirmed.\n\nOrder Number: ${data.orderNumber}\nTotal Paid: ${formatPrice(data.total)}\n\nTrack your order: {{STORE_URL}}/track-order?order=${data.orderNumber}`;

  return { html, text };
}

export function orderShippedEmail(data: { orderNumber: string; customerName: string; courier: string; courierService: string; trackingNumber: string; estimatedDelivery?: string }): { html: string; text: string } {
  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:${BRAND_COLOR};">Your Order is on the Way! 🚚</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Hi ${data.customerName}, your order has been shipped.</p>

    <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_COLOR};font-family:monospace;">${data.orderNumber}</p>

      <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${BRAND_COLOR};font-family:monospace;">${data.trackingNumber}</p>
      <p style="margin:0;font-size:12px;color:#666;">${data.courier.toUpperCase()} — ${data.courierService}</p>
      ${data.estimatedDelivery ? `<p style="margin:8px 0 0;font-size:12px;color:#666;">Estimated delivery: ${data.estimatedDelivery}</p>` : ""}
    </div>

    <p style="font-size:13px;color:#666;margin:0;">You can track your package in real-time using the tracking number above on the courier's website or through our order tracking page.</p>

    <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="{{STORE_URL}}/track-order?order=${data.orderNumber}" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Track Your Package</a>
        </td>
      </tr>
    </table>
  `);

  const text = `Your Order is on the Way!\n\nHi ${data.customerName}, your order has been shipped.\n\nOrder: ${data.orderNumber}\nTracking: ${data.trackingNumber}\nCourier: ${data.courier.toUpperCase()} ${data.courierService}\n\nTrack: {{STORE_URL}}/track-order?order=${data.orderNumber}`;

  return { html, text };
}

export function passwordResetEmail(data: { name: string; token: string }): { html: string; text: string } {
  const resetUrl = `{{STORE_URL}}/reset-password/${data.token}`;

  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:${BRAND_COLOR};">Reset Your Password</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Hi ${data.name}, we received a request to reset your password.</p>

    <p style="font-size:13px;color:#333;margin:0 0 16px;line-height:1.6;">
      Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="${resetUrl}" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Reset Password</a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#999;margin:24px 0 0;line-height:1.6;">
      If you didn't request this, please ignore this email. Your password will remain unchanged.<br/>
      If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="font-size:11px;color:#666;word-break:break-all;margin:8px 0 0;">${resetUrl}</p>
  `);

  const text = `Reset Your Password\n\nHi ${data.name},\n\nReset your password here (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`;

  return { html, text };
}

export function newsletterWelcomeEmail(): { html: string; text: string } {
  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:${BRAND_COLOR};">Welcome to HAGE CLUB</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">You're now subscribed to our newsletter.</p>

    <p style="font-size:13px;color:#333;margin:0 0 16px;line-height:1.6;">
      Be the first to know about new arrivals, exclusive offers, and stories from the HAGE CLUB world.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="{{STORE_URL}}/shop" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Shop Now</a>
        </td>
      </tr>
    </table>
  `);

  const text = `Welcome to HAGE CLUB\n\nYou're now subscribed to our newsletter.\n\nBe the first to know about new arrivals, exclusive offers, and stories from the HAGE CLUB world.\n\nShop now: {{STORE_URL}}/shop`;

  return { html, text };
}

export function contactAutoReplyEmail(data: { name: string; subject: string }): { html: string; text: string } {
  const html = wrapper(`
    <h2 style="font-size:18px;margin:0 0 4px;color:${BRAND_COLOR};">We've Received Your Message</h2>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Thank you for reaching out, ${data.name}.</p>

    <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Subject</p>
      <p style="margin:0;font-size:14px;color:${BRAND_COLOR};">${data.subject}</p>
    </div>

    <p style="font-size:13px;color:#333;margin:0;line-height:1.6;">
      Our team will get back to you within 1–2 business days. In the meantime, feel free to browse our store.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="background:${BRAND_COLOR};border-radius:4px;padding:10px 24px;">
          <a href="{{STORE_URL}}/shop" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Browse Collection</a>
        </td>
      </tr>
    </table>
  `);

  const text = `We've Received Your Message\n\nThank you for reaching out, ${data.name}.\n\nSubject: ${data.subject}\n\nOur team will get back to you within 1–2 business days.`;

  return { html, text };
}

/**
 * Replace {{STORE_URL}} placeholder with actual store URL.
 */
export function renderEmail(
  template: { html: string; text: string },
  storeUrl?: string
): { html: string; text: string } {
  const url = storeUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";
  return {
    html: template.html.replace(/\{\{STORE_URL\}\}/g, url),
    text: template.text.replace(/\{\{STORE_URL\}\}/g, url),
  };
}
