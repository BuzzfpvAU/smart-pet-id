// WebAuthn configuration

const RP_NAME = "Tagz.au";

// In production, use the real domain. In development, use localhost.
const RP_ID = process.env.NODE_ENV === "production" ? "tagz.au" : "localhost";

const ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://tagz.au"
    : "http://localhost:3000";

export const webAuthnConfig = {
  rpName: RP_NAME,
  rpID: RP_ID,
  origin: ORIGIN,
};
