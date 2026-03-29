import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Tagz.au <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "buzz@buzzfpv.com.au";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/** Build a Google Maps Static API image URL (returns null if server key not configured) */
function getStaticMapUrl(
  latitude: number,
  longitude: number,
  width = 600,
  height = 300,
  zoom = 15
): string | null {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${key}`;
}

/** Escape user-supplied values before interpolating into HTML emails */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Shared Email Layout Components ────────────────────────────────────────

/** Inline SVG logo for email header (shield with grid pattern) */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="36" height="36" style="vertical-align: middle;">
  <path d="M32 4L8 16v20c0 12.8 10.24 24.32 24 28 13.76-3.68 24-15.2 24-28V16L32 4z" fill="#FFD700" stroke="#1a1a1a" stroke-width="2"/>
  <path d="M32 8L12 18v18c0 10.8 8.64 20.52 20 23.6 11.36-3.08 20-12.8 20-23.6V18L32 8z" fill="#1a1a1a"/>
  <path d="M32 12L16 20v16c0 8.8 7.04 16.72 16 19.2 8.96-2.48 16-10.4 16-19.2V20L32 12z" fill="#FFD700"/>
  <rect x="22" y="22" width="6" height="6" fill="#1a1a1a"/><rect x="36" y="22" width="6" height="6" fill="#1a1a1a"/>
  <rect x="29" y="22" width="6" height="6" fill="#1a1a1a"/><rect x="22" y="29" width="6" height="6" fill="#1a1a1a"/>
  <rect x="36" y="29" width="6" height="6" fill="#1a1a1a"/><rect x="29" y="36" width="6" height="6" fill="#1a1a1a"/>
  <rect x="22" y="36" width="6" height="6" fill="#1a1a1a"/><rect x="36" y="36" width="6" height="6" fill="#1a1a1a"/>
</svg>`;

function emailHeader(): string {
  return `
    <div style="background: #1a1a1a; padding: 24px 32px; text-align: center; border-radius: 12px 12px 0 0;">
      <a href="${BASE_URL}" style="text-decoration: none; color: #ffffff;">
        ${LOGO_SVG}
        <span style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #FFD700; letter-spacing: -0.5px; vertical-align: middle; margin-left: 10px;">Tagz.au</span>
      </a>
    </div>`;
}

function emailFooter(): string {
  return `
    <div style="background: #f8f8f7; border-top: 1px solid #e8e8e6; padding: 24px 32px; text-align: center; border-radius: 0 0 12px 12px;">
      <p style="margin: 0 0 8px 0; font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a1a; font-weight: 600;">
        <a href="${BASE_URL}" style="color: #1a1a1a; text-decoration: none;">Tagz.au</a>
        <span style="color: #d4d4d4; margin: 0 6px;">|</span>
        Smart Pet ID Tags
      </p>
      <p style="margin: 0; font-family: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #a1a1a1;">
        Keeping pets safe, one tag at a time.
      </p>
    </div>`;
}

function emailWrapper(content: string, maxWidth = 520): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0efed; -webkit-font-smoothing: antialiased;">
      <div style="padding: 32px 16px;">
        <div style="max-width: ${maxWidth}px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
          ${emailHeader()}
          <div style="padding: 32px; font-family: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #2d2d2d;">
            ${content}
          </div>
          ${emailFooter()}
        </div>
      </div>
    </body>
    </html>`;
}

function sectionHeading(text: string): string {
  return `<h2 style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px 0; letter-spacing: -0.3px;">${text}</h2>`;
}

