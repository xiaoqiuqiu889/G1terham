import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const image = new URL("/og.png", origin).toString();
  return {
    title: "革命街没有尽头｜互动电影",
    description: "十三年后，一对曾约定离开德黑兰的恋人在伊斯坦布尔重逢。你将亲手保存、删去并交还这段往事。",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "革命街没有尽头",
      description: "亲手保存、删去并交还一段发生在德黑兰的爱情往事。",
      type: "website",
      url: origin,
      images: [{ url: image, width: 1672, height: 941, alt: "革命街没有尽头互动电影" }],
    },
    twitter: { card: "summary_large_image", title: "革命街没有尽头", description: "亲手保存、删去并交还一段发生在德黑兰的爱情往事。", images: [image] },
  };
}

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
