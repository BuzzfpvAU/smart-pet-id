# Stripe Payment Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct e-commerce to Tagz.au so customers can buy smart tags through Stripe Checkout, replacing the external BuzzFPV redirect.

**Architecture:** Stripe Checkout (hosted page) handles payment collection. Order records are created before redirect (status "pending"), updated to "paid" via webhook. Tags are generated atomically inside a `prisma.$transaction`. Cart is client-side Zustand with localStorage.

**Tech Stack:** Next.js 16 (App Router), Prisma/PostgreSQL, Stripe Checkout, Zustand, Resend, shadcn/ui, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-05-24-stripe-payment-integration-design.md`

---

## File Structure

### New files to create:
- `src/lib/stripe.ts` — Stripe client singleton
- `src/lib/tags.ts` — Shared tag generation function (extracted from admin API)
- `src/lib/orders.ts` — Order number generation, status transition validation
- `src/stores/cart.ts` — Zustand cart store with localStorage persistence
- `src/app/api/products/route.ts` — Public product listing API
- `src/app/api/checkout/route.ts` — Checkout session creation
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `src/app/api/orders/route.ts` — User order listing
- `src/app/api/orders/[id]/route.ts` — User order detail
- `src/app/api/admin/products/route.ts` — Admin product list + create
- `src/app/api/admin/products/[id]/route.ts` — Admin product update + soft-delete
- `src/app/api/admin/products/[id]/sync-stripe/route.ts` — Stripe product sync
- `src/app/api/admin/orders/route.ts` — Admin order listing
- `src/app/api/admin/orders/[id]/route.ts` — Admin order detail + status update
- `src/app/api/admin/orders/[id]/refund/route.ts` — Stripe refund
- `src/app/(public)/shop/page.tsx` — Product catalog
- `src/app/(public)/shop/layout.tsx` — Shop metadata only (parent layout provides PublicHeader + Footer)
- `src/app/(public)/cart/page.tsx` — Shopping cart
- `src/app/(public)/cart/layout.tsx` — Cart metadata only
- `src/app/(public)/order/[id]/success/page.tsx` — Order success + polling
- `src/app/(public)/order/[id]/success/layout.tsx` — Success metadata only
- `src/app/(admin)/admin/products/page.tsx` — Admin product management
- `src/app/(admin)/admin/orders/page.tsx` — Admin order list
- `src/app/(admin)/admin/orders/[id]/page.tsx` — Admin order detail
- `src/app/(dashboard)/dashboard/orders/page.tsx` — User order history
- `src/app/(dashboard)/dashboard/orders/[id]/page.tsx` — User order detail
- `src/stores/` — New directory for Zustand stores

### Files to modify:
- `prisma/schema.prisma` — Add Product, Order, OrderItem models + OrderStatus enum
- `src/lib/email.ts` — Add sendOrderConfirmation + sendShippingNotification
- `src/app/buy/page.tsx` — Replace with redirect to /shop
- `src/components/layout/admin-sidebar.tsx` — Add Products + Orders nav links
- `src/components/layout/dashboard-sidebar.tsx` — Add Orders nav link, update Buy link
- `src/components/layout/public-header.tsx` — Change "Buy a Tag" to "Shop"
- `.env.example` — Add Stripe env vars

---

## Chunk 1: Foundation — Schema, Stripe, Utilities

### Task 1: Install Stripe and add environment variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Install stripe package**

```bash
npm install stripe
```

- [ ] **Step 2: Add Stripe env vars to .env.example**

Append to `.env.example`:
```
# Stripe (https://stripe.com)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

- [ ] **Step 3: Add Stripe env vars to local .env**

Add your Stripe test mode keys from https://dashboard.stripe.com/test/apikeys:
```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

The webhook secret comes from running `stripe listen` (Task 25).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: install stripe SDK and add env var template"
```

---

### Task 2: Add Prisma schema — Product, Order, OrderItem, OrderStatus enum

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add OrderStatus enum and new models to schema.prisma**

Add after the existing `ChecklistSubmission` model at the end of the file:

