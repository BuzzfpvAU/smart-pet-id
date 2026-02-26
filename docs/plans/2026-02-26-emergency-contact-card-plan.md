# Emergency Contact Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Emergency Contact Card" tag type with a new `emergency_contacts_list` field type, auto-email notifications to emergency contacts on scan, and a scanner description form.

**Architecture:** Extends the existing tag type system with a new field type (`emergency_contacts_list`) that adds email to each contact. The scan page detects `emergency-contact` type and triggers auto-notification emails to all contacts. A new scanner form collects "why scanned" descriptions and sends detailed follow-up emails.

**Tech Stack:** Next.js 16, Prisma 7, Resend emails, Zod 4 validation, React 19, shadcn/ui, Tailwind CSS v4

---

### Task 1: Add `emergency_contacts_list` Field Type Definition

**Files:**
- Modify: `src/lib/tag-types.ts:4` (add to union type)

**Step 1: Update the FieldDefinition type union**

In `src/lib/tag-types.ts`, add `"emergency_contacts_list"` to the `type` union on line 4:

```typescript
type: "text" | "textarea" | "select" | "number" | "email" | "tel" | "toggle" | "contacts_list" | "checklist_builder" | "emergency_contacts_list";
```

**Step 2: Commit**

```bash
git add src/lib/tag-types.ts
git commit -m "feat: add emergency_contacts_list field type definition"
```

---

### Task 2: Add Validation for `emergency_contacts_list`

**Files:**
- Modify: `src/lib/item-validation.ts:8-18` (add new field type handler)

**Step 1: Add emergency_contacts_list validation**

In `src/lib/item-validation.ts`, add a new block after the `contacts_list` handler (after line 18):

```typescript
if (field.type === "emergency_contacts_list") {
  const emergencyContactSchema = z.array(
    z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email(),
    })
  ).max(3);
  shape[field.key] = field.required ? emergencyContactSchema : emergencyContactSchema.optional();
  continue;
}
```

**Step 2: Commit**

```bash
git add src/lib/item-validation.ts
git commit -m "feat: add Zod validation for emergency_contacts_list field type"
```

---

### Task 3: Add Emergency Contact Card Tag Type Definition

**Files:**
- Modify: `src/lib/tag-type-defaults.ts:419` (add before closing bracket)

**Step 1: Add the emergency-contact type**

In `src/lib/tag-type-defaults.ts`, add a new entry before the closing `];` on line 420:

```typescript
  {
    slug: "emergency-contact",
    name: "Emergency Contact Card",
    description: "Personal emergency information card for medical details and emergency contacts",
    icon: "heart-pulse",
    color: "#dc2626",
    fieldGroups: [
      {
        key: "personal_info",
        label: "Personal Information",
        fields: [
          { key: "fullName", label: "Full Name", type: "text", required: true },
          { key: "dateOfBirth", label: "Date of Birth", type: "text", placeholder: "e.g., 15/03/1985" },
          { key: "preferredLanguage", label: "Preferred Language", type: "text", placeholder: "e.g., English" },
        ],
      },
      {
        key: "medical",
        label: "Medical Information",
        icon: "heart-pulse",
        alertStyle: true,
        fields: [
          {
            key: "bloodType",
            label: "Blood Type",
            type: "select",
            options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
          },
          { key: "medicalConditions", label: "Medical Conditions", type: "textarea", placeholder: "e.g., Diabetes Type 1, Epilepsy" },
          { key: "allergies", label: "Allergies", type: "textarea", placeholder: "e.g., Penicillin, Peanuts, Latex" },
          { key: "currentMedications", label: "Current Medications", type: "textarea", placeholder: "e.g., Metformin 500mg twice daily" },
          { key: "medicalDevices", label: "Medical Devices", type: "text", placeholder: "e.g., Pacemaker, Insulin pump" },
          { key: "dnrAdvanceDirective", label: "DNR / Advance Directive", type: "toggle" },
          { key: "specialNeeds", label: "Special Needs", type: "textarea", placeholder: "e.g., Non-verbal, uses wheelchair" },
        ],
      },
      {
        key: "emergency_contacts",
        label: "Emergency Contacts",
        fields: [
          { key: "emergencyContacts", label: "Emergency Contacts", type: "emergency_contacts_list", required: true },
        ],
      },
      {
        key: "additional_info",
        label: "Additional Information",
        fields: [
          { key: "doctorName", label: "Doctor / GP Name", type: "text" },
          { key: "doctorPhone", label: "Doctor Phone", type: "tel" },
          { key: "insuranceProvider", label: "Insurance Provider", type: "text" },
          { key: "policyNumber", label: "Policy Number", type: "text" },
          { key: "homeAddress", label: "Home Address", type: "textarea" },
          { key: "additionalNotes", label: "Additional Notes", type: "textarea", placeholder: "e.g., Religious considerations, language spoken" },
        ],
      },
    ],
    defaultVisibility: {
      fullName: true,
      dateOfBirth: true,
      preferredLanguage: true,
      bloodType: true,
      medicalConditions: true,
      allergies: true,
      currentMedications: true,
      medicalDevices: true,
      dnrAdvanceDirective: true,
      specialNeeds: true,
      emergencyContacts: true,
      doctorName: true,
      doctorPhone: true,
      insuranceProvider: true,
      policyNumber: true,
      homeAddress: true,
      additionalNotes: true,
      ownerPhone: true,
      ownerEmail: true,
      ownerAddress: true,
    },
  },
```

