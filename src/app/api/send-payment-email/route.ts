// app/api/send-payment-email/route.ts  (Next.js App Router)
// -- OR --
// pages/api/send-payment-email.ts      (Next.js Pages Router — see bottom of file)
//
// Install: npm install nodemailer
// Install types: npm install -D @types/nodemailer

import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

// ─── Config (set these in .env.local) ─────────────────────────────────────────
// GMAIL_USER=ollanessentials@gmail.com
// GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   ← 16-char App Password (no spaces needed)
// STORE_NOTIFY_EMAIL=ollanessentials@gmail.com  ← where order alerts land

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── App Router handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      name,
      email,
      phone,
      deliveryOption,
      pickupLocation,
      deliveryAddress,
      transactionNumber,
      grandTotal,
      screenshotBase64,   // base64 string of the image (without the data:image/... prefix)
      screenshotMime,     // e.g. "image/jpeg" or "image/png"
    } = body;

    // Build attachment array — only attach if screenshot was provided
    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    if (screenshotBase64 && screenshotMime) {
      attachments.push({
        filename: `payment_${orderId}.${screenshotMime.split("/")[1]}`,
        content: screenshotBase64,
        encoding: "base64",
        contentType: screenshotMime,
      });
    }

    const deliveryInfo =
      deliveryOption === "pickup"
        ? "🏪 Pickup — Indy Hall, University of Ibadan"
        : `🚴 Express Delivery → ${pickupLocation} (${deliveryAddress})`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Ollan Essentials Orders" <${process.env.GMAIL_USER}>`,
      to: process.env.STORE_NOTIFY_EMAIL,
      replyTo: email,
      subject: `🛒 New Order ${orderId} — ₦${Number(grandTotal).toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <div style="background:#dc2626;padding:20px 24px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">New Order Received</h1>
            <p style="color:#fca5a5;margin:4px 0 0;font-size:13px;">Ollan Essentials</p>
          </div>
          <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;width:160px;">Order ID</td>
                <td style="padding:8px 0;font-weight:700;font-family:monospace;color:#111;">${orderId}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:8px 6px;color:#6b7280;">Customer</td>
                <td style="padding:8px 6px;font-weight:600;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#dc2626;">${email}</a></td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:8px 6px;color:#6b7280;">Phone</td>
                <td style="padding:8px 6px;">${phone}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;">Delivery</td>
                <td style="padding:8px 0;">${deliveryInfo}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:8px 6px;color:#6b7280;">Txn Reference</td>
                <td style="padding:8px 6px;font-family:monospace;">${transactionNumber}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;">Amount</td>
                <td style="padding:8px 0;font-size:18px;font-weight:800;color:#dc2626;">₦${Number(grandTotal).toLocaleString()}</td>
              </tr>
            </table>

            ${
              screenshotBase64
                ? `<div style="margin-top:20px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:600;">✅ Payment screenshot attached</p>
                    <p style="margin:0;font-size:12px;color:#4b5563;">Check the attachment to verify the transfer.</p>
                   </div>`
                : `<div style="margin-top:20px;padding:12px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">⚠️ No screenshot — customer entered transaction number manually.</p>
                   </div>`
            }

            <div style="margin-top:24px;padding:16px;background:#fef2f2;border-radius:8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#991b1b;">
                Search your inbox for <strong>${orderId}</strong> to find this order quickly.
              </p>
            </div>
          </div>
        </div>
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── Pages Router alternative ─────────────────────────────────────────────────
// If you're using pages/api instead of app/api, replace the export above with:
//
// import type { NextApiRequest, NextApiResponse } from "next";
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).end();
//   // ... same logic, replace NextResponse.json with res.json(...)
// }