```prisma
enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model Product {
  id              String   @id @default(cuid())
  name            String
  description     String
  slug            String   @unique
  price           Int      // cents (e.g. 1500 = $15.00 AUD)
  compareAtPrice  Int?     // cents, for strike-through pricing
  currency        String   @default("aud")
  tagQuantity     Int      @default(1)
  images          String[]
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  stripeProductId String?
  stripePriceId   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orderItems      OrderItem[]

  @@map("products")
}

model Order {
  id                    String      @id @default(cuid())
  orderNumber           String      @unique
  userId                String?
  email                 String
  name                  String
  status                OrderStatus @default(PENDING)
  subtotal              Int         // cents
  shipping              Int         // cents
  tax                   Int         // cents
  total                 Int         // cents
  shippingAddress       Json?
  shippingMethod        String      @default("standard")
  stripeSessionId       String?     @unique
  stripePaymentIntentId String?
  paymentMethod         String?
  paidAt                DateTime?
  shippedAt             DateTime?
  trackingNumber        String?
  notes                 String?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  user                  User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  orderItems            OrderItem[]

  @@index([userId])
  @@index([email])
  @@index([status])
  @@map("orders")
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  productId  String
  quantity   Int
  unitPrice  Int      // cents
  totalPrice Int      // cents
  tagCodes   String[]
  createdAt  DateTime @default(now())

  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}
```

- [ ] **Step 2: Add orders relation to User model**

In the `User` model, add `orders Order[]` to the relations list (after the `passkeys` line):

```prisma
  orders            Order[]
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add_ecommerce_models
```

Expected: Migration creates `products`, `orders`, `order_items` tables and `OrderStatus` enum.

- [ ] **Step 4: Verify generated client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Product, Order, OrderItem models with OrderStatus enum"
```

---

### Task 3: Create Stripe server client

**Files:**
- Create: `src/lib/stripe.ts`

- [ ] **Step 1: Create the Stripe singleton**

```typescript
import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const stripe: Stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!);

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;
```

Note: Omitting `apiVersion` lets the SDK use its bundled default version, which is the safest approach.

- [ ] **Step 2: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add Stripe server client singleton"
```

---

### Task 4: Create order utilities — order number generation + status transitions

**Files:**
- Create: `src/lib/orders.ts`

- [ ] **Step 1: Create order utility functions**

```typescript
import { randomBytes } from "crypto";
import { OrderStatus } from "@/generated/prisma/client";

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `TGZ-${timestamp}-${suffix}`;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/orders.ts
git commit -m "feat: add order number generation and status transition validation"
```

---

### Task 5: Extract shared tag generation function

**Files:**
- Create: `src/lib/tags.ts`

This extracts the tag generation logic from `src/app/api/admin/tags/route.ts` into a reusable function that both the admin batch endpoint and the webhook handler can use.

- [ ] **Step 1: Create shared tag generation function**

```typescript
import { generateActivationCode } from "@/lib/auth-helpers";
import { generateShortCode } from "@/lib/shortcode";

// Accepts both PrismaClient and transaction clients
type PrismaLike = {
  tag: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
};

export async function generateTags(
  prisma: PrismaLike,
  count: number,
  batchId: string
): Promise<{ codes: string[]; shortCodes: string[] }> {
  const codes: string[] = [];
  const shortCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    let code: string;
    let exists = true;

    do {
      code = generateActivationCode();
      const existing = await prisma.tag.findUnique({
        where: { activationCode: code },
      });
      exists = !!existing;
    } while (exists);

    const shortCode = generateShortCode();

    await prisma.tag.create({
      data: {
        activationCode: code,
        shortCode,
        status: "inactive",
        batchId,
      },
    });

    codes.push(code);
    shortCodes.push(shortCode);
  }

  return { codes, shortCodes };
}
```

- [ ] **Step 2: Update admin tags route to use shared function**

In `src/app/api/admin/tags/route.ts`, replace the tag generation loop in the POST handler with:

```typescript
import { generateTags } from "@/lib/tags";
```

Replace the loop (lines ~56-82) with:
```typescript
    const { codes, shortCodes } = await generateTags(prisma, count, batchId);
```

Remove the now-unused imports: `generateShortCode` from `@/lib/shortcode` and `generateActivationCode` from `@/lib/auth-helpers`.

- [ ] **Step 3: Verify admin tag generation still works**

Start the dev server and test via the admin panel or:
```bash
curl -X POST http://localhost:3000/api/admin/tags \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"count": 1}'
```

Expected: Returns `{ codes: [...], batchId: "...", count: 1 }`

- [ ] **Step 4: Commit**

```bash
git add src/lib/tags.ts src/app/api/admin/tags/route.ts
git commit -m "refactor: extract tag generation into shared lib for reuse"
```

---

## Chunk 2: Products — Admin CRUD + Public API

### Task 6: Admin products API — list and create

**Files:**
- Create: `src/app/api/admin/products/route.ts`

