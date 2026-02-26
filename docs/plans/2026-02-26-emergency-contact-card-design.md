# Emergency Contact Card — Design Document

## Overview

A new tag type that serves as a personal emergency contact card. When scanned, it displays the person's medical and emergency information, auto-notifies their emergency contacts via email, and provides a form for the scanner to explain why they scanned.

Target users: adults, elderly/vulnerable persons, children — anyone who may need assistance if found incapacitated, lost, or in distress.

## Tag Type Metadata

- **Slug:** `emergency-contact`
- **Name:** Emergency Contact Card
- **Icon:** `heart-pulse` (lucide)
- **Color:** `#dc2626` (red)

## Field Groups

### Group 1: Personal Information

| Field            | Key                 | Type | Required |
| ---------------- | ------------------- | ---- | -------- |
| Full Name        | `fullName`          | text | yes      |
| Date of Birth    | `dateOfBirth`       | text | no       |
| Preferred Language | `preferredLanguage` | text | no       |

Photo handled by existing Item photo system.

### Group 2: Medical Information (alert style)

Rendered with red/warning styling on scan page.

| Field                   | Key                    | Type     | Required |
| ----------------------- | ---------------------- | -------- | -------- |
| Blood Type              | `bloodType`            | select   | no       |
| Medical Conditions      | `medicalConditions`    | textarea | no       |
| Allergies               | `allergies`            | textarea | no       |
| Current Medications     | `currentMedications`   | textarea | no       |
| Medical Devices         | `medicalDevices`       | text     | no       |
| DNR / Advance Directive | `dnrAdvanceDirective`  | toggle   | no       |
| Special Needs           | `specialNeeds`         | textarea | no       |

Blood type select options: A+, A-, B+, B-, AB+, AB-, O+, O-

### Group 3: Emergency Contacts

| Field              | Key                 | Type                       | Required |
| ------------------ | ------------------- | -------------------------- | -------- |
| Emergency Contacts | `emergencyContacts` | `emergency_contacts_list`  | yes      |

New field type: up to 3 contacts, each with:
- **Name** (required)
- **Phone** (required)
- **Email** (required)

This extends the existing `contacts_list` type by adding an email field.

### Group 4: Additional Information

| Field              | Key                 | Type     | Required |
| ------------------ | ------------------- | -------- | -------- |
| Doctor / GP Name   | `doctorName`        | text     | no       |
| Doctor Phone       | `doctorPhone`       | tel      | no       |
| Insurance Provider | `insuranceProvider` | text     | no       |
| Policy Number      | `policyNumber`      | text     | no       |
| Home Address       | `homeAddress`       | textarea | no       |
| Additional Notes   | `additionalNotes`   | textarea | no       |

## Scan Page Behavior

### Auto-notification (on page load)

When the scan page loads for an emergency contact card:

1. Browser requests geolocation (existing behavior)
2. API call fires to log the scan (existing) AND send email alerts (new)
3. All emergency contacts with email addresses receive an alert email:
   - **Subject:** "[Name]'s emergency tag was scanned"
   - **Body:** timestamp, location (if available) with map link
4. Deduplicated — one auto-alert per scan session (prevent refresh spam)

### Scan page display

1. Person's photo and name with emergency badge
2. Medical information group (red alert styling)
3. Emergency contacts with clickable call buttons
4. Doctor info, home address, additional notes
5. Scanner form (see below)

### Scanner description form

Displayed below the emergency info on the scan page:

- **"Why did you scan this tag?"** — textarea (required to submit)
- **Your name** — text (optional)
- **Your phone or email** — text (optional)
- **Submit button**

On submission, all emergency contacts receive a detailed follow-up email:
- **Subject:** "Someone provided details about [Name]'s emergency tag scan"
- **Body:** scanner's description, scanner's contact info (if provided), location, timestamp

## Implementation Scope

### New field type: `emergency_contacts_list`
- Extends existing `contacts_list` with email field per contact
- Max 3 contacts enforced in validation and UI
- Validation: name required, phone required, email required (valid format)
- Dashboard form: repeatable contact card UI with add/remove

### New tag type definition
- Added to `src/lib/tag-type-defaults.ts`
- Seeded via existing tag type sync mechanism

### Auto-notification on scan
- New behavior: scan page for emergency-contact type triggers email on load
- New API endpoint or extension of existing scan log endpoint
- Session-based deduplication to prevent refresh spam
- Uses existing Resend email infrastructure

### Scanner description form
- New component on scan page for emergency-contact type
- Posts to new or extended scan contact API endpoint
- Triggers detailed follow-up email to all contacts

### Email templates (2 new)
- Auto-alert template (lightweight, timestamp + location)
- Detailed follow-up template (scanner description + contact info + location)

## Visibility / Privacy

Uses existing Item visibility system:
- Field-level visibility toggles in dashboard
- Default visibility applied from TagType defaults
- Medical fields default to visible (the whole point of the card)
- Scanner always sees emergency contacts (required field, always visible)
