import { generateActivationCode } from "@/lib/auth-helpers";
import { generateShortCode } from "@/lib/shortcode";

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