- [ ] **Step 1: Create admin products API**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, slug, price, compareAtPrice, tagQuantity, images } = body;

    if (!name || !slug || !price) {
      return NextResponse.json({ error: "Name, slug, and price are required" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }

    const maxSort = await prisma.product.aggregate({ _max: { sortOrder: true } });

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        slug,
        price: Math.round(price),
        compareAtPrice: compareAtPrice ? Math.round(compareAtPrice) : null,
        tagQuantity: tagQuantity || 1,
        images: images || [],
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/products/route.ts
git commit -m "feat: add admin products API (list + create)"
```

---

### Task 7: Admin products API — update, soft-delete, and Stripe sync

**Files:**
- Create: `src/app/api/admin/products/[id]/route.ts`
- Create: `src/app/api/admin/products/[id]/sync-stripe/route.ts`

- [ ] **Step 1: Create product update + soft-delete endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, slug, price, compareAtPrice, tagQuantity, images, isActive, sortOrder } = body;

    if (slug) {
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(slug !== undefined && { slug }),
        ...(price !== undefined && { price: Math.round(price) }),
        ...(compareAtPrice !== undefined && { compareAtPrice: compareAtPrice ? Math.round(compareAtPrice) : null }),
        ...(tagQuantity !== undefined && { tagQuantity }),
        ...(images !== undefined && { images }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin products PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin products DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create Stripe sync endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let stripeProduct;
    if (product.stripeProductId) {
      stripeProduct = await stripe.products.update(product.stripeProductId, {
        name: product.name,
        description: product.description,
        active: product.isActive,
      });
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: { productId: product.id },
      });
    }

    let stripePrice;
    if (product.stripePriceId) {
      // Prices are immutable in Stripe — archive old one and create new
      await stripe.prices.update(product.stripePriceId, { active: false });
    }

    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.price,
      currency: product.currency,
      metadata: { productId: product.id },
    });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json({ error: "Failed to sync with Stripe" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/products/\[id\]/route.ts src/app/api/admin/products/\[id\]/sync-stripe/route.ts
git commit -m "feat: add admin product update, soft-delete, and Stripe sync APIs"
```

---

### Task 8: Public products API

**Files:**
- Create: `src/app/api/products/route.ts`

- [ ] **Step 1: Create public products endpoint**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        tagQuantity: true,
        images: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/products/route.ts
git commit -m "feat: add public products API"
```

---

### Task 9: Admin products page

**Files:**
- Create: `src/app/(admin)/admin/products/page.tsx`
- Modify: `src/components/layout/admin-sidebar.tsx`

- [ ] **Step 1: Create admin products page**

Follow the exact pattern from `src/app/(admin)/admin/tag-types/page.tsx` — "use client", useState for products list + dialog state, fetch on mount, table with CRUD actions, Dialog for create/edit form.

Fields in the create/edit form:
- Name (text input)
- Slug (text input, auto-generated from name)
- Description (textarea)
- Price in dollars (number input — multiply by 100 for cents on save)
- Compare-at price in dollars (optional number input)
- Tag quantity (number input, default 1)
- Active toggle (switch)

Table columns: Name, Price (formatted as $X.XX), Tag Qty, Stripe Status (synced/not synced), Active, Actions (Edit, Sync to Stripe, Deactivate).

The "Sync to Stripe" button calls `POST /api/admin/products/[id]/sync-stripe`.

Use existing shadcn components: Card, Table, Dialog, Button, Input, Label, Textarea, Switch, Badge.

- [ ] **Step 2: Add Products + Orders to admin sidebar**

In `src/components/layout/admin-sidebar.tsx`, add to the `navItems` array:

```typescript
import { ShoppingBag, Receipt } from "lucide-react";
```

Add after the Overview entry:
```typescript
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
```

- [ ] **Step 3: Verify in browser**

Start dev server, log in as admin, navigate to `/admin/products`. Verify:
- Empty state shows correctly
- Can create a product with name, price, tag quantity
- Product appears in table
- Can sync to Stripe (requires valid STRIPE_SECRET_KEY)
- Can edit and deactivate products

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/products/page.tsx src/components/layout/admin-sidebar.tsx
git commit -m "feat: add admin products page with CRUD and Stripe sync"
```

---

## Chunk 3: Cart + Shop + Checkout

### Task 10: Create Zustand cart store

**Files:**
- Create: `src/stores/cart.ts`

- [ ] **Step 1: Create cart store**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  tagQuantity: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "tagz-cart",
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/cart.ts
git commit -m "feat: add Zustand cart store with localStorage persistence"
```

---

### Task 11: Shop page — product catalog

**Files:**
- Create: `src/app/(public)/shop/page.tsx`
- Create: `src/app/(public)/shop/layout.tsx`

- [ ] **Step 1: Create shop layout (metadata only — parent `(public)` layout already provides PublicHeader + Footer)**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Smart Tags | Tagz.au",
  description: "Buy QR + NFC smart tags for pets, keys, luggage and more. Singles and bundle packs available with free activation.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create shop page**

"use client" component that:
- Fetches products from `GET /api/products` on mount
- Displays a grid of product cards (responsive: 1 col mobile, 2 col md, 3 col lg)
- Each card shows: product image (or placeholder), name, tag quantity ("Includes X tags"), price formatted as `$XX.XX`, compare-at price with strikethrough if set, savings badge for bundles
- "Add to Cart" button on each card — calls `useCartStore().addItem()`
- Toast notification on add ("Added to cart!")
- Cart icon in corner showing item count badge, links to `/cart`

Style: Follow existing page patterns — use `container` class, dark background sections, accent color for CTAs, Outfit font for headings, Inter Tight for body.

- [ ] **Step 3: Update PublicHeader nav**

In `src/components/layout/public-header.tsx`, change the first nav link:
```typescript
  { href: "/shop", label: "Shop" },
```

- [ ] **Step 4: Replace /buy with redirect**

Replace `src/app/buy/page.tsx` contents with:

```typescript
import { permanentRedirect } from "next/navigation";

export default function BuyPage() {
  permanentRedirect("/shop");
}
```

- [ ] **Step 5: Update dashboard sidebar Buy link**

In `src/components/layout/dashboard-sidebar.tsx`, change the "Buy a Tag" link `href` from `/buy` to `/shop` and update the label to "Shop".

- [ ] **Step 6: Verify in browser**

Navigate to `/shop`. Verify:
- Products load from API (create a test product via admin first if needed)
- Add to cart works, shows toast
- Cart count badge updates
- `/buy` redirects to `/shop`
- Public header shows "Shop" link
- Dashboard sidebar shows "Shop" link

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/shop/ src/app/buy/page.tsx src/components/layout/public-header.tsx src/components/layout/dashboard-sidebar.tsx
git commit -m "feat: add shop page with product catalog and cart integration"
```

---

### Task 12: Cart page

**Files:**
- Create: `src/app/(public)/cart/page.tsx`
- Create: `src/app/(public)/cart/layout.tsx`

- [ ] **Step 1: Create cart layout (metadata only — parent layout handles structure)**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart | Tagz.au",
  alternates: { canonical: "/cart" },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create cart page**

"use client" component that:
- Reads cart from `useCartStore()`
- Shows empty state if no items ("Your cart is empty" with link to /shop)
- Lists each item: name, tag quantity, unit price, quantity selector (+/- buttons), line total, remove button
- Summary section: subtotal, note "Shipping calculated at checkout", total (subtotal only — shipping added on Stripe page)
- "Proceed to Checkout" button — POSTs to `/api/checkout` with cart items, then redirects to the returned Stripe URL (Stripe handles shipping selection)
- Loading state on checkout button while API call is in progress
- Handle 409 (price mismatch) — show toast "Prices have changed, cart updated" and refresh cart items with new prices

Format all prices with: `(amount / 100).toFixed(2)` — create a small `formatPrice` helper.

- [ ] **Step 3: Verify in browser**

Navigate to `/cart`. Verify:
- Empty state shows when cart is empty
- Items show correctly with quantities
- +/- updates quantity
- Remove removes item
- Subtotal/total calculate correctly
- "Shipping calculated at checkout" note displays

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/cart/
git commit -m "feat: add cart page with quantity controls and checkout flow"
```

---

### Task 13: Checkout API — create pending order + Stripe session

**Files:**
- Create: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Create checkout endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate cart against current DB prices
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const priceMismatches: { productId: string; expected: number; actual: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }
      if (!product.stripePriceId) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not yet available for purchase (not synced to Stripe)` },
          { status: 400 }
        );
      }
      if (product.price !== item.price) {
        priceMismatches.push({
          productId: item.productId,
          expected: item.price,
          actual: product.price,
        });
      }
    }

    if (priceMismatches.length > 0) {
      return NextResponse.json(
        {
          error: "Prices have changed",
          updates: priceMismatches.map((m) => ({
            productId: m.productId,
            newPrice: m.actual,
          })),
        },
        { status: 409 }
      );
    }

    // Calculate subtotal (shipping + tax finalized in webhook from Stripe session data)
    let subtotal = 0;
    const orderItemsData = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: lineTotal,
      };
    });

    const tax = Math.round(subtotal / 11); // GST is 1/11th of GST-inclusive price

    // Create pending order — shipping/total updated by webhook with actual Stripe selection
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? "pending@checkout",
        name: session?.user?.name ?? "Guest",
        status: "PENDING",
        subtotal,
        shipping: 0,
        tax,
        total: subtotal,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { orderItems: true },
    });

    // Create Stripe Checkout Session — Stripe handles shipping selection
    const lineItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      return {
        price: product.stripePriceId!,
        quantity: item.quantity,
      };
    });

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 500, currency: "aud" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1000, currency: "aud" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      ...(session?.user?.email && { customer_email: session.user.email }),
      metadata: {
        orderId: order.id,
      },
      success_url: `${BASE_URL}/order/${order.id}/success`,
      cancel_url: `${BASE_URL}/cart`,
    });

    // Store Stripe session ID on order
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat: add checkout API — creates pending order and Stripe session"
```

---

## Chunk 4: Webhook + Success Page + Order APIs

### Task 14: Stripe webhook handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create webhook handler**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateTags } from "@/lib/tags";
import { sendOrderConfirmation } from "@/lib/email";
import crypto from "crypto";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  });

  if (!order || order.status !== "PENDING") return; // idempotent

  const batchId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    // Generate tags for each order item
    for (const item of order.orderItems) {
      const tagCount = item.quantity * item.product.tagQuantity;
      const { codes } = await generateTags(tx, tagCount, batchId);

      await tx.orderItem.update({
        where: { id: item.id },
        data: { tagCodes: codes },
      });
    }

    // Get shipping cost from Stripe session
    const shippingCost = session.shipping_cost?.amount_total ?? 0;
    const shippingMethod = shippingCost >= 1000 ? "express" : "standard";

    // Update order status with Stripe-authoritative data
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
        paymentMethod: session.payment_method_types?.[0] ?? null,
        email: session.customer_details?.email ?? order.email,
        name: session.customer_details?.name ?? order.name,
        shipping: shippingCost,
        shippingMethod,
        total: order.subtotal + shippingCost,
        shippingAddress: session.shipping_details?.address
          ? {
              line1: session.shipping_details.address.line1,
              line2: session.shipping_details.address.line2,
              city: session.shipping_details.address.city,
              state: session.shipping_details.address.state,
              postcode: session.shipping_details.address.postal_code,
              country: session.shipping_details.address.country,
            }
          : order.shippingAddress,
      },
    });
  });

  // Send confirmation email (outside transaction — non-critical)
  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  });

  if (updatedOrder) {
    try {
      await sendOrderConfirmation(updatedOrder);
    } catch (err) {
      console.error("Failed to send order confirmation email:", err);
    }
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "REFUNDED" } },
    data: { status: "REFUNDED" },
  });
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = dispute.payment_intent as string;
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: [order.notes, `⚠️ DISPUTE CREATED: ${dispute.reason} (${new Date().toISOString()})`]
          .filter(Boolean)
          .join("\n"),
      },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe webhook handler with checkout completion, expiry, and dispute handling"
```