**Step 2: Commit**

```bash
git add src/lib/tag-type-defaults.ts
git commit -m "feat: add emergency-contact tag type definition"
```

---

### Task 4: Add `emergency_contacts_list` Form Rendering

**Files:**
- Modify: `src/components/items/item-form.tsx:25-29` (update EmergencyContact interface)
- Modify: `src/components/items/item-form.tsx:132-156` (update contact helpers)
- Modify: `src/components/items/item-form.tsx:312-367` (add new rendering block)

**Step 1: Add EmergencyContactWithEmail interface**

In `src/components/items/item-form.tsx`, after the existing `EmergencyContact` interface (line 29), add:

```typescript
interface EmergencyContactWithEmail {
  name: string;
  phone: string;
  email: string;
}
```

**Step 2: Add helper functions for emergency_contacts_list**

After the existing `removeContact` function (line 156), add:

```typescript
function getEmergencyContacts(key: string): EmergencyContactWithEmail[] {
  return (data.data[key] as EmergencyContactWithEmail[]) || [];
}

function addEmergencyContact(key: string) {
  const contacts = getEmergencyContacts(key);
  if (contacts.length >= 3) return;
  updateField(key, [...contacts, { name: "", phone: "", email: "" }]);
}

function updateEmergencyContact(
  key: string,
  index: number,
  field: keyof EmergencyContactWithEmail,
  value: string
) {
  const contacts = [...getEmergencyContacts(key)];
  contacts[index] = { ...contacts[index], [field]: value };
  updateField(key, contacts);
}

function removeEmergencyContact(key: string, index: number) {
  const contacts = getEmergencyContacts(key).filter((_, i) => i !== index);
  updateField(key, contacts);
}
```

**Step 3: Add rendering for emergency_contacts_list**

In the `renderField` function, add a new block before the existing `contacts_list` handler (before line 312):

```typescript
if (field.type === "emergency_contacts_list") {
  const contacts = getEmergencyContacts(field.key);
  return (
    <div key={field.key} className="space-y-3">
      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No emergency contacts added yet. Add up to 3 contacts.
        </p>
      )}
      {contacts.map((contact, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <Input
              placeholder="Name *"
              value={contact.name}
              onChange={(e) =>
                updateEmergencyContact(field.key, i, "name", e.target.value)
              }
              required
            />
            <Input
              placeholder="Phone *"
              type="tel"
              value={contact.phone}
              onChange={(e) =>
                updateEmergencyContact(field.key, i, "phone", e.target.value)
              }
              required
            />
            <Input
              placeholder="Email *"
              type="email"
              value={contact.email}
              onChange={(e) =>
                updateEmergencyContact(field.key, i, "email", e.target.value)
              }
              required
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEmergencyContact(field.key, i)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      {contacts.length < 3 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addEmergencyContact(field.key)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Emergency Contact
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        All contacts will be notified via email when this tag is scanned.
      </p>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/items/item-form.tsx
git commit -m "feat: add emergency_contacts_list form rendering with max 3 contacts"
```

