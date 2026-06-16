import { notFound } from "next/navigation";
import Header from "@/components/header";
import PlatformView from "@/components/platform-view";
import { PLATFORMS, getPlatform } from "@/lib/platforms";

export function generateStaticParams() {
  return PLATFORMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = getPlatform(slug);
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
  const platform = getPlatform(slug);

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
