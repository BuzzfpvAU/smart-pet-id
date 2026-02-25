# Auto-Activate Tag After Sign In / Sign Up

## Problem

When a user scans an inactive tag, they see options to sign up or sign in. After completing auth, they land on `/dashboard` with no memory of the tag they scanned. They must manually navigate to activate it.

## Solution

Thread the `activationCode` as a URL query parameter through the entire auth flow. After authentication completes, auto-activate the tag and redirect the user into the tag setup flow.

## Flow

1. Scan inactive tag -> InactiveTagPage shows "Sign Up & Activate" / "Sign In & Activate"
2. Links include `?activationCode=XXXX-XXXX-XXXX`
3. After auth, redirect to `/dashboard/tags/activate?code=XXXX-XXXX-XXXX`
4. Activation form auto-submits with the code
5. On success, redirect to `/dashboard/items/new?tagId={id}` (existing flow)

## Files Changed

1. `src/components/scan/inactive-tag-page.tsx` - Add activationCode param to auth links
2. `src/components/auth/login-form.tsx` - Read activationCode, pass through redirect
3. `src/app/(public)/login/actions.ts` - Accept dynamic redirectTo
4. `src/components/auth/register-form.tsx` - Read activationCode, thread through flows
5. Verify-email page/flow - Pass activationCode through to post-verification redirect
6. `src/components/tags/tag-activation-form.tsx` - Auto-submit when code param present
