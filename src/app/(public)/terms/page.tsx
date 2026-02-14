export const metadata = {
  title: "Terms of Service - Tagz.au",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using Tagz.au, you agree to be bound by these
        Terms of Service. If you do not agree to these terms, please do not use
        our service.
      </p>

      <h2>2. Service Description</h2>
      <p>
        Tagz.au provides a digital pet identification service using QR code
        and NFC-enabled tags. The service allows pet owners to create online
        profiles for their pets and receive notifications when their pet&apos;s
        tag is scanned.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account. You
        must provide accurate and complete information when creating an account.
      </p>

      <h2>4. Privacy</h2>
      <p>
        We take your privacy seriously. Personal information you provide is used
        solely for the purpose of operating the Tagz.au service. We use
        encryption to protect your data. You have control over what information
        is displayed on your pet&apos;s public profile through the privacy
        toggle feature.
      </p>

      <h2>5. Location Data</h2>
      <p>
        When someone scans your pet&apos;s tag, they may choose to share their
        GPS location with you. This location data is stored securely and is only
        visible to the pet owner. Location sharing by the scanner is voluntary
        and requires their explicit consent.
      </p>

      <h2>6. User Content</h2>
      <p>
        You retain ownership of all content you upload, including pet photos and
        profile information. By using our service, you grant us a license to
        display this content as part of the pet profile functionality.
      </p>

      <h2>7. Prohibited Use</h2>
      <p>
        You may not use Tagz.au for any unlawful purpose, to harass or harm
        others, to distribute malware, or to attempt to gain unauthorized access
        to other accounts or systems.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Tagz.au is provided &quot;as is&quot; without warranty of any kind.
        While we strive to maintain reliable service, we are not liable for any
        damages arising from the use or inability to use our service.
      </p>

      <h2>9. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. Continued use of
        the service after changes constitutes acceptance of the modified terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have questions about these Terms of Service, please contact us
        through our contact page.
      </p>
    </div>
  );
}