---

### Task 15: Order APIs — user order list and detail

**Files:**
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[id]/route.ts`

- [ ] **Step 1: Create user orders list endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: { product: { select: { name: true, slug: true, tagQuantity: true } } },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create order detail endpoint**

This endpoint serves both logged-in users viewing their own orders AND the success page (which needs to view any order by ID right after checkout, before the user might be logged in).

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { product: { select: { name: true, slug: true, tagQuantity: true, images: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // For non-pending orders, only allow the owner or admin to view
    const session = await auth();
    const isOwner = session?.user?.id && order.userId === session.user.id;
    const isAdmin = session?.user?.role === "admin";
    const isPending = order.status === "PENDING";

    // Allow viewing pending orders (success page) and paid orders briefly
    // In production, add an access token for tighter security
    if (!isOwner && !isAdmin && !isPending && order.status !== "PAID") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts src/app/api/orders/\[id\]/route.ts
git commit -m "feat: add user order list and detail APIs"
```

---

### Task 16: Order success page with polling

**Files:**
- Create: `src/app/(public)/order/[id]/success/page.tsx`
- Create: `src/app/(public)/order/[id]/success/layout.tsx`

- [ ] **Step 1: Create success layout (metadata only)**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | Tagz.au",
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create success page**

"use client" component that:
- Reads `id` from params (this is the order database ID)
- Polls `GET /api/orders/[id]` every 2 seconds while status is "PENDING"
- Shows loading state: "Processing your payment..." with spinner
- After 30 seconds timeout: show fallback message "Payment received — your confirmation email with activation codes is on its way."
- On status "PAID": stop polling, show success view:
  - Green checkmark icon
  - "Order confirmed!" heading
  - Order number
  - Line items with quantities
  - Total paid
  - Activation codes for each item, displayed in monospace with copy buttons
  - Shipping address
  - "Your tags are on their way!" message
  - CTA: "Activate Your Tags" → link to `/dashboard/tags/activate` (or `/register` if not logged in)
