# Stripe Payment Integration — Tagz.au

## Overview

Add direct e-commerce to Tagz.au so customers can buy smart tags through the site instead of being redirected to BuzzFPV. Uses Stripe Checkout (hosted page) for payment processing, supporting credit/debit cards, PayPal, Apple Pay, Google Pay, and Afterpay.

## Business Model

- **Products**: Physical QR/NFC smart tags sold as singles and bundles (e.g. 1 for $15, 3 for $35, 5 for $50)
- **Fulfillment**: Hybrid digital + physical. Customer receives activation codes immediately after payment; physical tags shipped separately.
- **Shipping**: Flat rate — standard and express options, Australia only initially
- **Tax**: GST 10% inclusive in displayed price, calculated by Stripe Tax
- **Guest checkout**: Supported. Stripe collects email and shipping address. Customers can create an account later when activating tags.

## Architecture

### Payment Flow

```
Customer browses /shop
  → Adds products to cart (Zustand + localStorage)
  → Clicks "Checkout"
  → POST /api/checkout:
      1. Validates cart items against current DB prices (409 if mismatch)
      2. Creates Order with status "pending" + OrderItems in database
      3. Creates Stripe Checkout Session with order.id in metadata
      4. Returns Stripe session URL
  → Customer redirected to Stripe hosted page
  → Pays via card/PayPal/Apple Pay/Afterpay
  → Stripe redirects to /order/[orderId]/success (polling until status != "pending")
  → Stripe fires webhook to POST /api/webhooks/stripe
  → Webhook handler (inside prisma.$transaction):
      1. Looks up Order by stripeSessionId (idempotent — skips if already "paid")
      2. Updates Order status to "paid", stores paymentIntentId, paymentMethod, paidAt
      3. Generates tag activation codes for purchased quantity
      4. Stores codes in orderItem.tagCodes[]
      5. Sends order confirmation email with codes
```

### New Database Models (Prisma)

**Product**
- `id` (String, cuid)
- `name` (String)
- `description` (String)
- `slug` (String, unique)
- `price` (Int, cents — e.g. 1500 = $15.00 AUD)
- `compareAtPrice` (Int?, cents — for strike-through pricing)
- `currency` (String, default "aud")
- `tagQuantity` (Int — number of tags included, e.g. 1, 3, 5)
- `images` (String[])
- `isActive` (Boolean, default true)
- `sortOrder` (Int, default 0)
- `stripeProductId` (String?)
- `stripePriceId` (String?)
- `createdAt`, `updatedAt`
- Relations: `orderItems OrderItem[]`