---

### Task 5: Add `emergency_contacts_list` Display on Scan Page

**Files:**
- Modify: `src/components/scan/item-scan-page.tsx:41` (update interface)
- Modify: `src/components/scan/item-scan-page.tsx:237-266` (add display rendering)

**Step 1: Update ItemProfile interface**

In `src/components/scan/item-scan-page.tsx`, update the `emergencyContacts` type on line 41 to also support the new type:

```typescript
emergencyContacts?: { name: string; phone: string; relationship?: string; email?: string }[] | null;
```

**Step 2: Add emergency_contacts_list display rendering**

In the field group rendering section, add a handler for `emergency_contacts_list` after the existing `contacts_list` handler (after line 266). The rendering block goes inside the field group map, in the same pattern:

```typescript
if (field.type === "emergency_contacts_list" && Array.isArray(val)) {
  if (val.length === 0) return null;
  return (
    <div key={field.key} className="space-y-2">
      <h4 className="font-medium text-xs text-muted-foreground">
        {field.label}
      </h4>
      {(val as { name: string; phone: string; email: string }[]).map(
        (contact, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{contact.name}</p>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {contact.email}
                </a>
              )}
            </div>
            <a
              href={`tel:${contact.phone}`}
              className="text-sm text-primary hover:underline"
            >
              {contact.phone}
            </a>
          </div>
        )
      )}
    </div>
  );
}
```

Also add `emergency_contacts_list` to the filter on line 215 (inside alertStyle groups) to skip it like contacts_list:

```typescript
if (field.type === "contacts_list" || field.type === "emergency_contacts_list") return null;
```

**Step 3: Commit**

```bash
git add src/components/scan/item-scan-page.tsx
git commit -m "feat: add emergency_contacts_list display on scan page"
```

---

### Task 6: Add Email Functions for Emergency Contact Notifications

**Files:**
- Modify: `src/lib/email.ts` (add 2 new email functions)

**Step 1: Add `sendEmergencyAutoAlert` function**

At the end of `src/lib/email.ts` (after the `sendB2BNotification` function), add:

```typescript
export async function sendEmergencyAutoAlert(
  contactEmail: string,
  contactName: string,
  personName: string,
  latitude: number | null,
  longitude: number | null,
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

  const safePersonName = escapeHtml(personName);
  const safeContactName = escapeHtml(contactName);

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `URGENT: ${safePersonName}'s emergency tag was scanned`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #dc2626; margin: 0 0 8px 0;">Emergency Tag Scanned</h2>
          <p style="margin: 0;">Hi ${safeContactName}, someone scanned <strong>${safePersonName}</strong>'s emergency contact tag at ${escapeHtml(scanTime.toLocaleString())}.</p>
        </div>
        ${locationHtml}
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
          You are receiving this because you are listed as an emergency contact for ${safePersonName} on Tagz.au.
        </p>
      </div>
    `,
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
  scanTime: Date
) {
  const mapUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const locationHtml = mapUrl
    ? `<p><strong>Location:</strong> <a href="${mapUrl}" style="color: #2563eb; text-decoration: underline;">View on Google Maps</a></p>`
    : `<p style="color: #71717a;">Location was not shared.</p>`;

  const safePersonName = escapeHtml(personName);
  const safeContactName = escapeHtml(contactName);
  const safeDescription = escapeHtml(scannerDescription);
  const safeScannerName = scannerName ? escapeHtml(scannerName) : null;
  const safeScannerContact = scannerContact ? escapeHtml(scannerContact) : null;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `Update: Someone provided details about ${safePersonName}'s emergency tag scan`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #2563eb; margin: 0 0 8px 0;">Scanner Details Received</h2>
          <p style="margin: 0;">Hi ${safeContactName}, someone provided details after scanning <strong>${safePersonName}</strong>'s emergency tag.</p>
        </div>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px 0;"><strong>Why they scanned:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${safeDescription}</p>
        </div>
        <div style="margin: 16px 0;">
          ${safeScannerName ? `<p><strong>Scanner name:</strong> ${safeScannerName}</p>` : ""}
          ${safeScannerContact ? `<p><strong>Scanner contact:</strong> ${safeScannerContact}</p>` : ""}
          <p><strong>Time:</strong> ${escapeHtml(scanTime.toLocaleString())}</p>
          ${locationHtml}
        </div>
        <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
          You are receiving this because you are listed as an emergency contact for ${safePersonName} on Tagz.au.
        </p>
      </div>
    `,
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add emergency auto-alert and detailed alert email functions"
```