- On status "CANCELLED": show "Payment was not completed" with link back to /shop
- Clears the cart store on successful load (`useCartStore().clearCart()`)

- [ ] **Step 3: Verify end-to-end**

1. Create a test product via admin, sync to Stripe
2. Add to cart, proceed to checkout
3. Use Stripe test card `4242 4242 4242 4242` with any future expiry
4. Verify redirect to success page
5. Verify polling shows activation codes once webhook fires

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/order/
git commit -m "feat: add order success page with payment status polling"
```

---

## Chunk 5: Email Templates

### Task 17: Order confirmation email

**Files:**
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Add sendOrderConfirmation function**

Add to `src/lib/email.ts`, following the existing template pattern (use `emailWrapper`, `emailHeader`, `emailFooter`, `sectionHeading`, `ctaButton`, `accentBar`, `infoCard`, `escapeHtml`):

```typescript
export async function sendOrderConfirmation(order: {
  orderNumber: string;
  email: string;
  name: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: any;
  shippingMethod: string;
  orderItems: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    tagCodes: string[];
    product: { name: string };
  }>;
}) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const itemRows = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; font-family: 'Inter Tight', sans-serif; font-size: 14px; color: #2d2d2d; border-bottom: 1px solid #f0efed;">
            ${escapeHtml(item.product.name)} × ${item.quantity}
          </td>
          <td style="padding: 8px 0; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #2d2d2d; text-align: right; border-bottom: 1px solid #f0efed;">
            ${formatPrice(item.totalPrice)}
          </td>
        </tr>`
    )
    .join("");

  const activationCodes = order.orderItems
    .flatMap((item) =>
      item.tagCodes.map(
        (code) => `
          <div style="background: #1a1a1a; color: #FFD700; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; padding: 10px 16px; border-radius: 6px; margin: 4px 0; text-align: center; letter-spacing: 1px;">
            ${escapeHtml(code)}
          </div>`
      )
    )
    .join("");

  const address = order.shippingAddress;
  const addressHtml = address
    ? `<p style="font-size: 14px; color: #2d2d2d; margin: 0; line-height: 1.6;">
        ${escapeHtml(address.line1 || "")}<br>
        ${address.line2 ? escapeHtml(address.line2) + "<br>" : ""}
        ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} ${escapeHtml(address.postcode || "")}<br>
        ${escapeHtml(address.country || "AU")}
      </p>`
    : "";

  const content = `
    ${sectionHeading("Order Confirmed! 🎉")}
    ${accentBar()}
    <p style="font-size: 15px; color: #2d2d2d; margin: 0 0 8px 0;">
      Hi ${escapeHtml(order.name || "there")}, thanks for your order!
    </p>
    ${metaText(`Order #${escapeHtml(order.orderNumber)}`)}

    ${infoCard(`
      <table style="width: 100%; border-collapse: collapse;">
        ${itemRows}
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c;">Subtotal</td>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c; text-align: right;">${formatPrice(order.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c;">Shipping (${order.shippingMethod})</td>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c; text-align: right;">${formatPrice(order.shipping)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c;">GST (included)</td>
          <td style="padding: 8px 0; font-size: 13px; color: #8c8c8c; text-align: right;">${formatPrice(order.tax)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 0 0; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #1a1a1a; border-top: 2px solid #1a1a1a;">Total</td>
          <td style="padding: 12px 0 0 0; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #1a1a1a; text-align: right; border-top: 2px solid #1a1a1a;">${formatPrice(order.total)}</td>
        </tr>
      </table>
    `)}

    ${sectionHeading("Your Activation Codes")}
    ${accentBar("#1a1a1a")}
    <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 12px 0;">
      Use these codes to activate your tags at Tagz.au:
    </p>
    ${activationCodes}

    ${ctaButton(`${BASE_URL}/dashboard/tags/activate`, "Activate Your Tags")}

    ${address ? `
      ${sectionHeading("Shipping To")}
      ${accentBar()}
      ${infoCard(addressHtml)}
      <p style="font-size: 13px; color: #8c8c8c; margin: 8px 0 0 0;">
        Your physical tags will be shipped separately. We'll email you a tracking number when they're on their way.
      </p>
    ` : ""}
  `;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `Order Confirmed — #${order.orderNumber}`,
    html: emailWrapper(content),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add order confirmation email template"
