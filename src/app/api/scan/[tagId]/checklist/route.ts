import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendChecklistAlert } from "@/lib/email";

interface ChecklistItemDef {
  id: string;
  label: string;
  type: "checkbox" | "number" | "text";
  required: boolean;
}

interface ChecklistResult {
  id: string;
  label: string;
  type: string;
  value: boolean | number | string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await params;

  try {
    const { results, scannerName, scannerEmail, latitude, longitude } =
      await req.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Results are required" },
        { status: 400 }
      );
    }

    if (!scannerName || typeof scannerName !== "string" || !scannerName.trim()) {
      return NextResponse.json(
        { error: "Scanner name is required" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, status: "active" },
      include: {
        item: {
          include: {
            tagType: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!tag || !tag.item) {
      return NextResponse.json(
        { error: "Tag not found or not linked to an item" },
        { status: 404 }
      );
    }

    const item = tag.item;

    if (item.tagType.slug !== "checklist") {
      return NextResponse.json(
        { error: "This tag is not a checklist type" },
        { status: 400 }
      );
    }

    // Validate required fields
    const checklistItems = ((item.data as Record<string, unknown>)
      .checklistItems || []) as ChecklistItemDef[];

    for (const ci of checklistItems) {
      if (ci.required) {
        const result = (results as ChecklistResult[]).find(
          (r) => r.id === ci.id
        );
        if (!result) {
          return NextResponse.json(
            { error: `Missing required field: ${ci.label}` },
            { status: 400 }
          );
        }

        if (ci.type === "checkbox" && result.value !== true) {
          return NextResponse.json(
            { error: `Required checkbox not checked: ${ci.label}` },
            { status: 400 }
          );
        }

        if (
          ci.type === "number" &&
          (result.value === "" || result.value === undefined || result.value === null)
        ) {
          return NextResponse.json(
            { error: `Required number field empty: ${ci.label}` },
            { status: 400 }
          );
        }

        if (
          ci.type === "text" &&
          (!result.value ||
            (typeof result.value === "string" && !result.value.trim()))
        ) {
          return NextResponse.json(
            { error: `Required text field empty: ${ci.label}` },
            { status: 400 }
          );
        }
      }
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || undefined;

    // Create checklist submission
    const submission = await prisma.checklistSubmission.create({
      data: {
        tagId: tag.id,
        itemId: item.id,
        results: results as any,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        scannerName: scannerName.trim(),
        scannerEmail: scannerEmail || null,
        ipAddress,
        userAgent,
      },
    });

    // Also create a Scan record so scan counts still work
    await prisma.scan.create({
      data: {
        tagId: tag.id,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        ipAddress,
        userAgent,
      },
    });

    // Send email notification to owner
    try {
      await sendChecklistAlert(
        item.user.email,
        item.name,
        scannerName.trim(),
        results as ChecklistResult[],
        latitude ?? null,
        longitude ?? null,
        submission.createdAt
      );
    } catch {
      console.error("Failed to send checklist alert email");
    }

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error("Checklist submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