---

### Task 7: Update Scan Log API to Auto-Notify Emergency Contacts

**Files:**
- Modify: `src/app/api/scan/[tagId]/log/route.ts` (add emergency contact auto-notification)

**Step 1: Update the scan log endpoint**

In `src/app/api/scan/[tagId]/log/route.ts`, update the tag query to include the item's `tagType` and `data`:

Change the tag query (lines 14-28) to also include tagType:

```typescript
const tag = await prisma.tag.findFirst({
  where: { id: tagId, status: "active" },
  include: {
    pet: {
      include: {
        user: { select: { email: true } },
      },
    },
    item: {
      include: {
        user: { select: { email: true } },
        tagType: { select: { slug: true } },
      },
    },
  },
});
```

**Step 2: Add emergency contact auto-notification**

After the existing `sendScanAlert` call (after line 66), add:

```typescript
// Auto-notify emergency contacts for emergency-contact type
if (tag.item?.tagType?.slug === "emergency-contact") {
  const itemData = (tag.item.data || {}) as Record<string, unknown>;
  const emergencyContacts = itemData.emergencyContacts as
    | { name: string; phone: string; email: string }[]
    | undefined;

  if (emergencyContacts && emergencyContacts.length > 0) {
    const { sendEmergencyAutoAlert } = await import("@/lib/email");
    await Promise.allSettled(
      emergencyContacts.map((contact) =>
        sendEmergencyAutoAlert(
          contact.email,
          contact.name,
          tag.item!.name,
          latitude ?? null,
          longitude ?? null,
          scan.createdAt
        )
      )
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/scan/[tagId]/log/route.ts
git commit -m "feat: auto-notify emergency contacts when emergency-contact tag is scanned"
```

---

### Task 8: Update Scan Contact API for Emergency Contact Notifications

**Files:**
- Modify: `src/app/api/scan/[tagId]/contact/route.ts` (add emergency contact detailed notifications)

**Step 1: Update the contact endpoint**

In `src/app/api/scan/[tagId]/contact/route.ts`:

1. Update the tag query to include `tagType` and `data`:

```typescript
const tag = await prisma.tag.findFirst({
  where: { id: tagId, status: "active" },
  include: {
    pet: {
      include: {
        user: { select: { email: true } },
      },
    },
    item: {
      include: {
        user: { select: { email: true } },
        tagType: { select: { slug: true } },
      },
    },
  },
});
```

2. Update the request body parsing to accept the new fields. Change line 12:

```typescript
const { phone, message, scanId, scannerName, scannerContact, description } = await req.json();
```

3. For emergency-contact type, also update the Scan record with `finderMessage` set to the description.

4. After the existing `sendScanAlert` call (after line 71), add:

```typescript
// Send detailed alerts to emergency contacts for emergency-contact type
if (tag.item?.tagType?.slug === "emergency-contact") {
  const itemData = (tag.item.data || {}) as Record<string, unknown>;
  const emergencyContacts = itemData.emergencyContacts as
    | { name: string; phone: string; email: string }[]
    | undefined;

  if (emergencyContacts && emergencyContacts.length > 0) {
    const { sendEmergencyDetailedAlert } = await import("@/lib/email");

    // Get scan location if available
    let lat: number | null = null;
    let lng: number | null = null;
    if (scanId) {
      const scanRecord = await prisma.scan.findFirst({
        where: { id: scanId, tagId: tag.id },
        select: { latitude: true, longitude: true },
      });
      if (scanRecord) {
        lat = scanRecord.latitude;
        lng = scanRecord.longitude;
      }
    }

    await Promise.allSettled(
      emergencyContacts.map((contact) =>
        sendEmergencyDetailedAlert(
          contact.email,
          contact.name,
          tag.item!.name,
          description || message || "",
          scannerName || null,
          scannerContact || phone || null,
          lat,
          lng,
          new Date()
        )
      )
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/scan/[tagId]/contact/route.ts
git commit -m "feat: send detailed emergency alerts when scanner submits description"
```

