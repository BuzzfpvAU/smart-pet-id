import QRCode from "qrcode";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  );
}

export function getTagScanUrl(tagId: string): string {
  return `${getBaseUrl()}/scan/${tagId}`;
}

export function getTagShortScanUrl(shortCode: string): string {
  return `${getBaseUrl()}/s/${shortCode}`;
}

export async function generateQrCodeDataUrl(
  tagId: string,
  shortCode?: string | null
): Promise<string> {
  const url = shortCode ? getTagShortScanUrl(shortCode) : getTagScanUrl(tagId);
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

export async function generateQrCodeBuffer(
  tagId: string,
  shortCode?: string | null
): Promise<Buffer> {
  const url = shortCode ? getTagShortScanUrl(shortCode) : getTagScanUrl(tagId);
  return QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}
