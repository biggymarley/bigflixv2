import { notFound } from "next/navigation";
import Header from "@/components/header";
import PlatformView from "@/components/platform-view";
import { getPlatform, getPlatforms } from "@/lib/platforms";

export async function generateStaticParams() {
  const platforms = await getPlatforms();
  return platforms.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = await getPlatform(slug);
  return {
    title: platform ? `${platform.name} — BigFlix` : "Platform — BigFlix",
  };
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = await getPlatform(slug);

  if (!platform) {
    notFound();
  }

  return (
    <>
      <Header />
      <PlatformView platform={platform} />
    </>
  );
}