---

### Task 9: Update Scan Page for Emergency Contact Card UX

**Files:**
- Modify: `src/components/scan/item-scan-page.tsx` (update scanner form for emergency type)

**Step 1: Update the component state and form**

In `src/components/scan/item-scan-page.tsx`:

1. Add new state variables after the existing state (after line 57):

```typescript
const [scannerName, setScannerName] = useState("");
const [scannerContact, setScannerContact] = useState("");
const [description, setDescription] = useState("");
```

2. Detect if this is an emergency contact card (after the state declarations):

```typescript
const isEmergencyContact = item.tagType.slug === "emergency-contact";
```

3. Update the `sendContact` function to pass the new fields for emergency type:

```typescript
async function sendContact(e: React.FormEvent) {
  e.preventDefault();
  if (isEmergencyContact) {
    if (!description) return;
  } else {
    if (!finderPhone) return;
  }

  await fetch(`/api/scan/${tagId}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: finderPhone || null,
      message: finderMessage,
      scanId,
      ...(isEmergencyContact && {
        description,
        scannerName: scannerName || null,
        scannerContact: scannerContact || null,
      }),
    }),
  });

  setContactSent(true);
}
```

4. Replace the "Leave Your Contact Info" card (lines 379-415) with a conditional that renders a different form for emergency type:

For emergency-contact type, render:

```tsx
{isEmergencyContact ? (
  <Card className="border-red-300">
    <CardContent className="p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        Why did you scan this tag?
      </h3>
      {contactSent ? (
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-4 w-4" />
          <p className="text-sm">
            Thank you. All emergency contacts have been notified with your details.
          </p>
        </div>
      ) : (
        <form onSubmit={sendContact} className="space-y-3">
          <Textarea
            placeholder="Please describe why you scanned this tag and the situation..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
          <Input
            placeholder="Your name (optional)"
            value={scannerName}
            onChange={(e) => setScannerName(e.target.value)}
          />
          <Input
            placeholder="Your phone or email (optional)"
            value={scannerContact}
            onChange={(e) => setScannerContact(e.target.value)}
          />
          <Button type="submit" className="w-full" variant="destructive">
            <Send className="h-4 w-4 mr-2" />
            Notify Emergency Contacts
          </Button>
        </form>
      )}
    </CardContent>
  </Card>
) : (
  /* existing finder contact form card stays here */
)}
```

**Step 2: Commit**

```bash
git add src/components/scan/item-scan-page.tsx
git commit -m "feat: add emergency contact scanner description form on scan page"
```

---

### Task 10: Sync New Tag Type to Database

**Step 1: Run the tag type sync**

The app syncs tag types from `tag-type-defaults.ts` to the database. Verify how this works — check if there's a seed script or API endpoint that syncs tag types.

Check: `prisma/seed.ts` or `src/app/api/admin/tag-types/sync` or similar.

If using the admin API, make a POST to create the tag type. If using seed, run `npx prisma db seed`.

**Step 2: Verify the tag type exists in the database**

Open the app, go to `/dashboard/items/new`, and confirm "Emergency Contact Card" appears in the tag type selector.

**Step 3: Commit (if any seed changes needed)**

---

### Task 11: Build and Verify

**Step 1: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Manual testing checklist**

1. Navigate to `/dashboard/items/new`, select "Emergency Contact Card"
2. Verify all 4 field groups render correctly
3. Verify emergency contacts form shows up to 3 contacts with name/phone/email
4. Verify "Add Emergency Contact" button disappears at 3 contacts
5. Create a test emergency contact card item
6. Link a tag and scan it
7. Verify auto-alert emails are sent to all emergency contacts
8. Fill in the "Why did you scan?" form and submit
9. Verify detailed follow-up emails are sent
10. Verify medical info renders with red alert styling on scan page

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete emergency contact card tag type implementation"
```
