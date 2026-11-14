import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { language } from "@/i18n/language";
import "./globals.css";
import { AuthNotice } from "@/components/session-controls";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata = {
  title: { default: "KareGhar", template: "%s · KareGhar" },
  description: "Empowering artisans. Enabling businesses",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = await language();
  return (
    <html lang={lang}>
      <body>
        <a href="#main-content" className="skip-link">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to content"}</a>
        <SiteHeader />
        <main id="main-content" className="shell content">{children}</main>
        <SiteFooter />
        <AuthNotice hi={lang === "hi"} />
      </body>
    </html>
  );
}
