import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultTagTypes } from "@/lib/tag-type-defaults";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const results = [];

    for (const tagType of defaultTagTypes) {
      const result = await prisma.tagType.upsert({
        where: { slug: tagType.slug },
        update: {
          name: tagType.name,
          description: tagType.description,
          icon: tagType.icon,
          color: tagType.color,
          fieldGroups: JSON.parse(JSON.stringify(tagType.fieldGroups)),
          defaultVisibility: JSON.parse(JSON.stringify(tagType.defaultVisibility)),
        },
        create: {
          slug: tagType.slug,
          name: tagType.name,
          description: tagType.description,
          icon: tagType.icon,
          color: tagType.color,
          fieldGroups: JSON.parse(JSON.stringify(tagType.fieldGroups)),
          defaultVisibility: JSON.parse(JSON.stringify(tagType.defaultVisibility)),
          sortOrder: defaultTagTypes.indexOf(tagType),
        },
      });
      results.push({ slug: result.slug, name: result.name });
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      tagTypes: results,
    });
  } catch (error) {
    console.error("Sync tag types error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
