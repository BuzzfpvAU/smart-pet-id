import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "./product-detail";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tagz.au";

export const dynamicParams = true;
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      longDescription: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      tagQuantity: true,
      images: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.description ||
    `Buy ${product.name} — smart QR + NFC tag from Tagz.au`;
  const image = product.images[0] || "/logo.png";

  return {
    title,
    description,
    keywords: product.metaKeywords || undefined,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: `${title} | Tagz.au`,
      description,
      url: `${SITE_URL}/shop/${slug}`,
      images: [{ url: image, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Tagz.au`,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) =>
      img.startsWith("http") ? img : `${SITE_URL}${img}`
    ),
    brand: { "@type": "Brand", name: "Tagz.au" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${slug}`,
      priceCurrency: product.currency.toUpperCase(),
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Tagz.au" },
    },
  };

  return (
    <div className="container py-12 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetail product={product} />
    </div>
  );
}
