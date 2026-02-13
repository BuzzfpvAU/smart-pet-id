import QRCode from "qrcode";

export function getTagScanUrl(tagId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/scan/${tagId}`;
}

export async function generateQrCodeDataUrl(tagId: string): Promise<string> {
  const url = getTagScanUrl(tagId);
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

export async function generateQrCodeBuffer(tagId: string): Promise<Buffer> {
  const url = getTagScanUrl(tagId);
  return QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}
