import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Tagz.au <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@smartpetid.com";

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
  itemName: string,
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
    subject: `Alert: ${itemName}'s tag was scanned!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #dc2626; margin: 0 0 8px 0;">Tag Scanned!</h2>
          <p style="margin: 0;">Someone scanned <strong>${itemName}</strong>'s tag at ${scanTime.toLocaleString()}.</p>
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

export async function sendContactNotification(
  name: string,
  email: string,
  phone: string | null,
  message: string
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #2563eb; margin: 0 0 8px 0;">New Contact Submission</h2>
          <p style="margin: 0;">Someone submitted the contact form on Tagz.au.</p>
        </div>
        <div style="margin: 16px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ""}
        </div>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px 0;"><strong>Message:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });
}

export async function sendChecklistAlert(
  ownerEmail: string,
  itemName: string,
  scannerName: string,
  results: { id: string; label: string; type: string; value: boolean | number | string }[],
  latitude: number | null,
  longitude: number | null,
  submittedAt: Date
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const locationHtml = mapUrl
    ? `
      <div style="margin: 16px 0;">
        <p><strong>Location:</strong> <a href="${mapUrl}" style="color: #2563eb; text-decoration: underline;">View on Google Maps</a></p>
      </div>
    `
    : `<p style="color: #71717a;">Location was not captured.</p>`;

  // Build results summary
  const checkboxItems = results.filter((r) => r.type === "checkbox");
  const checkedCount = checkboxItems.filter((r) => r.value === true).length;
  const totalCheckboxes = checkboxItems.length;

  const summaryHtml =
    totalCheckboxes > 0
      ? `<p style="margin: 8px 0;"><strong>Summary:</strong> ${checkedCount}/${totalCheckboxes} items checked</p>`
      : "";

  const resultsHtml = results
    .map((r) => {
      if (r.type === "checkbox") {
        const icon = r.value ? "&#9989;" : "&#10060;";
        return `<tr><td style="padding: 4px 8px;">${icon}</td><td style="padding: 4px 8px;">${r.label}</td></tr>`;
      }
      const displayValue = r.value !== "" && r.value !== undefined ? String(r.value) : "—";
      return `<tr><td style="padding: 4px 8px;">&#128221;</td><td style="padding: 4px 8px;"><strong>${r.label}:</strong> ${displayValue}</td></tr>`;
    })
    .join("");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `Checklist completed: ${itemName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #2563eb; margin: 0 0 8px 0;">Checklist Completed</h2>
          <p style="margin: 0;">A checklist was completed for <strong>${itemName}</strong>.</p>
        </div>
        <div style="margin: 16px 0;">
          <p><strong>Conducted by:</strong> ${scannerName}</p>
          <p><strong>Time:</strong> ${submittedAt.toLocaleString()}</p>
          ${summaryHtml}
        </div>
        ${locationHtml}
        <div style="margin: 16px 0;">
          <h3 style="font-size: 14px; margin: 0 0 8px 0;">Results</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${resultsHtml}
          </table>
        </div>
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
          Log in to your dashboard to view the full submission history.
        </p>
      </div>
    `,
  });
}

export async function sendTagBatchEmail(
  adminEmail: string,
  codes: string[],
  shortCodes: string[],
  batchId: string
) {
  const QRCode = (await import("qrcode")).default;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // Generate QR code PNGs for each tag (~3cm at 300dpi = 354px)
  const attachments = await Promise.all(
    shortCodes.map(async (shortCode, i) => {
      const shortUrl = `${baseUrl}/s/${shortCode}`;
      const buffer = await QRCode.toBuffer(shortUrl, {
        width: 354,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      return {
        filename: `${codes[i]}.png`,
        content: buffer,
      };
    })
  );

  const tagRows = codes
    .map((code, i) => {
      const shortUrl = `${baseUrl}/s/${shortCodes[i]}`;
      return `
        <tr style="border-bottom: 1px solid #e4e4e7;">
          <td style="padding: 8px 12px; font-family: monospace; font-size: 14px;">${code}</td>
          <td style="padding: 8px 12px; font-size: 13px;">
            <a href="${shortUrl}" style="color: #2563eb; text-decoration: underline;">${shortUrl}</a>
          </td>
          <td style="padding: 8px 12px; font-size: 13px; color: #71717a;">${code}.png</td>
        </tr>`;
    })
    .join("");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Tag Batch Generated: ${codes.length} codes (${batchId.slice(0, 8)})`,
    attachments,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #16a34a; margin: 0 0 8px 0;">Tag Batch Generated</h2>
          <p style="margin: 0;">You generated <strong>${codes.length}</strong> new tag codes.</p>
        </div>
        <div style="margin: 16px 0;">
          <p><strong>Batch ID:</strong> <span style="font-family: monospace;">${batchId.slice(0, 8)}</span></p>
          <p><strong>Generated at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total tags:</strong> ${codes.length}</p>
        </div>
        <div style="margin: 16px 0;">
          <h3 style="font-size: 14px; margin: 0 0 8px 0;">Activation Codes &amp; Short URLs</h3>
          <p style="color: #71717a; font-size: 13px; margin: 0 0 8px 0;">Each QR code is attached as a PNG (3cm print size). Filenames match the activation codes.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e4e4e7; border-radius: 8px;">
            <thead>
              <tr style="background: #f4f4f5;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Activation Code</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Short URL</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px;">QR File</th>
              </tr>
            </thead>
            <tbody>
              ${tagRows}
            </tbody>
          </table>
        </div>
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
          This email was sent from the Tagz.au admin panel.
        </p>
      </div>
    `,
  });
}

export async function sendB2BNotification(
  data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    website?: string;
    address?: string;
    currentProducts?: string;
    neededProducts?: string;
    salesMethods?: string;
    targetArea?: string;
    orderVolume?: string;
    priority?: string;
  }
) {
  const fields = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email, href: `mailto:${data.email}` },
    { label: "Phone", value: data.phone, href: data.phone ? `tel:${data.phone}` : undefined },
    { label: "Website", value: data.website },
    { label: "Address", value: data.address },
    { label: "Current Products", value: data.currentProducts },
    { label: "Products Needed", value: data.neededProducts },
    { label: "Sales Methods", value: data.salesMethods },
    { label: "Target Area", value: data.targetArea },
    { label: "Order Volume", value: data.orderVolume },
    { label: "Priority", value: data.priority },
  ];

  const fieldsHtml = fields
    .filter((f) => f.value)
    .map((f) =>
      f.href
        ? `<p><strong>${f.label}:</strong> <a href="${f.href}">${f.value}</a></p>`
        : `<p><strong>${f.label}:</strong> ${f.value}</p>`
    )
    .join("");

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New B2B Inquiry from ${data.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #b45309; margin: 0 0 8px 0;">New B2B Inquiry</h2>
          <p style="margin: 0;">A new wholesale inquiry was submitted on Tagz.au.</p>
        </div>
        <div style="margin: 16px 0;">
          ${fieldsHtml}
        </div>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px 0;"><strong>Message:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
      </div>
    `,
  });
}
