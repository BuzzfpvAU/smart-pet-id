import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ScanPageClient } from "@/components/scan/scan-page-client";
import { ItemScanPage } from "@/components/scan/item-scan-page";
import { ChecklistScanPage } from "@/components/scan/checklist-scan-page";
import { InactiveTagPage } from "@/components/scan/inactive-tag-page";
import type { FieldGroupDefinition } from "@/lib/tag-types";

interface Props {
  params: Promise<{ tagId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagId } = await params;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId },
    include: {
      pet: { select: { name: true, species: true, primaryPhotoUrl: true } },
      item: {
        select: {
          name: true,
          primaryPhotoUrl: true,
          tagType: { select: { name: true } },
        },
      },
    },
  });

  if (!tag) {
    return { title: "Tag Not Found - Tagz.au" };
  }

  if (tag.status !== "active" || (!tag.pet && !tag.item)) {
    return { title: "Activate Your Tag - Tagz.au" };
  }

  // Item-based tag
  if (tag.item) {
    return {
      title: `${tag.item.name} - Tagz.au`,
      description: `Found this ${tag.item.tagType.name.toLowerCase()}? This is ${tag.item.name}'s Tagz.au profile. Scan to contact the owner.`,
      openGraph: {
        title: `${tag.item.name} - Tagz.au`,
        description: `Found this ${tag.item.tagType.name.toLowerCase()}? Contact the owner through Tagz.au.`,
        images: tag.item.primaryPhotoUrl ? [tag.item.primaryPhotoUrl] : [],
      },
    };
  }

  // Legacy pet-based tag
  return {
    title: `${tag.pet!.name} - Tagz.au`,
    description: `Found a ${tag.pet!.species}? This is ${tag.pet!.name}'s Tagz.au profile. Scan to contact the owner.`,
    openGraph: {
      title: `${tag.pet!.name} - Tagz.au`,
      description: `Found a ${tag.pet!.species}? Contact the owner through Tagz.au.`,
      images: tag.pet!.primaryPhotoUrl ? [tag.pet!.primaryPhotoUrl] : [],
    },
  };
}

export default async function ScanPage({ params }: Props) {
  const { tagId } = await params;

  const tag = await prisma.tag.findFirst({
    where: { id: tagId },
    include: {
      pet: true,
      item: { include: { tagType: true } },
    },
  });

  if (!tag) {
    notFound();
  }

  if (tag.status !== "active" || (!tag.pet && !tag.item)) {
    return <InactiveTagPage activationCode={tag.activationCode} tagStatus={tag.status} />;
  }

  // Item-based tag (new system)
  if (tag.item) {
    const item = tag.item;
    const tagType = item.tagType;
    const visibility = (item.visibility || {}) as Record<string, boolean>;
    const defaultVisibility = (tagType.defaultVisibility || {}) as Record<string, boolean>;
    const allData = (item.data || {}) as Record<string, unknown>;
    const fieldGroups = tagType.fieldGroups as unknown as FieldGroupDefinition[];

    // Filter data by visibility
    const publicData: Record<string, unknown> = {};
    for (const group of fieldGroups) {
      for (const field of group.fields) {
        const isVisible = visibility[field.key] ?? defaultVisibility[field.key] ?? true;
        if (isVisible && allData[field.key] != null) {
          publicData[field.key] = allData[field.key];
        }
      }
    }

    // Filter field groups to only include visible fields
    const publicFieldGroups: FieldGroupDefinition[] = fieldGroups.map((group) => ({
      ...group,
      fields: group.fields.filter((field) => {
        const isVisible = visibility[field.key] ?? defaultVisibility[field.key] ?? true;
        return isVisible;
      }),
    }));

    const showPhone = visibility.ownerPhone ?? defaultVisibility.ownerPhone ?? true;
    const showEmail = visibility.ownerEmail ?? defaultVisibility.ownerEmail ?? true;
    const showAddress = visibility.ownerAddress ?? defaultVisibility.ownerAddress ?? true;

    const publicProfile = {
      name: item.name,
      tagType: {
        slug: tagType.slug,
        name: tagType.name,
        icon: tagType.icon,
        color: tagType.color,
      },
      data: publicData,
      fieldGroups: publicFieldGroups,
      photoUrls: item.photoUrls,
      primaryPhotoUrl: item.primaryPhotoUrl,
      ownerPhone: showPhone ? item.ownerPhone : null,
      ownerEmail: showEmail ? item.ownerEmail : null,
      ownerAddress: showAddress ? item.ownerAddress : null,
      rewardOffered: item.rewardOffered,
      rewardDetails: item.rewardOffered ? item.rewardDetails : null,
    };

    // Checklist type — render checklist form instead of standard scan page
    if (tagType.slug === "checklist") {
      // For checklist, always include checklistItems (needed for the form)
      const checklistProfile = {
        ...publicProfile,
        data: {
          ...publicData,
          checklistItems: allData.checklistItems, // Always pass checklist items regardless of visibility
          description: allData.description,
        },
      };
      return <ChecklistScanPage tagId={tagId} item={checklistProfile} />;
    }

    return <ItemScanPage tagId={tagId} item={publicProfile} />;
  }

  // Legacy pet-based tag
  const pet = tag.pet!;

  const publicProfile = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    photoUrls: pet.photoUrls,
    primaryPhotoUrl: pet.primaryPhotoUrl,
    medications: pet.medications,
    vaccinations: pet.vaccinations,
    allergies: pet.allergies,
    specialNeeds: pet.specialNeeds,
    foodIntolerances: pet.foodIntolerances,
    behavioralNotes: pet.behavioralNotes,
    privacyEnabled: pet.privacyEnabled,
    ...(pet.privacyEnabled
      ? {}
      : {
          ownerPhone: pet.ownerPhone,
          ownerEmail: pet.ownerEmail,
          ownerAddress: pet.ownerAddress,
          emergencyContacts: pet.emergencyContacts as { name: string; phone: string; relationship?: string }[] | null,
        }),
  };

  return <ScanPageClient tagId={tagId} pet={publicProfile} />;
}
