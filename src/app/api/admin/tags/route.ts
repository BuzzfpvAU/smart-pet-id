import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/shortcode";
import crypto from "crypto";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateActivationCode(): string {
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tags = await prisma.tag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        pet: { select: { name: true } },
        item: { select: { name: true, tagType: { select: { name: true } } } },
        _count: { select: { scans: true } },
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Admin tags GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count } = await req.json();

    if (!count || count < 1 || count > 500) {
      return NextResponse.json(
        { error: "Count must be between 1 and 500" },
        { status: 400 }
      );
    }

    const batchId = crypto.randomUUID();
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code: string;
      let exists = true;

      // Ensure unique codes
      do {
        code = generateActivationCode();
        const existing = await prisma.tag.findUnique({
          where: { activationCode: code },
        });
        exists = !!existing;
      } while (exists);

      await prisma.tag.create({
        data: {
          activationCode: code,
          shortCode: generateShortCode(),
          status: "inactive",
          batchId,
        },
      });

      codes.push(code);
    }

    return NextResponse.json({ codes, batchId, count: codes.length });
  } catch (error) {
    console.error("Admin tags POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
