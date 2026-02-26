import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-time database migration endpoint.
 * Adds missing columns that were added to the Prisma schema but not yet
 * applied to the production database.
 *
 * Protected by AUTH_SECRET query parameter.
 * Usage: GET /api/db-migrate?secret=YOUR_AUTH_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  // Check both common NextAuth env var names
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret || !authSecret || secret !== authSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Add locationName column to scans table if it doesn't exist
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "locationName" TEXT`
    );
    results.push("Added locationName column to scans table");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Column might already exist
    if (message.includes("already exists")) {
      results.push("locationName column already exists");
    } else {
      return NextResponse.json(
        { error: `Migration failed: ${message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    migrations: results,
  });
}