```

---

### Task 18: Shipping notification email

**Files:**
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Add sendShippingNotification function**

```typescript
export async function sendShippingNotification(order: {
  orderNumber: string;
  email: string;
  name: string;
  trackingNumber: string;
  shippingAddress: any;
  shippingMethod: string;
}) {
  const address = order.shippingAddress;
  const addressHtml = address
    ? `<p style="font-size: 14px; color: #2d2d2d; margin: 0; line-height: 1.6;">
        ${escapeHtml(address.line1 || "")}<br>
        ${address.line2 ? escapeHtml(address.line2) + "<br>" : ""}
        ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} ${escapeHtml(address.postcode || "")}<br>
        ${escapeHtml(address.country || "AU")}
      </p>`
    : "";

  const content = `
    ${sectionHeading("Your Tags Have Shipped! 📦")}
    ${accentBar()}
    <p style="font-size: 15px; color: #2d2d2d; margin: 0 0 8px 0;">
      Hi ${escapeHtml(order.name || "there")}, your order is on its way!
    </p>
    ${metaText(`Order #${escapeHtml(order.orderNumber)}`)}

    ${infoCard(`
      <p style="font-size: 13px; color: #8c8c8c; margin: 0 0 4px 0;">Tracking Number</p>
      <p style="font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0;">
        ${escapeHtml(order.trackingNumber)}
      </p>
    `)}

    ${address ? `
      ${sectionHeading("Delivering To")}
      ${accentBar()}
      ${infoCard(addressHtml)}
    ` : ""}

    <p style="font-size: 14px; color: #5a5a5a; margin: 16px 0 0 0;">
      ${order.shippingMethod === "express" ? "Estimated delivery: 1–3 business days." : "Estimated delivery: 3–7 business days."}
    </p>

    ${ctaButton(`${BASE_URL}/dashboard/orders`, "View Your Orders")}
  `;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.email,
    subject: `Your Tags Have Shipped — #${order.orderNumber}`,
    html: emailWrapper(content),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add shipping notification email template"
```

---

## Chunk 6: Admin Orders

### Task 19: Admin orders API — list, detail, update status, refund

**Files:**
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/orders/[id]/route.ts`
- Create: `src/app/api/admin/orders/[id]/refund/route.ts`

- [ ] **Step 1: Create admin orders list endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } },
        },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin order detail + status update endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/orders";
