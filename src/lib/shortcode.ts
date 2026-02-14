import crypto from "crypto";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SHORT_CODE_LENGTH = 8;

export function generateShortCode(): string {
  const bytes = crypto.randomBytes(SHORT_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}