function ctaButton(href: string, label: string, color = "#1a1a1a"): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${href}" style="display: inline-block; background: ${color}; color: #ffffff; font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.3px;">${label}</a>
    </div>`;
}

function accentBar(color = "#FFD700"): string {
  return `<div style="width: 40px; height: 3px; background: ${color}; border-radius: 2px; margin: 12px 0 20px 0;"></div>`;
}

function infoCard(content: string, borderColor = "#e8e8e6"): string {
  return `<div style="background: #fafaf9; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">${content}</div>`;
}

function metaText(text: string): string {
  return `<p style="font-size: 13px; color: #8c8c8c; margin: 0; line-height: 1.5;">${text}</p>`;
}

// ─── Email Functions ────────────────────────────────────────────────────────

export async function sendVerificationCode(email: string, code: string) {
  const content = `
    ${sectionHeading("Verify your email")}
    ${accentBar()}
    <p style="margin: 0 0 20px 0;">Enter the code below to verify your email address and get started.</p>
    <div style="background: #1a1a1a; border-radius: 10px; padding: 24px; text-align: center; margin: 20px 0;">
      <span style="font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #FFD700;">${escapeHtml(code)}</span>
    </div>
    ${metaText("This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your verification code - Tagz.au",
    html: emailWrapper(content),
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  const content = `
    ${sectionHeading("Reset your password")}
    ${accentBar()}
    <p style="margin: 0 0 20px 0;">Use the code below to reset your password. If you didn't request this, no action is needed.</p>
    <div style="background: #1a1a1a; border-radius: 10px; padding: 24px; text-align: center; margin: 20px 0;">
      <span style="font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #FFD700;">${escapeHtml(code)}</span>
    </div>
    ${metaText("This code expires in 10 minutes.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password - Tagz.au",
    html: emailWrapper(content),
  });
}

export async function sendScanAlert(
  ownerEmail: string,
  itemName: string,
  latitude: number | null,
  longitude: number | null,
  finderPhone: string | null,
  scanTime: Date,
  finderMessage?: string | null,
  locationName?: string | null
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const staticMapUrl =
    latitude && longitude ? getStaticMapUrl(latitude, longitude) : null;

  const safeLocationName = locationName ? escapeHtml(locationName) : null;

  const locationHtml = mapUrl
    ? `
      <div style="margin: 20px 0;">
        ${staticMapUrl ? `<a href="${mapUrl}" style="display: block; border-radius: 8px; overflow: hidden; margin-bottom: 12px;"><img src="${staticMapUrl}" alt="Scan location" style="width: 100%; display: block; border-radius: 8px;" /></a>` : ""}
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr>
            <td style="padding: 0;">
              <p style="margin: 0; font-size: 14px; color: #5a5a5a;">
                <strong style="color: #2d2d2d;">Location:</strong> ${safeLocationName || "Coordinates shared"}
              </p>
            </td>
            <td style="padding: 0; text-align: right;">
              <a href="${mapUrl}" style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #1a1a1a; text-decoration: none; background: #FFD700; padding: 6px 14px; border-radius: 6px; display: inline-block;">View Map</a>
            </td>
          </tr>
        </table>
      </div>
    `
    : `<p style="font-size: 14px; color: #8c8c8c; margin: 16px 0;">Location was not shared by the scanner.</p>`;

  const safePhone = finderPhone ? escapeHtml(finderPhone) : null;
  const finderHtml = safePhone
    ? `<p style="margin: 8px 0;"><strong>Finder's phone:</strong> <a href="tel:${safePhone}" style="color: #1a1a1a; font-weight: 500;">${safePhone}</a></p>`
    : "";

  const safeMessage = finderMessage ? escapeHtml(finderMessage) : null;
  const messageHtml = safeMessage
    ? infoCard(`
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8c8c8c;">Message from finder</p>
        <p style="margin: 0; color: #2d2d2d; white-space: pre-wrap;">${safeMessage}</p>
      `)
    : "";

  const safeItemName = escapeHtml(itemName);
  const isFinderContact = finderPhone || finderMessage;

  const subject = isFinderContact
    ? `Someone found ${safeItemName} and left their details!`
    : `Alert: ${safeItemName}'s tag was scanned!`;

  const alertColor = isFinderContact ? "#16a34a" : "#dc2626";
  const alertIcon = isFinderContact ? "&#9996;&#65039;" : "&#128276;";

  const content = `
    <div style="text-align: center; margin-bottom: 4px;">
      <span style="font-size: 32px;">${alertIcon}</span>
    </div>
    ${sectionHeading(isFinderContact ? "Someone found " + safeItemName + "!" : safeItemName + "'s tag was scanned")}
    <div style="width: 40px; height: 3px; background: ${alertColor}; border-radius: 2px; margin: 12px 0 20px 0;"></div>
    <p style="margin: 0 0 4px 0;">
      Someone scanned <strong>${safeItemName}</strong>'s tag on <strong>${escapeHtml(scanTime.toLocaleString())}</strong>.
    </p>
    ${locationHtml}
    ${finderHtml}
    ${messageHtml}
    ${ctaButton(BASE_URL + "/dashboard", "View Scan History")}
    ${metaText("Log in to your Tagz.au dashboard to view the full scan history and manage your tags.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject,
    html: emailWrapper(content),
  });
}

export async function sendContactNotification(
  name: string,
  email: string,
  phone: string | null,
  message: string
) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);
  const safePhone = phone ? escapeHtml(phone) : null;

  const content = `
    ${sectionHeading("New Contact Submission")}
    ${accentBar("#2563eb")}
    <p style="margin: 0 0 16px 0;">Someone submitted the contact form on Tagz.au.</p>
    ${infoCard(`
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #8c8c8c; width: 80px; vertical-align: top;">Name</td>
          <td style="padding: 6px 0; color: #2d2d2d; font-weight: 500;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #8c8c8c; vertical-align: top;">Email</td>
          <td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #1a1a1a; font-weight: 500;">${safeEmail}</a></td>
        </tr>
        ${safePhone ? `<tr><td style="padding: 6px 0; color: #8c8c8c; vertical-align: top;">Phone</td><td style="padding: 6px 0;"><a href="tel:${safePhone}" style="color: #1a1a1a; font-weight: 500;">${safePhone}</a></td></tr>` : ""}
      </table>
    `)}
    ${infoCard(`
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8c8c8c;">Message</p>
      <p style="margin: 0; color: #2d2d2d; white-space: pre-wrap;">${safeMessage}</p>
    `)}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Contact Form Submission from ${safeName}`,
    html: emailWrapper(content),
  });
}

export async function sendChecklistAlert(
  ownerEmail: string,
  itemName: string,
  scannerName: string,
  results: { id: string; label: string; type: string; value: boolean | number | string }[],
  latitude: number | null,
  longitude: number | null,
  submittedAt: Date,
  locationName?: string | null
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const safeLocationName = locationName ? escapeHtml(locationName) : null;

  const locationHtml = mapUrl
    ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Location:</strong> ${safeLocationName ? `${safeLocationName} &mdash; ` : ""}<a href="${mapUrl}" style="color: #1a1a1a; font-weight: 600; background: #FFD700; padding: 3px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">View Map</a></p>`
    : `<p style="font-size: 14px; color: #8c8c8c;">Location was not captured.</p>`;

  const checkboxItems = results.filter((r) => r.type === "checkbox");
  const checkedCount = checkboxItems.filter((r) => r.value === true).length;
  const totalCheckboxes = checkboxItems.length;

  const summaryHtml =
    totalCheckboxes > 0
      ? `<div style="background: #1a1a1a; border-radius: 8px; padding: 14px 20px; margin: 16px 0; text-align: center;">
          <span style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #FFD700;">${checkedCount}/${totalCheckboxes}</span>
          <span style="font-size: 13px; color: #a1a1a1; margin-left: 8px;">items checked</span>
        </div>`
      : "";

  const resultsHtml = results
    .map((r) => {
      const safeLabel = escapeHtml(r.label);
      if (r.type === "checkbox") {
        const checked = r.value === true;
        const icon = checked ? "&#10003;" : "&#10005;";
        const iconColor = checked ? "#16a34a" : "#dc2626";
        const iconBg = checked ? "#f0fdf4" : "#fef2f2";
        return `<tr>
          <td style="padding: 8px 10px; width: 32px; text-align: center;"><span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 4px; background: ${iconBg}; color: ${iconColor}; font-size: 12px; font-weight: 700;">${icon}</span></td>
          <td style="padding: 8px 10px; color: #2d2d2d; font-size: 14px;">${safeLabel}</td>
        </tr>`;
      }
      const displayValue = r.value !== "" && r.value !== undefined ? escapeHtml(String(r.value)) : "&mdash;";
      return `<tr>
        <td style="padding: 8px 10px; width: 32px; text-align: center;"><span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 4px; background: #f5f5f4; color: #8c8c8c; font-size: 11px;">&#9998;</span></td>
        <td style="padding: 8px 10px; font-size: 14px;"><strong style="color: #2d2d2d;">${safeLabel}:</strong> <span style="color: #5a5a5a;">${displayValue}</span></td>
      </tr>`;
    })
    .join("");

  const safeItemName = escapeHtml(itemName);
  const safeScannerName = escapeHtml(scannerName);

  const content = `
    ${sectionHeading("Checklist Completed")}
    ${accentBar("#2563eb")}
    <p style="margin: 0 0 16px 0;">A checklist was completed for <strong>${safeItemName}</strong>.</p>
    ${infoCard(`
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #8c8c8c; width: 100px;">Conducted by</td>
          <td style="padding: 4px 0; color: #2d2d2d; font-weight: 500;">${safeScannerName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8c8c8c;">Time</td>
          <td style="padding: 4px 0; color: #2d2d2d;">${escapeHtml(submittedAt.toLocaleString())}</td>
        </tr>
      </table>
    `)}
    ${locationHtml}
    ${summaryHtml}
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fafaf9; border-radius: 8px; overflow: hidden; border: 1px solid #e8e8e6;">
      <thead>
        <tr><td colspan="2" style="padding: 10px 10px 6px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8c8c8c; border-bottom: 1px solid #e8e8e6;">Results</td></tr>
      </thead>
      <tbody>
        ${resultsHtml}
      </tbody>
    </table>
    ${ctaButton(BASE_URL + "/dashboard", "View Full History")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `Checklist completed: ${safeItemName}`,
    html: emailWrapper(content),
  });
}

export async function sendTagBatchEmail(
  adminEmail: string,
  codes: string[],
  shortCodes: string[],
  batchId: string
) {
  const QRCode = await import("qrcode");

  const attachments = await Promise.all(
    shortCodes.map(async (shortCode, i) => {
      const shortUrl = `${BASE_URL}/s/${shortCode}`;
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
      const shortUrl = `${BASE_URL}/s/${shortCodes[i]}`;
      const bgColor = i % 2 === 0 ? "#ffffff" : "#fafaf9";
      return `
        <tr style="background: ${bgColor};">
          <td style="padding: 10px 12px; font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #f0f0ee;">${escapeHtml(code)}</td>
          <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0ee;">
            <a href="${escapeHtml(shortUrl)}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${escapeHtml(shortUrl)}</a>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; color: #8c8c8c; border-bottom: 1px solid #f0f0ee;">${escapeHtml(code)}.png</td>
        </tr>`;
    })
    .join("");

  const content = `
    <div style="text-align: center; margin-bottom: 4px;">
      <span style="font-size: 28px;">&#127991;&#65039;</span>
    </div>
    ${sectionHeading("Tag Batch Generated")}
    ${accentBar("#16a34a")}
    <p style="margin: 0 0 16px 0;">You generated <strong>${codes.length}</strong> new tag codes. QR code images are attached.</p>
    ${infoCard(`
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #8c8c8c; width: 100px;">Batch ID</td>
          <td style="padding: 4px 0; font-family: 'JetBrains Mono', 'SF Mono', 'Courier New', monospace; color: #2d2d2d; font-size: 13px;">${escapeHtml(batchId.slice(0, 8))}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8c8c8c;">Generated</td>
          <td style="padding: 4px 0; color: #2d2d2d;">${new Date().toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #8c8c8c;">Total tags</td>
          <td style="padding: 4px 0; color: #2d2d2d; font-weight: 600;">${codes.length}</td>
        </tr>
      </table>
    `)}
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e8e8e6; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <thead>
        <tr style="background: #1a1a1a;">
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #FFD700;">Code</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #FFD700;">Short URL</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #FFD700;">QR File</th>
        </tr>
      </thead>
      <tbody>
        ${tagRows}
      </tbody>
    </table>
    ${metaText("Each QR code is attached as a PNG (3cm print size). Filenames match the activation codes.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Tag Batch Generated: ${codes.length} codes (${batchId.slice(0, 8)})`,
    attachments,
    html: emailWrapper(content, 640),
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
    { label: "Email", value: data.email, href: `mailto:${escapeHtml(data.email)}` },
    { label: "Phone", value: data.phone, href: data.phone ? `tel:${escapeHtml(data.phone)}` : undefined },
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
    .map((f) => {
      const safeValue = escapeHtml(f.value!);
      const valueHtml = f.href
        ? `<a href="${f.href}" style="color: #1a1a1a; font-weight: 500;">${safeValue}</a>`
        : `<span style="color: #2d2d2d;">${safeValue}</span>`;
      return `<tr>
        <td style="padding: 6px 0; color: #8c8c8c; width: 120px; vertical-align: top; font-size: 13px;">${f.label}</td>
        <td style="padding: 6px 0; font-size: 14px;">${valueHtml}</td>
      </tr>`;
    })
    .join("");

  const safeName = escapeHtml(data.name);
  const safeMessage = escapeHtml(data.message);

  const content = `
    ${sectionHeading("New B2B Inquiry")}
    ${accentBar("#b45309")}
    <p style="margin: 0 0 16px 0;">A new wholesale inquiry was submitted on Tagz.au.</p>
    ${infoCard(`
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        ${fieldsHtml}
      </table>
    `)}
    ${infoCard(`
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8c8c8c;">Message</p>
      <p style="margin: 0; color: #2d2d2d; white-space: pre-wrap;">${safeMessage}</p>
    `)}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New B2B Inquiry from ${safeName}`,
    html: emailWrapper(content),
  });
}

export async function sendEmergencyAutoAlert(
  contactEmail: string,
  contactName: string,
  personName: string,
  latitude: number | null,
  longitude: number | null,
  scanTime: Date,
  locationName?: string | null
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const staticMapUrl =
    latitude && longitude ? getStaticMapUrl(latitude, longitude) : null;

  const safeLocationName = locationName ? escapeHtml(locationName) : null;

  const locationHtml = mapUrl
    ? `
      <div style="margin: 20px 0;">
        ${staticMapUrl ? `<a href="${mapUrl}" style="display: block; border-radius: 8px; overflow: hidden; margin-bottom: 12px;"><img src="${staticMapUrl}" alt="Scan location" style="width: 100%; display: block; border-radius: 8px;" /></a>` : ""}
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr>
            <td style="padding: 0;">
              <p style="margin: 0; font-size: 14px; color: #5a5a5a;">
                <strong style="color: #2d2d2d;">Location:</strong> ${safeLocationName || "Coordinates shared"}
              </p>
            </td>
            <td style="padding: 0; text-align: right;">
              <a href="${mapUrl}" style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; background: #dc2626; padding: 6px 14px; border-radius: 6px; display: inline-block;">View Map</a>
            </td>
          </tr>
        </table>
      </div>
    `
    : `<p style="font-size: 14px; color: #8c8c8c; margin: 16px 0;">Location was not shared by the scanner.</p>`;

  const safePersonName = escapeHtml(personName);
  const safeContactName = escapeHtml(contactName);

  const content = `
    <div style="background: #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <span style="font-size: 28px;">&#9888;&#65039;</span>
      <h2 style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; margin: 8px 0 4px 0;">Emergency Tag Scanned</h2>
      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${safePersonName}'s emergency tag was scanned
      </p>
    </div>
    <p style="margin: 0 0 16px 0;">
      Hi ${safeContactName}, someone scanned <strong>${safePersonName}</strong>'s emergency contact tag at <strong>${escapeHtml(scanTime.toLocaleString())}</strong>.
    </p>
    ${locationHtml}
    ${metaText("You are receiving this because you are listed as an emergency contact for " + safePersonName + " on Tagz.au.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `URGENT: ${safePersonName}'s emergency tag was scanned`,
    html: emailWrapper(content),
  });
}