import { sendShippingNotification } from "@/lib/email";
import { OrderStatus } from "@/generated/prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, trackingNumber, notes } = body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status) {
      if (!canTransition(order.status, status as OrderStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${order.status} to ${status}` },
          { status: 400 }
        );
      }

      if (status === "SHIPPED" && !trackingNumber && !order.trackingNumber) {
        return NextResponse.json(
          { error: "Tracking number is required when marking as shipped" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "SHIPPED") updateData.shippedAt = new Date();

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Send shipping notification email
    if (status === "SHIPPED" && (trackingNumber || order.trackingNumber)) {
      try {
        await sendShippingNotification({
          orderNumber: updated.orderNumber,
          email: updated.email,
          name: updated.name,
          trackingNumber: trackingNumber || order.trackingNumber!,
          shippingAddress: updated.shippingAddress,
          shippingMethod: updated.shippingMethod,
        });
      } catch (err) {
        console.error("Failed to send shipping notification:", err);
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create refund endpoint**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json({ error: "No payment to refund" }, { status: 400 });
    }

    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }

    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "REFUNDED",
        notes: [order.notes, `Refunded by ${session.user.email} on ${new Date().toISOString()}`]
          .filter(Boolean)
          .join("\n"),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/orders/
git commit -m "feat: add admin orders API — list, detail, status update, refund"
```

---

### Task 20: Admin orders page

**Files:**
- Create: `src/app/(admin)/admin/orders/page.tsx`
- Create: `src/app/(admin)/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create admin orders list page**

"use client" component following the existing admin page pattern:
- Fetches from `GET /api/admin/orders` on mount
- Filter tabs/buttons for status: All, Paid, Processing, Shipped, Delivered, Cancelled, Refunded
- Search input (debounced) for order number, name, email
- Table columns: Order #, Customer (name + email), Date, Items (count), Total (formatted), Status (Badge with color), Payment Method
- Click row → navigate to `/admin/orders/[id]`

Status badge colors:
- PENDING: gray
- PAID: blue
- PROCESSING: yellow
- SHIPPED: purple
- DELIVERED: green
- CANCELLED: red
- REFUNDED: orange

- [ ] **Step 2: Create admin order detail page**

"use client" component showing:
- Back button to `/admin/orders`
- Order header: order number, status badge, date
- Customer info card: name, email
- Shipping address card
- Line items table: product name, qty, unit price, line total, activation codes (monospace)
- Payment info: method, Stripe payment intent ID, paid at
- Totals: subtotal, shipping, GST, total
- Tracking number input + save button
- Admin notes textarea + save button
- Action buttons (based on current status and allowed transitions):
  - PAID → "Mark as Processing" button
  - PROCESSING → "Mark as Shipped" button (shows tracking number input first)
  - SHIPPED → "Mark as Delivered" button
  - PAID/PROCESSING → "Refund" button (with confirmation dialog)

All state updates call `PATCH /api/admin/orders/[id]` or `POST /api/admin/orders/[id]/refund`.

- [ ] **Step 3: Verify in browser**

Navigate to `/admin/orders`. Verify:
- Orders list loads with test order data
- Filter by status works
- Search works
- Click into order detail shows all info
- Status transitions work with proper validation
- Tracking number save works

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/orders/
git commit -m "feat: add admin orders list and detail pages"
```

---

## Chunk 7: Dashboard Orders

### Task 21: Dashboard order pages

**Files:**
- Create: `src/app/(dashboard)/dashboard/orders/page.tsx`
- Create: `src/app/(dashboard)/dashboard/orders/[id]/page.tsx`
- Modify: `src/components/layout/dashboard-sidebar.tsx`

- [ ] **Step 1: Create dashboard orders list page**

Server component (following existing dashboard page patterns — auth check, Prisma query, render):
- Query orders where `userId = session.user.id`, ordered by `createdAt desc`
- Include `orderItems` with product name
- Empty state: "No orders yet" with CTA to /shop
- Cards or table showing: order number, date, item count, total, status badge
- Click → link to `/dashboard/orders/[id]`

- [ ] **Step 2: Create dashboard order detail page**

"use client" component (needs clipboard API for copy buttons):
- Back button to `/dashboard/orders`
- Fetches order from `GET /api/orders/[id]` on mount
- Order number, date, status badge
- Line items with product name, quantity, price
- Activation codes in monospace with copy-to-clipboard buttons (use `navigator.clipboard.writeText()`)
- Totals: subtotal, shipping, GST, total
- Shipping address
- Tracking number (if shipped)
- Status timeline (simple: ordered → paid → processing → shipped → delivered)

- [ ] **Step 3: Add Orders link to dashboard sidebar**

In `src/components/layout/dashboard-sidebar.tsx`, add to `navItems` array:

```typescript
import { Receipt } from "lucide-react";
```

Add after "My Tags":
```typescript
  { href: "/dashboard/orders", label: "My Orders", icon: Receipt },
```

- [ ] **Step 4: Verify in browser**

Log in as a regular user, navigate to `/dashboard/orders`. Verify:
- Orders list shows user's orders
- Click into detail shows full order info with activation codes
- Sidebar shows "My Orders" link

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/orders/ src/components/layout/dashboard-sidebar.tsx
git commit -m "feat: add dashboard order history and detail pages"
```

---

## Chunk 8: End-to-End Testing + Polish

### Task 22: Seed products for development

**Files:**
- Create: `prisma/seed-products.ts`

- [ ] **Step 1: Create product seed script**

```typescript
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: "Single Smart Tag",
      description: "One QR + NFC smart tag. Perfect for your most important item.",
      slug: "single-tag",
      price: 1500,
      tagQuantity: 1,
      sortOrder: 1,
    },
    {
      name: "3-Pack Smart Tags",
      description: "Three QR + NFC smart tags. Cover your essentials and save.",
      slug: "3-pack",
      price: 3500,
      compareAtPrice: 4500,
      tagQuantity: 3,
      sortOrder: 2,
    },
    {
      name: "5-Pack Smart Tags",
      description: "Five QR + NFC smart tags. Best value for families and frequent travellers.",
      slug: "5-pack",
      price: 5000,
      compareAtPrice: 7500,
      tagQuantity: 5,
      sortOrder: 3,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log("Seeded products:", products.map((p) => p.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run seed**

```bash
npx tsx prisma/seed-products.ts
```

- [ ] **Step 3: Sync products to Stripe**

Via admin UI at `/admin/products`, click "Sync to Stripe" for each product. Or via curl if preferred.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-products.ts
git commit -m "feat: add product seed script for development"
```

---

### Task 23: End-to-end verification

- [ ] **Step 1: Start Stripe webhook listener**

In a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in `.env`.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Test the full purchase flow**

1. Navigate to `/shop` — verify products display with correct prices
2. Add "3-Pack Smart Tags" to cart — verify toast + cart count
3. Navigate to `/cart` — verify line items, totals, shipping options
4. Click "Proceed to Checkout" — verify redirect to Stripe
5. Fill in test details:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
   - Shipping address: any Australian address
6. Complete payment — verify redirect to success page
7. Verify success page shows activation codes after polling
8. Check email (if Resend is configured) for order confirmation
9. Navigate to `/dashboard/orders` — verify order appears
10. Navigate to `/admin/orders` — verify order shows with all details
11. Test marking order as Processing → Shipped (with tracking number) → Delivered
12. Verify shipping notification email sent

- [ ] **Step 4: Test edge cases**

1. `/buy` redirects to `/shop`
2. Cart with no items shows empty state
3. Guest checkout (log out first, then buy) — verify order is created without userId
4. Stripe Checkout cancel button returns to `/cart`
5. Admin can refund an order

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Stripe payment integration — shop, cart, checkout, webhooks, admin"
```