**Order**
- `id` (String, cuid)
- `orderNumber` (String, unique — format "TGZ-XXXXXX", generated via timestamp + 4-char random suffix for uniqueness)
- `userId` (String?, nullable for guest orders)
- `email` (String)
- `name` (String)
- `status` (enum OrderStatus — PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- `subtotal` (Int, cents)
- `shipping` (Int, cents)
- `tax` (Int, cents)
- `total` (Int, cents)
- `shippingAddress` (Json — { line1, line2?, city, state, postcode, country })
- `shippingMethod` (String — "standard" | "express")
- `stripeSessionId` (String?, unique)
- `stripePaymentIntentId` (String?)
- `paymentMethod` (String? — "card" | "paypal" | "afterpay" | "apple_pay" | "google_pay")
- `paidAt` (DateTime?)
- `shippedAt` (DateTime?)
- `trackingNumber` (String?)
- `notes` (String? — admin notes)
- `createdAt`, `updatedAt`
- Relations: `user User?`, `orderItems OrderItem[]`

**OrderStatus enum**: `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`

**Order status transitions** (enforced in API):
- PENDING → PAID (webhook only)
- PENDING → CANCELLED (expired session cleanup or admin)
- PAID → PROCESSING (admin)
- PAID → REFUNDED (admin via Stripe refund)
- PROCESSING → SHIPPED (admin, requires trackingNumber)
- SHIPPED → DELIVERED (admin)
- PROCESSING → CANCELLED (admin, triggers Stripe refund)

**OrderItem**
- `id` (String, cuid)
- `orderId` (String)
- `productId` (String)
- `quantity` (Int)
- `unitPrice` (Int, cents)
- `totalPrice` (Int, cents)
- `tagCodes` (String[] — activation codes assigned after payment)
- `createdAt`
- Relations: `order Order`, `product Product`

### New Pages & Routes

**Public:**
- `/shop` — Product catalog grid (replaces `/buy`)
- `/buy` — 301 redirect to `/shop` (preserve existing links/SEO)
- `/cart` — Cart page with line items, quantities, shipping selection, totals
- `/order/[id]/success` — Order confirmation page (polls for order status, shows activation codes once paid)

**Dashboard (logged-in users):**
- `/dashboard/orders` — List of user's orders
- `/dashboard/orders/[id]` — Order detail with codes, tracking

**Admin:**
- `/admin/products` — Product CRUD (name, price, tag quantity, images, Stripe sync). Delete = soft-delete (sets isActive: false) since products are referenced by OrderItems.
- `/admin/orders` — All orders table with filters and search
- `/admin/orders/[id]` — Order detail with status workflow, refund, tracking, notes

### New API Routes

- `GET /api/products` — List active products (public)
- `POST /api/checkout` — Validate cart prices, create pending Order, create Stripe Checkout Session, return session URL
- `POST /api/webhooks/stripe` — Handle Stripe events:
  - `checkout.session.completed` — mark order paid, generate tags, send confirmation email
  - `checkout.session.expired` — mark pending order as cancelled, clean up
  - `payment_intent.refunded` — mark order as refunded
  - `charge.dispute.created` — flag order for admin review (add admin note)
- `GET /api/orders` — List orders for logged-in user
- `GET /api/orders/[id]` — Get order detail (by order ID; works for both logged-in user's own orders and the success page)
- `PATCH /api/admin/orders/[id]` — Update order status (validates allowed transitions), tracking number, notes
- `POST /api/admin/orders/[id]/refund` — Trigger Stripe refund
- `POST /api/admin/products` — Create product
- `PUT /api/admin/products/[id]` — Update product
- `DELETE /api/admin/products/[id]` — Soft-delete (set isActive: false)
- `POST /api/admin/products/[id]/sync-stripe` — Sync product to Stripe

### Cart (Client-Side)

Zustand store with localStorage persistence:
- `items`: array of `{ productId, slug, name, price, tagQuantity, quantity, image }`
- `addItem(product)`, `removeItem(productId)`, `updateQuantity(productId, qty)`, `clearCart()`
- Derived: `subtotal`, `itemCount`

Price validation: `POST /api/checkout` re-fetches current product prices from the database. If any price has changed since the cart was populated, return 409 with updated prices so the client can refresh the cart before retrying.

### Stripe Configuration

**Required env vars:**
- `STRIPE_SECRET_KEY` — server-side API key
- `STRIPE_WEBHOOK_SECRET` — webhook endpoint signing secret

**Stripe Checkout Session config:**
- `mode: "payment"` (one-time, not subscription)
- `line_items` — mapped from cart items using `stripePriceId`
- `shipping_address_collection: { allowed_countries: ["AU"] }`
- `shipping_options` — standard and express rates (Stripe Shipping Rate objects)
- `automatic_tax: { enabled: true }`
- `customer_email` — pre-filled if user is logged in
- `metadata: { orderId }` — links session back to our Order record
- `success_url` — `/order/{orderId}/success`
- `cancel_url` — `/cart`

**Stripe objects to create (one-time setup or admin sync):**
- Products + Prices for each Product in database
- Shipping Rates for standard and express

### Email Templates

Two new templates added to existing `src/lib/email.ts`, following the same design system (gold/black branding, Outfit/Inter Tight fonts):

1. **sendOrderConfirmation(order, items)** — Receipt with:
   - Order number, date
   - Line items with prices
   - Subtotal, shipping, GST, total
   - Activation codes per item
   - Shipping address
   - Link to activate tags

2. **sendShippingNotification(order)** — Shipping update with:
   - Order number
   - Tracking number/link
   - Estimated delivery
   - Shipping address

### Tag Generation on Purchase

Extracted into a shared function `generateTagsForOrder()` in `src/lib/tags.ts` (reusable by both webhook handler and admin tools):

When webhook confirms payment (inside `prisma.$transaction`):
1. For each OrderItem, generate `quantity * product.tagQuantity` tags
2. Each tag gets a unique activationCode (7-char) and shortCode, status "inactive"
3. Tags are generic — no tagType association. Users choose what to link them to when activating (same flow as admin-generated tags).
4. Store activation codes in `orderItem.tagCodes[]`
5. Include codes in confirmation email

### Security

- Webhook signature verification using `stripe.webhooks.constructEvent()`
- Idempotent webhook handling (check if order already marked as "paid" for this session ID — skip if so)
- All webhook order+tag operations wrapped in `prisma.$transaction()` for atomicity
- No raw card data touches our server (Stripe Checkout handles PCI)
- Admin routes protected by `requireAdmin()` as existing pattern
- Checkout endpoint validates cart prices against DB before creating session

### Success Page Timing

The Order record is created *before* redirecting to Stripe (status: "pending"). The success page loads the order by its database ID (not the Stripe session ID). It polls `GET /api/orders/[id]` every 2 seconds until status changes from "pending" to "paid" (typically <5 seconds). Shows a loading state during polling, then displays order details and activation codes.

Timeout after 30 seconds with a message: "Payment received — your confirmation email with activation codes is on its way."

### Packages to Install

- `stripe` — server-side Stripe SDK (handles both API calls and webhook verification)

Note: `@stripe/stripe-js` is not needed — Stripe Checkout uses a simple URL redirect, no client-side Stripe.js required.

### Development & Testing

- Use Stripe test mode keys during development
- Test webhooks locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Key test scenarios: successful purchase, expired session, refund, duplicate webhook delivery, price mismatch at checkout