export async function sendEmergencyDetailedAlert(
  contactEmail: string,
  contactName: string,
  personName: string,
  scannerDescription: string,
  scannerName: string | null,
  scannerContact: string | null,
  latitude: number | null,
  longitude: number | null,
  scanTime: Date,
  locationName?: string | null
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const safeLocationName = locationName ? escapeHtml(locationName) : null;

  const locationHtml = mapUrl
    ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Location:</strong> ${safeLocationName ? `${safeLocationName} &mdash; ` : ""}<a href="${mapUrl}" style="color: #1a1a1a; font-weight: 600; background: #FFD700; padding: 3px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">View Map</a></p>`
    : `<p style="font-size: 14px; color: #8c8c8c;">Location was not shared.</p>`;

  const safePersonName = escapeHtml(personName);
  const safeContactName = escapeHtml(contactName);
  const safeDescription = escapeHtml(scannerDescription);
  const safeScannerName = scannerName ? escapeHtml(scannerName) : null;
  const safeScannerContact = scannerContact ? escapeHtml(scannerContact) : null;

  const content = `
    ${sectionHeading("Scanner Details Received")}
    ${accentBar("#2563eb")}
    <p style="margin: 0 0 16px 0;">
      Hi ${safeContactName}, someone provided details after scanning <strong>${safePersonName}</strong>'s emergency tag.
    </p>
    ${infoCard(`
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8c8c8c;">Why they scanned</p>
      <p style="margin: 0; color: #2d2d2d; white-space: pre-wrap;">${safeDescription}</p>
    `)}
    ${infoCard(`
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 14px;">
        ${safeScannerName ? `<tr><td style="padding: 4px 0; color: #8c8c8c; width: 100px;">Name</td><td style="padding: 4px 0; color: #2d2d2d; font-weight: 500;">${safeScannerName}</td></tr>` : ""}
        ${safeScannerContact ? `<tr><td style="padding: 4px 0; color: #8c8c8c;">Contact</td><td style="padding: 4px 0; color: #2d2d2d; font-weight: 500;">${safeScannerContact}</td></tr>` : ""}
        <tr><td style="padding: 4px 0; color: #8c8c8c;">Time</td><td style="padding: 4px 0; color: #2d2d2d;">${escapeHtml(scanTime.toLocaleString())}</td></tr>
      </table>
    `)}
    ${locationHtml}
    ${metaText("You are receiving this because you are listed as an emergency contact for " + safePersonName + " on Tagz.au.")}
  `;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `Update: Someone provided details about ${safePersonName}'s emergency tag scan`,
    html: emailWrapper(content),
  });
}
