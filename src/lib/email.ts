import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Smart Pet ID <onboarding@resend.dev>";

export async function sendVerificationCode(email: string, code: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your verification code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Verify your email</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendScanAlert(
  ownerEmail: string,
  petName: string,
  latitude: number | null,
  longitude: number | null,
  finderPhone: string | null,
  scanTime: Date
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const staticMapUrl =
    latitude && longitude && process.env.GOOGLE_MAPS_SERVER_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_SERVER_KEY}`
      : null;

  const locationHtml = mapUrl
    ? `
      <div style="margin: 16px 0;">
        <p><strong>Scan location:</strong></p>
        ${staticMapUrl ? `<img src="${staticMapUrl}" alt="Scan location" style="width: 100%; border-radius: 8px; margin: 8px 0;" />` : ""}
        <a href="${mapUrl}" style="color: #2563eb; text-decoration: underline;">View on Google Maps</a>
      </div>
    `
    : `<p style="color: #71717a;">Location was not shared by the scanner.</p>`;

  const finderHtml = finderPhone
    ? `<p><strong>Finder's phone:</strong> <a href="tel:${finderPhone}">${finderPhone}</a></p>`
    : "";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `Alert: ${petName}'s tag was scanned!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #dc2626; margin: 0 0 8px 0;">Tag Scanned!</h2>
          <p style="margin: 0;">Someone scanned <strong>${petName}</strong>'s tag at ${scanTime.toLocaleString()}.</p>
        </div>
        ${locationHtml}
        ${finderHtml}
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
          Log in to your dashboard to view the full scan history.
        </p>
      </div>
    `,
  });
}
